import { authStore } from "../../../../lib/auth-store-instance.ts";
import { boardStore } from "../../../../lib/board-store-instance.ts";
import { revalidateAppPath } from "../../../../lib/revalidate-path.ts";
import { readSessionToken } from "../../../../src/auth-store.ts";
import { ValidationError } from "../../../../src/board-store.ts";
import type { UpdateListingInput } from "../../../../src/types.ts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = boardStore.findListing(id);
  return item
    ? Response.json(item)
    : Response.json({ message: "판매글을 찾을 수 없습니다." }, { status: 404 });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = authStore.findUserBySession(readSessionToken(request));
    if (!user) return Response.json({ message: "로그인이 필요합니다." }, { status: 401 });
    if (user.role !== "ADMIN") return Response.json({ message: "관리자만 판매글 사진을 수정할 수 있습니다." }, { status: 403 });

    const input = await request.json() as UpdateListingInput | null;
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new ValidationError("판매글 사진을 확인해 주세요.", { form: "수정할 정보를 객체로 전송해 주세요." });
    }
    const { id } = await params;
    const listing = boardStore.updateListing(id, input);
    revalidateAppPath(`/listings/${id}`);
    revalidateAppPath("/");
    return Response.json(listing);
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      const status = error.fields.listingId ? 404 : 400;
      return Response.json({ message: error.message, fields: error.fields }, { status });
    }
    if (error instanceof SyntaxError) return Response.json({ message: "올바른 JSON 요청이 아닙니다." }, { status: 400 });
    console.error(error);
    return Response.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
