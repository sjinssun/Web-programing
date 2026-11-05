import { boardStore } from "../../../../../lib/board-store-instance.ts";
import { catalogAdapter } from "../../../../../lib/catalog-adapter-instance.ts";
import { CatalogError } from "../../../../../src/catalog-adapter.ts";
import { USD_TO_KRW, USD_TO_KRW_BASE_DATE, usdToKrw } from "../../../../../src/exchange-rate.ts";

type EditionContext = { params: Promise<{ id: string }> };

const ERROR_STATUS = { NOT_CONFIGURED: 503, RATE_LIMITED: 429, UPSTREAM_FAILED: 502 } as const;

export async function GET(_request: Request, { params }: EditionContext) {
  try {
    const edition = boardStore.findEdition((await params).id);
    if (!edition) return Response.json({ message: "판본을 찾을 수 없습니다." }, { status: 404 });
    if (!edition.discogsReleaseId) return Response.json({ message: "연결된 해외 시세 정보가 없습니다." }, { status: 404 });

    const reference = await catalogAdapter.getMarketReference(edition.discogsReleaseId);
    const lowest = reference.lowestPrice;
    return Response.json({
      editionId: edition.id,
      numForSale: reference.numForSale,
      lowestPrice: lowest
        ? { amount: lowest.value, currency: lowest.currency, krw: lowest.currency === "USD" ? usdToKrw(lowest.value) : null }
        : null,
      exchangeRate: { usdToKrw: USD_TO_KRW, baseDate: USD_TO_KRW_BASE_DATE }
    });
  } catch (error: unknown) {
    if (error instanceof CatalogError) {
      return Response.json({ message: error.message, code: error.code }, { status: ERROR_STATUS[error.code] });
    }
    console.error(error);
    return Response.json({ message: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
