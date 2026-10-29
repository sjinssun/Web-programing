import test from "node:test";
import assert from "node:assert/strict";
import { GET as getListings, POST as createListing } from "../app/api/listings/route.ts";
import { GET as getListing, PATCH as updateListing } from "../app/api/listings/[id]/route.ts";
import { GET as getMeta } from "../app/api/meta/route.ts";
import { GET as getPriceHistory } from "../app/api/editions/[id]/price-history/route.ts";
import { GET as getRatings, PUT as putRating } from "../app/api/editions/[id]/ratings/route.ts";
import { PATCH as updateEdition } from "../app/api/editions/[id]/route.ts";
import { POST as login } from "../app/api/auth/login/route.ts";
import { POST as createEdition } from "../app/api/editions/route.ts";
import { GET as searchCatalog } from "../app/api/catalog/search/route.ts";

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

async function sessionCookieFor(email: string) {
  const response = await login(new Request("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password: "vynl1234" })
  }));
  return response.headers.get("set-cookie") ?? "";
}

test("POST /api/editions requires an admin session and creates an edition", async () => {
  const input = {
    artist: "The Beatles", title: "Abbey Road", format: "LP", year: 1969, country: "UK", label: "Apple Records",
    catalogNumber: "PCS 7088", barcode: "5099969945410", cover: "https://example.com/abbey.jpg", discogsReleaseId: 2523519
  };
  const post = (cookie: string, body: unknown) => createEdition(new Request("http://localhost/api/editions", {
    method: "POST",
    headers: { "content-type": "application/json", cookie },
    body: JSON.stringify(body)
  }));

  assert.equal((await post("", input)).status, 401);
  assert.equal((await post(await sessionCookieFor("user@vynl.kr"), input)).status, 403);

  const adminCookie = await sessionCookieFor("demo@vynl.kr");
  const invalid = await post(adminCookie, { title: "제목만" });
  assert.equal(invalid.status, 400);
  assert.ok((await invalid.json()).fields.artist);

  const created = await post(adminCookie, input);
  assert.equal(created.status, 201);
  const body = await created.json();
  assert.match(body.id, /^edition-\d+$/);
  assert.equal(body.discogsReleaseId, 2523519);

  const duplicate = await post(adminCookie, input);
  assert.equal(duplicate.status, 400);
  assert.ok((await duplicate.json()).fields.discogsReleaseId);
});

test("GET /api/catalog/search requires an admin and proxies Discogs without exposing the token", async () => {
  const originalFetch = globalThis.fetch;
  const originalToken = process.env.DISCOGS_TOKEN;
  const calls: { url: string; headers: Record<string, string> }[] = [];
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(input), headers: (init?.headers ?? {}) as Record<string, string> });
    return Response.json({ results: [{ id: 7557957, title: "Kendrick Lamar - To Pimp A Butterfly", year: "2015", country: "US", format: ["Vinyl", "LP"], label: ["Top Dawg Entertainment"], catno: "B0023464-01", barcode: ["602547311009"], cover_image: "https://i.discogs.com/tpab.jpeg", uri: "/release/7557957" }] });
  }) as typeof globalThis.fetch;

  try {
    const search = (cookie: string, query = "barcode=602547311009") => searchCatalog(new Request(`http://localhost/api/catalog/search?${query}`, { headers: { cookie } }));
    process.env.DISCOGS_TOKEN = "test-token";

    assert.equal((await search("")).status, 401);
    assert.equal((await search(await sessionCookieFor("user@vynl.kr"))).status, 403);
    const adminCookie = await sessionCookieFor("demo@vynl.kr");
    assert.equal((await search(adminCookie, "")).status, 400);
    assert.equal(calls.length, 0);

    const response = await search(adminCookie);
    assert.equal(response.status, 200);
    const text = await response.text();
    assert.equal(text.includes("test-token"), false);
    const body = JSON.parse(text);
    assert.equal(body.total, 1);
    assert.equal(body.items[0].discogsReleaseId, 7557957);
    assert.equal(body.items[0].format, "LP");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].headers.Authorization, "Discogs token=test-token");

    delete process.env.DISCOGS_TOKEN;
    assert.equal((await search(adminCookie)).status, 503);
    assert.equal(calls.length, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalToken === undefined) delete process.env.DISCOGS_TOKEN;
    else process.env.DISCOGS_TOKEN = originalToken;
  }
});
