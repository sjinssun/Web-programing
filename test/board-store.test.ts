import test from "node:test";
import assert from "node:assert/strict";
import { BoardStore, ValidationError } from "../src/board-store.ts";
import { editions, listings, priceHistory, ratings } from "../src/seed-data.ts";

function createStore() {
  return new BoardStore({ editions, listings, priceHistory, ratings });
}

test("search normalizes whitespace and case and excludes unavailable listings", () => {
  const results = createStore().findListings({ query: "  ABBEY road  " });
  assert.equal(results.length, 1);
  assert.equal(results[0].id, "listing-102");
  assert.equal(results[0].status, "ACTIVE");
});

test("edition lookup returns album information independently from listings", () => {
  const store = createStore();
  const edition = store.findEdition("edition-3");

  assert.equal(edition?.title, "Every letter I sent you.");
  assert.equal(store.findEdition("missing"), null);
  assert.notEqual(edition, editions[2], "album information must be returned as a clone");
});

test("filters include price boundaries and combine with format and condition", () => {
  const results = createStore().findListings({
    format: "LP",
    condition: "최상",
    minPrice: "38900",
    maxPrice: "78000",
    sort: "priceAsc"
  });
  assert.deepEqual(results.map(({ id }) => id), ["listing-104", "listing-107", "listing-111", "listing-109", "listing-108", "listing-101"]);
});

test("new listing requires at least one photo and condition details", () => {
  assert.throws(() => createStore().createListing({
    editionId: "edition-1",
    sellerName: "seller",
    price: 10000,
    mediaCondition: "최상",
    packageCondition: "최상",
    components: ["LP"],
    defects: "하자 없음",
    photos: []
  }), (error: unknown) => {
    if (!(error instanceof ValidationError)) return false;
    assert.ok(error instanceof ValidationError);
    assert.equal(error.fields.photos, "실제 상품 사진을 1장 이상 등록해 주세요.");
    return true;
  });
});

test("valid listing is published as ACTIVE and returned by the board", () => {
  const store = createStore();
  const created = store.createListing({
    editionId: "edition-4",
    sellerName: "jazz_house",
    price: 51000,
    shippingFee: 0,
    mediaCondition: "양호",
    packageCondition: "최상",
    sealed: false,
    components: ["LP", "이너슬리브"],
    defects: "재생에 영향 없는 미세 스크래치",
    photos: ["one", "two", "three"]
  });
  assert.equal(created.status, "ACTIVE");
  assert.equal(created.edition.title, "Kind of Blue");
  assert.equal(store.findListings({ query: "jazz_house" }).length, 0, "seller name is intentionally not searchable");
  assert.equal(store.findListings({ query: "kind of blue" }).some(({ id }) => id === created.id), true);
});

test("sealed listing only accepts unverified media condition", () => {
  assert.throws(() => createStore().createListing({
    editionId: "edition-3",
    sellerName: "sealed_shop",
    price: 99000,
    mediaCondition: "최상",
    packageCondition: "최상",
    sealed: true,
    components: ["CD"],
    defects: "하자 없음",
    photos: ["one", "two", "three"]
  }), (error: unknown) => error instanceof ValidationError && error.fields.mediaCondition.includes("미확인"));
});

test("admin dashboard summarizes all listing states and exposes newest listings", () => {
  const dashboard = createStore().getAdminDashboard();
  assert.equal(dashboard.totalListings, 11);
  assert.equal(dashboard.activeListings, 10);
  assert.equal(dashboard.inTransactionListings, 1);
  assert.equal(dashboard.recentListings[0].id, "listing-111");
});

test("admin edition updates are reflected by every listing for that edition", () => {
  const store = createStore();
  const updated = store.updateEdition("edition-2", {
    artist: "The Beatles",
    title: "Abbey Road (관리자 수정)",
    format: "LP",
    year: 1970,
    country: "UK",
    label: "Apple Records",
    catalogNumber: "PCS 7088-R",
    barcode: "EDITED-001",
    cover: "/assets/edited-cover.svg"
  });

  assert.equal(updated.title, "Abbey Road (관리자 수정)");
  assert.equal(store.findListing("listing-102")?.edition.title, updated.title);
  assert.equal(store.findListing("listing-105")?.edition.catalogNumber, "PCS 7088-R");
  assert.equal(store.findEdition("edition-2")?.cover, "/assets/edited-cover.svg");
});

test("edition updates reject missing editions and invalid metadata", () => {
  const store = createStore();
  assert.throws(
    () => store.updateEdition("missing", { title: "새 제목" }),
    (error: unknown) => error instanceof ValidationError && Boolean(error.fields.editionId)
  );
  assert.throws(
    () => store.updateEdition("edition-1", { title: " ", year: 1899, format: "Digital" }),
    (error: unknown) => error instanceof ValidationError && Boolean(error.fields.title) && Boolean(error.fields.year) && Boolean(error.fields.format)
  );
});

test("admin can replace listing photos with a single image without changing other listing data", () => {
  const store = createStore();
  const before = store.findListing("listing-101")!;
  const updated = store.updateListing("listing-101", { photos: [" new-one "] });

  assert.deepEqual(updated.photos, ["new-one"]);
  assert.equal(updated.price, before.price);
  assert.throws(
    () => store.updateListing("listing-101", { photos: [] }),
    (error: unknown) => error instanceof ValidationError && Boolean(error.fields.photos)
  );
});

test("price history is chronological and summarizes completed trade prices", () => {
  const history = createStore().getPriceHistory("edition-2");
  assert.ok(history);
  assert.equal(history.points.length, 6);
  assert.equal(history.points[0].id, "trade-201");
  assert.equal(history.latestPrice, 43000);
  assert.equal(history.lowestPrice, 38000);
  assert.equal(history.highestPrice, 43000);
  assert.equal(history.averagePrice, 40667);
  assert.equal(createStore().getPriceHistory("missing"), null);
});

test("album rating summary is edition-based and one user can update one rating", () => {
  const store = createStore();
  const initial = store.getRatingSummary("edition-1", "new-listener");
  assert.deepEqual(initial, { editionId: "edition-1", averageScore: 4.5, ratingCount: 4, userScore: null });

  const created = store.rateEdition("edition-1", "new-listener", 5);
  assert.equal(created.ratingCount, 5);
  assert.equal(created.averageScore, 4.6);
  assert.equal(created.userScore, 5);

  const updated = store.rateEdition("edition-1", "new-listener", 2);
  assert.equal(updated.ratingCount, 5, "updating a rating must not increase the participant count");
  assert.equal(updated.averageScore, 4);
  assert.equal(updated.userScore, 2);
});

test("album rating only accepts integer scores from 1 to 5", () => {
  assert.throws(
    () => createStore().rateEdition("edition-1", "listener", 4.5),
    (error: unknown) => error instanceof ValidationError && Boolean(error.fields.score)
  );
});

test("rating archive ranks editions and links an active listing", () => {
  const archive = createStore().getRatingArchive();

  assert.deepEqual(archive.slice(0, 5).map(({ edition }) => edition.id), ["edition-3", "edition-1", "edition-4", "edition-5", "edition-2"]);
  assert.equal(archive[0].rating.averageScore, 4.8);
  assert.equal(archive[0].rating.ratingCount, 4);
  assert.equal(archive[0].listingId, "listing-103");
});
