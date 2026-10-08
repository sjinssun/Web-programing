import test from "node:test";
import assert from "node:assert/strict";
import { GET as getListings, POST as createListing } from "../app/api/listings/route.ts";
import { GET as getListing, PATCH as updateListing } from "../app/api/listings/[id]/route.ts";
import { GET as getMeta } from "../app/api/meta/route.ts";
import { GET as getPriceHistory } from "../app/api/editions/[id]/price-history/route.ts";
import { GET as getRatings, PUT as putRating } from "../app/api/editions/[id]/ratings/route.ts";
import { PATCH as updateEdition } from "../app/api/editions/[id]/route.ts";
import { POST as login } from "../app/api/auth/login/route.ts";

test("GET /api/listings returns filtered active listings", async () => {
  const response = await getListings(new Request("http://localhost/api/listings?format=CD"));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.total, 2);
  assert.equal(body.items[0].edition.format, "CD");
});

test("POST /api/listings reports field validation errors", async () => {
  const loginResponse = await login(new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "demo@vynl.kr", password: "vynl1234" })
  }));
  const sessionCookie = loginResponse.headers.get("set-cookie");
  const response = await createListing(new Request("http://localhost/api/listings", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: sessionCookie ?? "" },
    body: JSON.stringify({ editionId: "missing" })
  }));
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.ok(body.fields.editionId);
  assert.ok(body.fields.photos);
});

test("POST /api/listings requires an authenticated session", async () => {
  const response = await createListing(new Request("http://localhost/api/listings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({})
  }));
  assert.equal(response.status, 401);
});

test("login rejects invalid credentials and creates a usable session", async () => {
  const invalid = await login(new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "demo@vynl.kr", password: "wrong" })
  }));
  assert.equal(invalid.status, 401);

  const authenticated = await login(new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "demo@vynl.kr", password: "vynl1234" })
  }));
  assert.equal(authenticated.status, 200);
  const body = await authenticated.json();
  assert.equal(body.user.name, "VYNL 관리자");
  assert.equal(body.user.role, "ADMIN");
  assert.match(authenticated.headers.get("set-cookie") ?? "", /HttpOnly/);

  const regularUser = await login(new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "user@vynl.kr", password: "vynl1234" })
  }));
  assert.equal(regularUser.status, 200);
  const regularBody = await regularUser.json();
  assert.equal(regularBody.user.name, "VYNL 리스너");
  assert.equal(regularBody.user.role, "USER");
});

test("GET /api/listings/:id returns listing detail and 404", async () => {
  const found = await getListing(new Request("http://localhost/api/listings/listing-101"), {
    params: Promise.resolve({ id: "listing-101" })
  });
  assert.equal(found.status, 200);
  assert.equal((await found.json()).edition.title, "다시 부르기 II");

  const missing = await getListing(new Request("http://localhost/api/listings/missing"), {
    params: Promise.resolve({ id: "missing" })
  });
  assert.equal(missing.status, 404);
});

test("GET /api/meta returns approved editions and form options", async () => {
  const response = await getMeta();
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.editions.length, 10);
  assert.deepEqual(body.formats, ["LP", "CD", "Cassette"]);
});

test("GET /api/editions/:id/price-history returns trade summary and 404", async () => {
  const found = await getPriceHistory(new Request("http://localhost/api/editions/edition-1/price-history"), {
    params: Promise.resolve({ id: "edition-1" })
  });
  assert.equal(found.status, 200);
  const history = await found.json();
  assert.equal(history.points.length, 6);
  assert.equal(history.latestPrice, 76000);

  const missing = await getPriceHistory(new Request("http://localhost/api/editions/missing/price-history"), {
    params: Promise.resolve({ id: "missing" })
  });
  assert.equal(missing.status, 404);
});

test("ratings API exposes a public summary and requires login to create or update a rating", async () => {
  const context = { params: Promise.resolve({ id: "edition-4" }) };
  const publicResponse = await getRatings(new Request("http://localhost/api/editions/edition-4/ratings"), context);
  assert.equal(publicResponse.status, 200);
  const publicSummary = await publicResponse.json();
  assert.equal(publicSummary.ratingCount, 4);
  assert.equal(publicSummary.userScore, null);

  const unauthorized = await putRating(new Request("http://localhost/api/editions/edition-4/ratings", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ score: 5 })
  }), context);
  assert.equal(unauthorized.status, 401);

  const loginResponse = await login(new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "demo@vynl.kr", password: "vynl1234" })
  }));
  const cookie = loginResponse.headers.get("set-cookie") ?? "";
  const rated = await putRating(new Request("http://localhost/api/editions/edition-4/ratings", {
    method: "PUT",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ score: 5 })
  }), context);
  assert.equal(rated.status, 200);
  const ratedSummary = await rated.json();
  assert.equal(ratedSummary.ratingCount, 5);
  assert.equal(ratedSummary.userScore, 5);
});

test("PATCH /api/editions/:id requires an admin session and updates album metadata", async () => {
  const context = { params: Promise.resolve({ id: "edition-3" }) };
  const unauthorized = await updateEdition(new Request("http://localhost/api/editions/edition-3", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ title: "관리자 수정 제목" })
  }), context);
  assert.equal(unauthorized.status, 401);

  const loginResponse = await login(new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "demo@vynl.kr", password: "vynl1234" })
  }));
  const updated = await updateEdition(new Request("http://localhost/api/editions/edition-3", {
    method: "PATCH",
    headers: { "content-type": "application/json", cookie: loginResponse.headers.get("set-cookie") ?? "" },
    body: JSON.stringify({ title: "관리자 수정 제목", year: 2017 })
  }), context);
  assert.equal(updated.status, 200);
  const body = await updated.json();
  assert.equal(body.title, "관리자 수정 제목");
  assert.equal(body.year, 2017);
});

test("PATCH /api/listings/:id requires an admin session and replaces listing photos", async () => {
  const context = { params: Promise.resolve({ id: "listing-104" }) };
  const unauthorized = await updateListing(new Request("http://localhost/api/listings/listing-104", {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ photos: ["one"] })
  }), context);
  assert.equal(unauthorized.status, 401);

  const loginResponse = await login(new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "demo@vynl.kr", password: "vynl1234" })
  }));
  const updated = await updateListing(new Request("http://localhost/api/listings/listing-104", {
    method: "PATCH",
    headers: { "content-type": "application/json", cookie: loginResponse.headers.get("set-cookie") ?? "" },
    body: JSON.stringify({ photos: ["photo-one"] })
  }), context);
  assert.equal(updated.status, 200);
  assert.deepEqual((await updated.json()).photos, ["photo-one"]);
});
