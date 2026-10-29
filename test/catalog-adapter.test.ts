import test from "node:test";
import assert from "node:assert/strict";
import { CATALOG_USER_AGENT, CatalogError, createCatalogAdapter, toCatalogCandidate } from "../src/catalog-adapter.ts";

const abbeyRoad = {
  id: 14186441,
  title: "The Beatles - Abbey Road",
  year: "2019",
  country: "Worldwide",
  format: ["Vinyl", "LP", "Album", "Reissue"],
  label: ["Apple Records", "Universal Music Group International"],
  catno: "0602577915123",
  barcode: ["Sdrm Biem", "6 02577 91512 3", "0602577915123", "LC01846"],
  cover_image: "https://i.discogs.com/abbey.jpeg",
  uri: "/release/14186441-The-Beatles-Abbey-Road"
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

function mockFetch(respond: () => Response | Promise<Response> = () => jsonResponse({ results: [abbeyRoad] })) {
  const calls: { url: URL; init: RequestInit }[] = [];
  const fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: new URL(String(input)), init: init ?? {} });
    return respond();
  }) as typeof globalThis.fetch;
  return { fetch, calls };
}

test("toCatalogCandidate maps a Discogs search result to edition fields", () => {
  assert.deepEqual(toCatalogCandidate(abbeyRoad), {
    discogsReleaseId: 14186441,
    artist: "The Beatles",
    title: "Abbey Road",
    format: "LP",
    year: 2019,
    country: "Worldwide",
    label: "Apple Records",
    catalogNumber: "0602577915123",
    barcode: "602577915123",
    cover: "https://i.discogs.com/abbey.jpeg",
    sourceUrl: "https://www.discogs.com/release/14186441-The-Beatles-Abbey-Road"
  });
});

test("toCatalogCandidate splits artist and title and strips the Discogs artist index", () => {
  const candidate = toCatalogCandidate({ ...abbeyRoad, title: "Nirvana (2) - Nevermind - Remastered" });
  assert.equal(candidate?.artist, "Nirvana");
  assert.equal(candidate?.title, "Nevermind - Remastered");
});

test("toCatalogCandidate converts supported formats and drops the rest", () => {
  assert.equal(toCatalogCandidate({ ...abbeyRoad, format: ["Vinyl", "LP"] })?.format, "LP");
  assert.equal(toCatalogCandidate({ ...abbeyRoad, format: ["CD", "Album"] })?.format, "CD");
  assert.equal(toCatalogCandidate({ ...abbeyRoad, format: ["Cassette", "Album"] })?.format, "Cassette");
  assert.equal(toCatalogCandidate({ ...abbeyRoad, format: ["File", "FLAC"] }), null);
  assert.equal(toCatalogCandidate({ ...abbeyRoad, id: undefined }), null);
});

test("toCatalogCandidate keeps only 12–13 digit barcodes", () => {
  assert.equal(toCatalogCandidate({ ...abbeyRoad, barcode: ["LC01846", "0 94638-24681 7"] })?.barcode, "094638246817");
  assert.equal(toCatalogCandidate({ ...abbeyRoad, barcode: ["009 463824 6817 A", "BIEM"] })?.barcode, "");
  assert.equal(toCatalogCandidate({ ...abbeyRoad, barcode: undefined })?.barcode, "");
});

test("toCatalogCandidate tolerates missing optional fields", () => {
  const candidate = toCatalogCandidate({ id: 1, title: "Untitled", format: ["CD"], cover_image: "https://s.discogs.com/images/spacer.gif" });
  assert.equal(candidate?.artist, "");
  assert.equal(candidate?.title, "Untitled");
  assert.equal(candidate?.year, null);
  assert.equal(candidate?.cover, "");
  assert.equal(candidate?.sourceUrl, "https://www.discogs.com/release/1");
});

test("search sends the User-Agent, token and query parameters", async () => {
  const { fetch, calls } = mockFetch();
  const adapter = createCatalogAdapter({ getToken: () => "secret", fetch });
  const items = await adapter.search({ barcode: "0 94638 24681 7", catalogNumber: " PCS 7088 ", keyword: "abbey" });

  assert.equal(items.length, 1);
  assert.equal(calls.length, 1);
  const headers = calls[0].init.headers as Record<string, string>;
  assert.equal(headers["User-Agent"], CATALOG_USER_AGENT);
  assert.equal(headers.Authorization, "Discogs token=secret");
  assert.equal(calls[0].url.pathname, "/database/search");
  assert.equal(calls[0].url.searchParams.get("type"), "release");
  assert.equal(calls[0].url.searchParams.get("barcode"), "094638246817");
  assert.equal(calls[0].url.searchParams.get("catno"), "PCS 7088");
  assert.equal(calls[0].url.searchParams.get("q"), "abbey");
});

test("search rejects without calling Discogs when the token is missing", async () => {
  const { fetch, calls } = mockFetch();
  const adapter = createCatalogAdapter({ getToken: () => undefined, fetch });
  assert.equal(adapter.isConfigured(), false);
  await assert.rejects(adapter.search({ keyword: "abbey" }), (error: unknown) => error instanceof CatalogError && error.code === "NOT_CONFIGURED");
  assert.equal(calls.length, 0);
});

test("search enforces the per-minute limit and resets after a minute", async () => {
  let clock = 1_000_000;
  const { fetch, calls } = mockFetch();
  const adapter = createCatalogAdapter({ getToken: () => "secret", fetch, now: () => clock, requestsPerMinute: 2 });

  await adapter.search({ keyword: "a" });
  clock += 30_000;
  await adapter.search({ keyword: "b" });
  await assert.rejects(adapter.search({ keyword: "c" }), (error: unknown) => error instanceof CatalogError && error.code === "RATE_LIMITED");
  assert.equal(calls.length, 2);

  clock += 30_000;
  await adapter.search({ keyword: "d" });
  assert.equal(calls.length, 3);
});

test("search maps upstream failures to catalog errors", async () => {
  const cases: [() => Response | Promise<Response>, string][] = [
    [() => jsonResponse({ message: "slow down" }, 429), "RATE_LIMITED"],
    [() => jsonResponse({ message: "boom" }, 500), "UPSTREAM_FAILED"],
    [() => new Response("not json", { status: 200 }), "UPSTREAM_FAILED"],
    [() => Promise.reject(new TypeError("network down")), "UPSTREAM_FAILED"]
  ];
  for (const [respond, code] of cases) {
    const adapter = createCatalogAdapter({ getToken: () => "secret", fetch: mockFetch(respond).fetch });
    await assert.rejects(adapter.search({ keyword: "abbey" }), (error: unknown) => error instanceof CatalogError && error.code === code);
  }
});
