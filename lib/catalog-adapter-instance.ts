import { createCatalogAdapter } from "../src/catalog-adapter.ts";
import type { CatalogAdapter } from "../src/catalog-adapter.ts";

// 토큰은 서버 환경 변수에서만 읽는다. NEXT_PUBLIC_ 접두사가 없어 브라우저 번들에 포함되지 않는다.
// 분당 요청 한도 카운터와 시세 캐시가 개발 모드 Fast Refresh 후에도 유지되도록 globalThis에 보존한다.
// CatalogAdapter 메서드가 바뀌면 CATALOG_ADAPTER_VERSION을 올려 기존 인스턴스를 교체한다.
const globalCatalog = globalThis as typeof globalThis & { __vynlCatalogAdapter?: CatalogAdapter; __vynlCatalogAdapterVersion?: number };
const CATALOG_ADAPTER_VERSION = 2;

export const catalogAdapter = globalCatalog.__vynlCatalogAdapterVersion === CATALOG_ADAPTER_VERSION && globalCatalog.__vynlCatalogAdapter
  ? globalCatalog.__vynlCatalogAdapter
  : createCatalogAdapter({ getToken: () => process.env.DISCOGS_TOKEN });

if (process.env.NODE_ENV !== "production") {
  globalCatalog.__vynlCatalogAdapter = catalogAdapter;
  globalCatalog.__vynlCatalogAdapterVersion = CATALOG_ADAPTER_VERSION;
}
