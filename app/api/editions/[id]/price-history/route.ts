import { boardStore } from "../../../../../lib/board-store-instance.ts";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const history = boardStore.getPriceHistory(id);
  if (!history) return Response.json({ message: "시세 이력을 찾을 수 없습니다." }, { status: 404 });
  return Response.json(history);
}
