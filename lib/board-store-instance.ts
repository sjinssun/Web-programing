import { BoardStore } from "../src/board-store.ts";
import { editions, listings, priceHistory, ratings } from "../src/seed-data.ts";

const globalStore = globalThis as typeof globalThis & {
  __vynlBoardStore?: BoardStore;
  __vynlBoardStoreVersion?: number;
};

const BOARD_STORE_VERSION = 4;

function isCompatibleBoardStore(value: unknown): value is BoardStore {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return [
    "getMeta",
    "findEdition",
    "findListings",
    "findListing",
    "getAdminDashboard",
    "updateEdition",
    "updateListing",
    "createListing",
    "getPriceHistory",
    "getRatingSummary",
    "getRatingArchive",
    "rateEdition"
  ].every((method) => typeof candidate[method] === "function");
}

export const boardStore = globalStore.__vynlBoardStoreVersion === BOARD_STORE_VERSION && isCompatibleBoardStore(globalStore.__vynlBoardStore)
  ? globalStore.__vynlBoardStore
  : new BoardStore({ editions, listings, priceHistory, ratings });

if (process.env.NODE_ENV !== "production") {
  globalStore.__vynlBoardStore = boardStore;
  globalStore.__vynlBoardStoreVersion = BOARD_STORE_VERSION;
}
