import { authStore } from "../../../../lib/auth-store-instance.ts";
import { catalogAdapter } from "../../../../lib/catalog-adapter-instance.ts";
import { readSessionToken } from "../../../../src/auth-store.ts";
import { CatalogError } from "../../../../src/catalog-adapter.ts";

const ERROR_STATUS = { NOT_CONFIGURED: 503, RATE_LIMITED: 429, UPSTREAM_FAILED: 502 } as const;

export async function GET(request: Request) {
  try {
    const user = authStore.findUserBySession(readSessionToken(request));
    if (!user) return Response.json({ message: "로그인이 필요합니다." }, { status: 401 });
    if (user.role !== "ADMIN") return Response.json({ message: "관리자만 외부 카탈로그를 검색할 수 있습니다." }, { status: 403 });

    const params = new URL(request.url).searchParams;
    const query = {
      barcode: params.get("barcode") ?? undefined,
      catalogNumber: params.get("catno") ?? undefined,
      keyword: params.get("q") ?? undefined
    };
    if (!query.barcode?.trim() && !query.catalogNumber?.trim() && !query.keyword?.trim()) {
      return Response.json({ message: "검색어를 입력해 주세요.", fields: { query: "barcode, catno, q 중 하나가 필요합니다." } }, { status: 400 });
    }

    const items = await catalogAdapter.search(query);
    return Response.json({ items, total: items.length });
  } catch (error: unknown) {
    if (error instanceof CatalogError) {
      return Response.json({ message: error.message, code: error.code }, { status: ERROR_STATUS[error.code] });
    }
    console.error(error);
    return Response.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
