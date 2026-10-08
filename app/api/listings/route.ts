import { ValidationError } from "../../../src/board-store.ts";
import { boardStore } from "../../../lib/board-store-instance.ts";
import type { CreateListingInput, ListingQuery } from "../../../src/types.ts";
import { authStore } from "../../../lib/auth-store-instance.ts";
import { readSessionToken } from "../../../src/auth-store.ts";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const items = boardStore.findListings(Object.fromEntries(url.searchParams) as ListingQuery);
  return Response.json({ items, total: items.length });
}

export async function POST(request: Request) {
  try {
    const user = authStore.findUserBySession(readSessionToken(request));
    if (!user) return Response.json({ message: "판매글 등록은 로그인 후 이용할 수 있습니다." }, { status: 401 });
    const input = await request.json() as CreateListingInput;
    const item = boardStore.createListing({ ...input, sellerName: user.name });
    return Response.json(item, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return Response.json({ message: error.message, fields: error.fields }, { status: 400 });
    }
    if (error instanceof SyntaxError) {
      return Response.json({ message: "올바른 JSON 요청이 아닙니다.", fields: {} }, { status: 400 });
    }
    console.error(error);
    return Response.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
