import { CONDITIONS, FORMATS, RATING_SCORES } from "./types.ts";
import type {
  AlbumRating,
  BoardMeta,
  AdminDashboard,
  Condition,
  CreateEditionInput,
  CreateListingInput,
  Edition,
  Listing,
  ListingQuery,
  ListingWithEdition,
  PriceHistory,
  PriceHistoryPoint,
  PublicCondition,
  RatingScore,
  RatingArchiveItem,
  RatingSummary,
  UpdateEditionInput,
  UpdateListingInput
} from "./types.ts";

function normalize(value: unknown): string {
  return String(value ?? "").trim().toLocaleLowerCase("ko-KR");
}

function asPrice(value: unknown): number | undefined {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : Number.NaN;
}

function isCondition(value: unknown): value is Condition {
  return typeof value === "string" && CONDITIONS.includes(value as Condition);
}

function isPublicCondition(value: unknown): value is PublicCondition {
  return isCondition(value) && value !== "미확인";
}

const EDITION_TEXT_FIELDS = ["artist", "title", "country", "label", "catalogNumber", "barcode", "cover"] as const;

// required가 false이면 전달된 필드만 검증한다(부분 수정). true이면 모든 필드가 필요하다(신규 생성).
function readEditionFields(input: UpdateEditionInput, required: boolean) {
  const errors: Record<string, string> = {};
  const values: Partial<Edition> = {};

  for (const field of EDITION_TEXT_FIELDS) {
    if (input[field] === undefined && !required) continue;
    const value = String(input[field] ?? "").trim();
    if (!value) errors[field] = "필수 정보를 입력해 주세요.";
    else values[field] = value;
  }

  if (input.format !== undefined || required) {
    if (typeof input.format !== "string" || !FORMATS.includes(input.format as Edition["format"])) {
      errors.format = "지원하는 포맷을 선택해 주세요.";
    } else {
      values.format = input.format as Edition["format"];
    }
  }

  if (input.year !== undefined || required) {
    const year = Number(input.year);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
      errors.year = "발매연도는 1900–2100 사이의 정수여야 합니다.";
    } else {
      values.year = year;
    }
  }

  return { values, errors };
}

export class ValidationError extends Error {
  fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = "ValidationError";
    this.fields = fields;
  }
}

export class BoardStore {
  private editions: Edition[];
  private listings: Listing[];
  private priceHistory: PriceHistoryPoint[];
  private ratings: AlbumRating[];
  private nextId: number;
  private nextEditionId: number;
  private nextRatingId: number;

  constructor({ editions = [], listings = [], priceHistory = [], ratings = [] }: { editions?: Edition[]; listings?: Listing[]; priceHistory?: PriceHistoryPoint[]; ratings?: AlbumRating[] } = {}) {
    this.editions = structuredClone(editions);
    this.listings = structuredClone(listings);
    this.priceHistory = structuredClone(priceHistory);
    this.ratings = structuredClone(ratings);
    this.nextId = this.listings.reduce((max, listing) => {
      const number = Number(listing.id.split("-").at(-1));
      return Number.isFinite(number) ? Math.max(max, number + 1) : max;
    }, 1);
    this.nextEditionId = this.editions.reduce((max, edition) => {
      const number = Number(edition.id.split("-").at(-1));
      return Number.isFinite(number) ? Math.max(max, number + 1) : max;
    }, 1);
    this.nextRatingId = this.ratings.reduce((max, rating) => {
      const number = Number(rating.id.split("-").at(-1));
      return Number.isFinite(number) ? Math.max(max, number + 1) : max;
    }, 1);
  }

  getMeta(): BoardMeta {
    return {
      editions: structuredClone(this.editions),
      formats: FORMATS,
      conditions: CONDITIONS.filter(isPublicCondition)
    };
  }

  findEdition(id: string): Edition | null {
    const edition = this.editions.find((item) => item.id === id);
    return edition ? structuredClone(edition) : null;
  }

  findListings(query: ListingQuery = {}): ListingWithEdition[] {
    const keyword = normalize(query.query);
    const minPrice = asPrice(query.minPrice);
    const maxPrice = asPrice(query.maxPrice);

    const results = this.listings
      .filter((listing) => listing.status === "ACTIVE")
      .map((listing) => this.enrich(listing))
      .filter((listing) => normalize([
        listing.edition.title,
        listing.edition.artist,
        listing.edition.catalogNumber,
        listing.edition.barcode
      ].join(" ")).includes(keyword))
      .filter((listing) => !query.format || listing.edition.format === query.format)
      .filter((listing) => !query.condition || [listing.mediaCondition, listing.packageCondition].includes(query.condition as Condition))
      .filter((listing) => minPrice === undefined || (!Number.isNaN(minPrice) && listing.price >= minPrice))
      .filter((listing) => maxPrice === undefined || (!Number.isNaN(maxPrice) && listing.price <= maxPrice));

    const sorters: Record<string, (a: ListingWithEdition, b: ListingWithEdition) => number> = {
      priceAsc: (a, b) => a.price - b.price || a.id.localeCompare(b.id),
      priceDesc: (a, b) => b.price - a.price || a.id.localeCompare(b.id),
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id)
    };
    results.sort(sorters[query.sort ?? ""] ?? sorters.newest);
    return results;
  }

  findListing(id: string): ListingWithEdition | null {
    const listing = this.listings.find((item) => item.id === id);
    return listing ? this.enrich(listing) : null;
  }

  getPriceHistory(editionId: string): PriceHistory | null {
    if (!this.editions.some((edition) => edition.id === editionId)) return null;
    const points = this.priceHistory
      .filter((point) => point.editionId === editionId)
      .sort((a, b) => a.tradedAt.localeCompare(b.tradedAt));
    if (points.length === 0) return null;
    const prices = points.map(({ price }) => price);
    return {
      editionId,
      points: structuredClone(points),
      averagePrice: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length),
      lowestPrice: Math.min(...prices),
      highestPrice: Math.max(...prices),
      latestPrice: prices.at(-1)!
    };
  }

  getRatingSummary(editionId: string, userId?: string): RatingSummary | null {
    if (!this.editions.some((edition) => edition.id === editionId)) return null;
    const editionRatings = this.ratings.filter((rating) => rating.editionId === editionId);
    const averageScore = editionRatings.length
      ? Math.round((editionRatings.reduce((sum, rating) => sum + rating.score, 0) / editionRatings.length) * 10) / 10
      : null;
    return {
      editionId,
      averageScore,
      ratingCount: editionRatings.length,
      userScore: editionRatings.find((rating) => rating.userId === userId)?.score ?? null
    };
  }

  getRatingArchive(): RatingArchiveItem[] {
    const activeListings = this.listings
      .filter((listing) => listing.status === "ACTIVE")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    return this.editions
      .map((edition) => ({
        edition: structuredClone(edition),
        rating: this.getRatingSummary(edition.id)!,
        listingId: activeListings.find((listing) => listing.editionId === edition.id)?.id ?? null
      }))
      .sort((a, b) =>
        (b.rating.averageScore ?? -1) - (a.rating.averageScore ?? -1)
        || b.rating.ratingCount - a.rating.ratingCount
        || a.edition.id.localeCompare(b.edition.id)
      );
  }

  rateEdition(editionId: string, userId: string, score: unknown): RatingSummary {
    if (!this.editions.some((edition) => edition.id === editionId)) {
      throw new ValidationError("평가할 판본을 찾을 수 없습니다.", { editionId: "존재하지 않는 판본입니다." });
    }
    if (typeof score !== "number" || !RATING_SCORES.includes(score as RatingScore)) {
      throw new ValidationError("별점은 1점부터 5점까지 선택해 주세요.", { score: "1–5 사이의 정수여야 합니다." });
    }
    const now = new Date().toISOString();
    const existing = this.ratings.find((rating) => rating.editionId === editionId && rating.userId === userId);
    if (existing) {
      existing.score = score as RatingScore;
      existing.updatedAt = now;
    } else {
      this.ratings.push({
        id: `rating-${this.nextRatingId++}`,
        editionId,
        userId,
        score: score as RatingScore,
        createdAt: now,
        updatedAt: now
      });
    }
    return this.getRatingSummary(editionId, userId)!;
  }

  getAdminDashboard(): AdminDashboard {
    const allListings = this.listings.map((listing) => this.enrich(listing));
    return {
      totalListings: allListings.length,
      activeListings: allListings.filter((listing) => listing.status === "ACTIVE").length,
      inTransactionListings: allListings.filter((listing) => ["CHECKOUT_RESERVED", "IN_TRANSACTION"].includes(listing.status)).length,
      unavailableListings: allListings.filter((listing) => !["ACTIVE", "CHECKOUT_RESERVED", "IN_TRANSACTION"].includes(listing.status)).length,
      recentListings: allListings.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8)
    };
  }

  updateEdition(editionId: string, input: UpdateEditionInput): Edition {
    const edition = this.editions.find((item) => item.id === editionId);
    if (!edition) {
      throw new ValidationError("수정할 판본을 찾을 수 없습니다.", { editionId: "존재하지 않는 판본입니다." });
    }

    const { values: changes, errors } = readEditionFields(input, false);

    if (Object.keys(changes).length === 0 && Object.keys(errors).length === 0) errors.form = "수정할 정보를 입력해 주세요.";
    if (Object.keys(errors).length) throw new ValidationError("앨범 정보를 확인해 주세요.", errors);

    Object.assign(edition, changes);
    return structuredClone(edition);
  }

  createEdition(input: CreateEditionInput): Edition {
    const { values, errors } = readEditionFields(input, true);

    let discogsReleaseId: number | undefined;
    if (input.discogsReleaseId !== undefined && input.discogsReleaseId !== null && input.discogsReleaseId !== "") {
      discogsReleaseId = Number(input.discogsReleaseId);
      if (!Number.isInteger(discogsReleaseId) || discogsReleaseId <= 0) {
        errors.discogsReleaseId = "Discogs 판본 ID는 양의 정수여야 합니다.";
      } else if (this.editions.some((edition) => edition.discogsReleaseId === discogsReleaseId)) {
        errors.discogsReleaseId = "이미 등록된 Discogs 판본입니다.";
      }
    }

    if (Object.keys(errors).length) throw new ValidationError("앨범 정보를 확인해 주세요.", errors);

    const edition: Edition = {
      id: `edition-${this.nextEditionId++}`,
      ...(values as Omit<Edition, "id">),
      ...(discogsReleaseId === undefined ? {} : { discogsReleaseId })
    };
    this.editions.push(edition);
    return structuredClone(edition);
  }

  updateListing(listingId: string, input: UpdateListingInput): ListingWithEdition {
    const listing = this.listings.find((item) => item.id === listingId);
    if (!listing) {
      throw new ValidationError("수정할 판매글을 찾을 수 없습니다.", { listingId: "존재하지 않는 판매글입니다." });
    }

    const errors: Record<string, string> = {};
    const photos = Array.isArray(input.photos)
      ? input.photos.filter((photo): photo is string => typeof photo === "string").map((photo) => photo.trim()).filter(Boolean)
      : [];
    if (photos.length === 0) errors.photos = "실제 상품 사진 URL을 1개 이상 입력해 주세요.";
    if (Object.keys(errors).length) throw new ValidationError("판매글 사진을 확인해 주세요.", errors);

    listing.photos = photos;
    return this.enrich(listing);
  }

  createListing(input: CreateListingInput): ListingWithEdition {
    const errors: Record<string, string> = {};
    const edition = this.editions.find((item) => item.id === input.editionId);
    const price = asPrice(input.price);
    const shippingFee = asPrice(input.shippingFee ?? 3500);
    const photos = Array.isArray(input.photos) ? input.photos.filter((photo): photo is string => typeof photo === "string" && Boolean(photo)) : [];
    const components = Array.isArray(input.components) ? input.components.filter((component): component is string => typeof component === "string" && Boolean(component)) : [];

    if (!edition) errors.editionId = "승인된 판본을 선택해 주세요.";
    if (!normalize(input.sellerName)) errors.sellerName = "판매자 이름을 입력해 주세요.";
    if (!Number.isInteger(price) || (price ?? 0) <= 0) errors.price = "가격은 1원 이상의 정수여야 합니다.";
    if (!Number.isInteger(shippingFee)) errors.shippingFee = "배송비는 0원 이상의 정수여야 합니다.";
    if (!isPublicCondition(input.packageCondition)) errors.packageCondition = "패키지 상태를 선택해 주세요.";
    if (input.sealed) {
      if (input.mediaCondition !== "미확인") errors.mediaCondition = "미개봉 상품의 미디어 상태는 미확인이어야 합니다.";
    } else if (!isPublicCondition(input.mediaCondition)) {
      errors.mediaCondition = "미디어 상태를 선택해 주세요.";
    }
    if (photos.length === 0) errors.photos = "실제 상품 사진을 1장 이상 등록해 주세요.";
    if (components.length === 0) errors.components = "구성품을 하나 이상 입력해 주세요.";
    if (!normalize(input.defects)) errors.defects = "하자 여부를 구체적으로 입력해 주세요.";

    if (Object.keys(errors).length) {
      throw new ValidationError("판매글 필수 정보를 확인해 주세요.", errors);
    }

    const listing: Listing = {
      id: `listing-${this.nextId++}`,
      editionId: edition!.id,
      sellerName: String(input.sellerName).trim(),
      price: price!,
      shippingFee: shippingFee!,
      mediaCondition: input.mediaCondition as Condition,
      packageCondition: input.packageCondition as PublicCondition,
      sealed: Boolean(input.sealed),
      components,
      defects: String(input.defects).trim(),
      photos,
      status: "ACTIVE",
      createdAt: new Date().toISOString()
    };
    this.listings.push(listing);
    return this.enrich(listing);
  }

  private enrich(listing: Listing): ListingWithEdition {
    const edition = this.editions.find((item) => item.id === listing.editionId);
    if (!edition) throw new Error(`판본을 찾을 수 없습니다: ${listing.editionId}`);
    return { ...structuredClone(listing), edition: structuredClone(edition) };
  }
}
