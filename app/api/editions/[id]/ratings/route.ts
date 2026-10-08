import { authStore } from "../../../../../lib/auth-store-instance.ts";
import { boardStore } from "../../../../../lib/board-store-instance.ts";
import { readSessionToken } from "../../../../../src/auth-store.ts";
import { ValidationError } from "../../../../../src/board-store.ts";

type RatingContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: RatingContext) {
  const { id } = await params;
  const user = authStore.findUserBySession(readSessionToken(request));
  const summary = boardStore.getRatingSummary(id, user?.id);
  return summary
    ? Response.json(summary)
    : Response.json({ message: "평가할 판본을 찾을 수 없습니다." }, { status: 404 });
}

export async function PUT(request: Request, { params }: RatingContext) {
  try {
    const user = authStore.findUserBySession(readSessionToken(request));
    if (!user) return Response.json({ message: "별점 평가는 로그인 후 이용할 수 있습니다." }, { status: 401 });
    const { id } = await params;
    const input = await request.json() as { score?: unknown };
    return Response.json(boardStore.rateEdition(id, user.id, input.score));
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      const status = error.fields.editionId ? 404 : 400;
      return Response.json({ message: error.message, fields: error.fields }, { status });
    }
    if (error instanceof SyntaxError) return Response.json({ message: "올바른 JSON 요청이 아닙니다." }, { status: 400 });
    console.error(error);
    return Response.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
