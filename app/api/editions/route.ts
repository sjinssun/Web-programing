import { authStore } from "../../../lib/auth-store-instance.ts";
import { boardStore } from "../../../lib/board-store-instance.ts";
import { revalidateAppPath } from "../../../lib/revalidate-path.ts";
import { readSessionToken } from "../../../src/auth-store.ts";
import { ValidationError } from "../../../src/board-store.ts";
import type { CreateEditionInput } from "../../../src/types.ts";

export async function POST(request: Request) {
  try {
    const user = authStore.findUserBySession(readSessionToken(request));
    if (!user) return Response.json({ message: "로그인이 필요합니다." }, { status: 401 });
    if (user.role !== "ADMIN") return Response.json({ message: "관리자만 앨범을 추가할 수 있습니다." }, { status: 403 });

    const input = await request.json() as CreateEditionInput | null;
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new ValidationError("앨범 정보를 확인해 주세요.", { form: "앨범 정보를 객체로 전송해 주세요." });
    }
    const edition = boardStore.createEdition(input);
    revalidateAppPath("/");
    revalidateAppPath("/admin/albums");
    return Response.json(edition, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof ValidationError) return Response.json({ message: error.message, fields: error.fields }, { status: 400 });
    if (error instanceof SyntaxError) return Response.json({ message: "올바른 JSON 요청이 아닙니다." }, { status: 400 });
    console.error(error);
    return Response.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
