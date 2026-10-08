import { boardStore } from "../../../lib/board-store-instance.ts";

export async function GET() {
  return Response.json(boardStore.getMeta());
}
