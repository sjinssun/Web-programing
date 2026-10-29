import type { AlbumFormat } from "./types.ts";

// 외부 음반 카탈로그(현재 Discogs) 호출을 감싸는 유일한 모듈이다.
// 화면과 Route Handler는 아래 공개 타입과 CatalogAdapter 메서드만 사용한다.

export interface CatalogCandidate {
  discogsReleaseId: number;
  artist: string;
  title: string;
  format: AlbumFormat;
  year: number | null;
  country: string;
  label: string;
  catalogNumber: string;
  barcode: string;
  cover: string;
  sourceUrl: string;
}

export interface MarketReference {
  releaseId: number;
  lowestPrice: { value: number; currency: string } | null;
  numForSale: number;
}

export interface CatalogSearchQuery {
  barcode?: string;
  catalogNumber?: string;
  keyword?: string;
}

export type CatalogErrorCode = "NOT_CONFIGURED" | "RATE_LIMITED" | "UPSTREAM_FAILED";

export class CatalogError extends Error {
  code: CatalogErrorCode;

  constructor(code: CatalogErrorCode, message: string) {
    super(message);
    this.name = "CatalogError";
    this.code = code;
  }
}

export interface CatalogAdapter {
  isConfigured(): boolean;
  search(query: CatalogSearchQuery): Promise<CatalogCandidate[]>;
  getMarketReference(releaseId: number): Promise<MarketReference>;
}

export interface CatalogAdapterOptions {
  getToken: () => string | undefined;
  fetch?: typeof globalThis.fetch;
  now?: () => number;
  requestsPerMinute?: number;
  timeoutMs?: number;
  marketCacheTtlMs?: number;
  marketFailureTtlMs?: number;
}

export const CATALOG_USER_AGENT = "VYNL/0.1 +https://github.com/sjinssun/Web-programing";
const API_BASE = "https://api.discogs.com";
const SITE_BASE = "https://www.discogs.com";
const SEARCH_LIMIT = 10;
const MARKET_CURRENCY = "USD";

export const CATALOG_SOURCE_NAME = "Discogs";

export function catalogMarketUrl(releaseId: number): string {
  return `${SITE_BASE}/sell/release/${releaseId}`;
}

interface DiscogsSearchResult {
  id?: unknown;
  title?: unknown;
  year?: unknown;
  country?: unknown;
  format?: unknown;
  label?: unknown;
  catno?: unknown;
  barcode?: unknown;
  cover_image?: unknown;
  uri?: unknown;
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function toFormat(formats: string[]): AlbumFormat | null {
  if (formats.includes("Vinyl")) return "LP";
  if (formats.includes("CD")) return "CD";
  if (formats.includes("Cassette")) return "Cassette";
  return null;
}

// Discogs는 동명이인 아티스트를 "Nirvana (2)"처럼 번호로 구분한다.
function stripArtistIndex(artist: string): string {
  return artist.replace(/\s\(\d+\)$/, "");
}

// barcode 배열에는 매트릭스 각인 등 바코드가 아닌 식별자도 섞여 있으므로 12–13자리 숫자만 고른다.
function pickBarcode(values: string[]): string {
  for (const value of values) {
    const digits = value.replace(/[\s-]/g, "");
    if (/^\d{12,13}$/.test(digits)) return digits;
  }
  return "";
}

export function toCatalogCandidate(result: DiscogsSearchResult): CatalogCandidate | null {
  const id = Number(result.id);
  const format = toFormat(strings(result.format));
  if (!Number.isInteger(id) || id <= 0 || !format) return null;

  const fullTitle = typeof result.title === "string" ? result.title : "";
  const separator = fullTitle.indexOf(" - ");
  const artist = separator >= 0 ? stripArtistIndex(fullTitle.slice(0, separator).trim()) : "";
  const title = separator >= 0 ? fullTitle.slice(separator + 3).trim() : fullTitle.trim();
  const year = Number(result.year);
  const cover = typeof result.cover_image === "string" && !result.cover_image.endsWith("spacer.gif") ? result.cover_image : "";

  return {
    discogsReleaseId: id,
    artist,
    title,
    format,
    year: Number.isInteger(year) && year > 0 ? year : null,
    country: typeof result.country === "string" ? result.country : "",
    label: strings(result.label)[0] ?? "",
    catalogNumber: typeof result.catno === "string" && result.catno !== "none" ? result.catno : "",
    barcode: pickBarcode(strings(result.barcode)),
    cover,
    sourceUrl: typeof result.uri === "string" ? `${SITE_BASE}${result.uri}` : `${SITE_BASE}/release/${id}`
  };
}

interface DiscogsMarketStats {
  lowest_price?: { value?: unknown; currency?: unknown } | null;
  num_for_sale?: unknown;
  blocked_from_sale?: unknown;
}

export function toMarketReference(releaseId: number, stats: DiscogsMarketStats): MarketReference {
  const lowest = stats.lowest_price;
  const value = Number(lowest?.value);
  const hasPrice = stats.blocked_from_sale !== true && Number.isFinite(value) && value > 0 && typeof lowest?.currency === "string";
  const numForSale = Number(stats.num_for_sale);
  return {
    releaseId,
    lowestPrice: hasPrice ? { value, currency: lowest!.currency as string } : null,
    numForSale: Number.isInteger(numForSale) && numForSale > 0 ? numForSale : 0
  };
}

export function createCatalogAdapter({
  getToken,
  fetch = (...args) => globalThis.fetch(...args),
  now = Date.now,
  requestsPerMinute = 60,
  timeoutMs = 8000,
  marketCacheTtlMs = 6 * 60 * 60_000,
  marketFailureTtlMs = 10 * 60_000
}: CatalogAdapterOptions): CatalogAdapter {
  let windowStart = 0;
  let requestCount = 0;
  // 같은 판본의 시세를 매번 호출하지 않도록 성공은 6시간, 외부 장애는 10분 동안 캐시한다.
  // 한도 초과와 토큰 미설정은 캐시하지 않는다.
  const marketCache = new Map<number, { expiresAt: number; value?: MarketReference; error?: CatalogError }>();
  const marketInFlight = new Map<number, Promise<MarketReference>>();

  function reserveRequest() {
    const current = now();
    if (current - windowStart >= 60_000) {
      windowStart = current;
      requestCount = 0;
    }
    if (requestCount >= requestsPerMinute) {
      throw new CatalogError("RATE_LIMITED", "외부 카탈로그 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.");
    }
    requestCount += 1;
  }

  async function request(path: string, params: Record<string, string>): Promise<unknown> {
    const token = getToken()?.trim();
    if (!token) throw new CatalogError("NOT_CONFIGURED", "외부 카탈로그 연동이 설정되지 않았습니다.");
    reserveRequest();

    const url = new URL(path, API_BASE);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          "User-Agent": CATALOG_USER_AGENT,
          Authorization: `Discogs token=${token}`,
          Accept: "application/json"
        },
        signal: AbortSignal.timeout(timeoutMs)
      });
    } catch {
      throw new CatalogError("UPSTREAM_FAILED", "외부 카탈로그에 연결하지 못했습니다.");
    }
    if (response.status === 429) {
      throw new CatalogError("RATE_LIMITED", "외부 카탈로그 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.");
    }
    if (!response.ok) {
      throw new CatalogError("UPSTREAM_FAILED", `외부 카탈로그 응답 오류 (${response.status})`);
    }
    try {
      return await response.json();
    } catch {
      throw new CatalogError("UPSTREAM_FAILED", "외부 카탈로그 응답을 해석하지 못했습니다.");
    }
  }

  return {
    isConfigured: () => Boolean(getToken()?.trim()),

    async search(query) {
      const params: Record<string, string> = { type: "release", per_page: String(SEARCH_LIMIT) };
      const barcode = query.barcode?.replace(/[\s-]/g, "");
      if (barcode) params.barcode = barcode;
      if (query.catalogNumber?.trim()) params.catno = query.catalogNumber.trim();
      if (query.keyword?.trim()) params.q = query.keyword.trim();

      const body = await request("/database/search", params) as { results?: unknown };
      const results = Array.isArray(body?.results) ? body.results as DiscogsSearchResult[] : [];
      return results
        .map(toCatalogCandidate)
        .filter((candidate): candidate is CatalogCandidate => candidate !== null);
    },

    async getMarketReference(releaseId) {
      const cached = marketCache.get(releaseId);
      if (cached && cached.expiresAt > now()) {
        if (cached.error) throw cached.error;
        return cached.value!;
      }
      const pending = marketInFlight.get(releaseId);
      if (pending) return pending;

      const task = (async () => {
        try {
          const body = await request(`/marketplace/stats/${releaseId}`, { curr_abbr: MARKET_CURRENCY }) as DiscogsMarketStats;
          const value = toMarketReference(releaseId, body ?? {});
          marketCache.set(releaseId, { expiresAt: now() + marketCacheTtlMs, value });
          return value;
        } catch (error) {
          if (error instanceof CatalogError && error.code === "UPSTREAM_FAILED") {
            marketCache.set(releaseId, { expiresAt: now() + marketFailureTtlMs, error });
          }
          throw error;
        } finally {
          marketInFlight.delete(releaseId);
        }
      })();
      marketInFlight.set(releaseId, task);
      return task;
    }
  };
}
