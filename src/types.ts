export const FORMATS = ["LP", "CD", "Cassette"] as const;
export const CONDITIONS = ["최상", "양호", "사용감 있음", "미확인"] as const;
export const RATING_SCORES = [1, 2, 3, 4, 5] as const;

export type AlbumFormat = (typeof FORMATS)[number];
export type Condition = (typeof CONDITIONS)[number];
export type PublicCondition = Exclude<Condition, "미확인">;
export type ListingStatus = "DRAFT" | "ACTIVE" | "CHECKOUT_RESERVED" | "IN_TRANSACTION" | "SOLD" | "WITHDRAWN" | "BLOCKED";
export type ListingSort = "newest" | "priceAsc" | "priceDesc";
export type RatingScore = (typeof RATING_SCORES)[number];

export interface Edition {
  id: string;
  artist: string;
  title: string;
  format: AlbumFormat;
  year: number;
  country: string;
  label: string;
  catalogNumber: string;
  barcode: string;
  cover: string;
}

export interface Listing {
  id: string;
  editionId: string;
  sellerName: string;
  price: number;
  shippingFee: number;
  mediaCondition: Condition;
  packageCondition: PublicCondition;
  sealed: boolean;
  components: string[];
  defects: string;
  photos: string[];
  status: ListingStatus;
  createdAt: string;
}

export interface ListingWithEdition extends Listing {
  edition: Edition;
}

export interface PriceHistoryPoint {
  id: string;
  editionId: string;
  price: number;
  tradedAt: string;
}

export interface PriceHistory {
  editionId: string;
  points: PriceHistoryPoint[];
  averagePrice: number;
  lowestPrice: number;
  highestPrice: number;
  latestPrice: number;
}

export interface AlbumRating {
  id: string;
  editionId: string;
  userId: string;
  score: RatingScore;
  createdAt: string;
  updatedAt: string;
}

export interface RatingSummary {
  editionId: string;
  averageScore: number | null;
  ratingCount: number;
  userScore: RatingScore | null;
}

export interface RatingArchiveItem {
  edition: Edition;
  rating: RatingSummary;
  listingId: string | null;
}

export interface ListingQuery {
  query?: string;
  format?: string;
  condition?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
}

export interface CreateListingInput {
  editionId?: unknown;
  sellerName?: unknown;
  price?: unknown;
  shippingFee?: unknown;
  mediaCondition?: unknown;
  packageCondition?: unknown;
  sealed?: unknown;
  components?: unknown;
  defects?: unknown;
  photos?: unknown;
}

export interface UpdateEditionInput {
  artist?: unknown;
  title?: unknown;
  format?: unknown;
  year?: unknown;
  country?: unknown;
  label?: unknown;
  catalogNumber?: unknown;
  barcode?: unknown;
  cover?: unknown;
}

export interface UpdateListingInput {
  photos?: unknown;
}

export interface BoardMeta {
  editions: Edition[];
  formats: readonly AlbumFormat[];
  conditions: readonly PublicCondition[];
}

export interface AdminDashboard {
  totalListings: number;
  activeListings: number;
  inTransactionListings: number;
  unavailableListings: number;
  recentListings: ListingWithEdition[];
}
