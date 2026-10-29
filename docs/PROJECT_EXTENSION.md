# VYNL Project Extension Reference

구현을 확장할 때 필요한 현재 코드 경계와 공개 인터페이스를 기록한다. 각 구현 증분이 끝날 때 이 문서를 갱신한다.

## 실행 구조

- 프레임워크: TypeScript 7, Next.js 16 App Router, React 19
- 로컬 개발 서버: `npm run dev`는 `localhost`에만 바인딩하므로 같은 네트워크의 기기에서는 접속할 수 없다.
- TypeScript 정책: `tsconfig.json`의 `strict: true`, `allowJs: false`
- 페이지: 별점 아카이브 홈 `app/page.tsx`, 마켓 라우트 `app/market/page.tsx`, 판매글 상세 `app/listings/[id]/page.tsx`, 클라이언트 마켓 UI `app/market-page.tsx`
- 공통 레이아웃과 메타데이터: `app/layout.tsx`
- Route Handler: `app/api/**/route.ts`
- 전역 스타일: `public/styles.css`, 정적 자산: `public/assets/`
- UI 스타일: 화이트 갤러리 배경과 오렌지 포인트(`#ff5a1f`), `Space Grotesk`/`DM Mono` 타이포그래피를 `public/styles.css`에서 공통 토큰으로 사용한다.
- 저장소 싱글턴: `lib/board-store-instance.ts`
- 인증 저장소 싱글턴: `lib/auth-store-instance.ts`
- 도메인 타입: `src/types.ts`
- 데이터: `src/seed-data.ts`의 초기 데이터와 프로세스 메모리 저장
- 홈 샘플 데이터: 판본 10개와 판매글 11개를 제공한다. 대표 커버와 샘플 판매 사진 경로는 `src/seed-data.ts`에서 관리하며, 사용자가 제공한 실제 커버 이미지는 `public/assets/`에 있다.
- Discogs 연결: `Edition.discogsReleaseId`(선택). 시드는 바코드가 Discogs 판본의 바코드 목록과 정확히 일치하고 관리자가 후보를 확정한 `edition-6`(1813006), `edition-7`(4570366), `edition-8`(7557957)만 연결되어 있다. 나머지 시드는 Discogs 바코드 검색 결과가 없어 연결하지 않았다.
- 시세 데이터: `src/seed-data.ts`의 `priceHistory` 데모 체결 이력. 실제 주문이 완료되면 주문 스냅샷 가격을 체결 이력 저장소에 기록하는 구조로 교체한다.
- 별점 데이터: `src/seed-data.ts`의 `ratings` 데모 평가. 평점은 판매글이 아닌 판본(`editionId`)에 귀속되고 사용자·판본 조합당 하나만 유지한다.
- 테스트: Node.js 내장 테스트 러너, `test/*.test.ts`
- 코드 학습용 전체 구조 문서: `docs/ARCHITECTURE_GUIDE.md`에 계층, 라우트, 도메인 관계, 요청 흐름, 파일별 역할과 추천 학습 순서를 정리한다.

## 클래스와 함수

### `BoardStore` (`src/board-store.ts`)

- `getMeta()`: 판매 등록 폼에 필요한 승인 판본, 매체, 상태 선택지를 반환한다.
- `findListings(query)`: 활성 판매글만 검색·필터·정렬한다.
- `findListing(id)`: 상태와 관계없이 단일 판매글을 판본 정보와 함께 반환한다.
- `getAdminDashboard()`: 모든 판매글의 상태별 수와 최근 판매글 최대 8개를 반환한다.
- `createEdition(input)`: 관리자 추가 API가 전달한 판본의 모든 메타데이터(제목·아티스트·포맷·연도·국가·레이블·카탈로그 번호·바코드·썸네일)를 필수로 검증하고 `edition-N` ID로 추가한다. 선택 필드 `discogsReleaseId`는 양의 정수여야 하며 이미 등록된 Discogs 판본이면 거부한다. `updateEdition`과 필드 검증 함수 `readEditionFields(input, required)`를 공유한다.
- `updateEdition(editionId, input)`: 관리자 편집 API가 전달한 판본 메타데이터와 대표 썸네일 URL을 검증하고 수정한다. 같은 판본을 참조하는 홈·앨범 정보·판매글에 반영된다.
- `updateListing(listingId, input)`: 관리자 편집 API가 현재 판매글의 실물 사진 URL을 1장 이상으로 검증하고 교체한다.
- `createListing(input)`: 필수 입력을 검증하고 `ACTIVE` 판매글을 생성한다.
- `getPriceHistory(editionId)`: 판본별 체결가를 시간순으로 반환하고 최근가·평균가·최저가·최고가를 계산한다.
- `getRatingSummary(editionId, userId?)`: 판본의 평균 별점, 참여 인원과 선택적으로 현재 사용자의 별점을 반환한다.
- `getRatingArchive()`: 전체 판본을 평균 별점·평가 수 순으로 정렬하고 홈 카드가 이동할 수 있는 최신 활성 판매글 ID를 함께 반환한다.
- `rateEdition(editionId, userId, score)`: 1–5점 정수 평가를 생성하거나 기존 사용자 평가를 수정한다.
- 영구 DB를 연결할 때 이 클래스의 공개 메서드를 보존한 저장소 구현으로 교체할 수 있다.

### `ValidationError` (`src/board-store.ts`)

- 사용자 입력 오류를 `fields` 객체와 함께 표현한다.
- HTTP 계층에서 상태 코드 `400`으로 변환된다.

### `boardStore` (`lib/board-store-instance.ts`)

- Route Handler와 서버 컴포넌트가 공유하는 프로세스 단위 저장소다.
- 개발 모드 Fast Refresh 중 중복 생성을 피하기 위해 `globalThis`에 보존한다. Next.js의 서로 다른 서버 번들에서는 클래스 생성자 식별자가 달라질 수 있으므로 `instanceof`가 아니라 필수 공개 메서드 호환성으로 기존 인스턴스를 판별한다.
- 현재 `BOARD_STORE_VERSION`은 `5`다(`Edition.discogsReleaseId` 시드 추가).
- `BOARD_STORE_VERSION`이 바뀌면 개발 서버의 기존 메모리 인스턴스를 새 시드 데이터로 한 번 교체한다. 시드 구조를 바꿀 때 이 값을 올린다.
- 영구 저장소를 도입하면 이 모듈의 export를 DB 기반 구현으로 교체한다.

### `AuthStore` (`src/auth-store.ts`)

- 프로토타입 계정과 서버 메모리 세션을 관리한다. 일반 사용자 데모 계정은 `user@vynl.kr` / `vynl1234`, 관리자 데모 계정은 `demo@vynl.kr` / `vynl1234`다.
- 로그인 성공 시 `vynl_session` HttpOnly 쿠키를 7일 동안 발급한다.
- `readSessionToken()`으로 Route Handler에서 쿠키를 읽고, `authStore.findUserBySession()`으로 현재 사용자를 확인한다.
- 프로덕션에서는 이 저장소를 영구 사용자 DB, 비밀번호 재설정·가입·연락처 인증, 세션 만료/폐기 저장소로 교체해야 한다.
- `User.role`은 현재 `USER` 또는 `ADMIN`이다. `user@vynl.kr`은 `USER`, `demo@vynl.kr`은 `ADMIN` 권한을 가진다.

### 외부 카탈로그 어댑터 (`src/catalog-adapter.ts`)

- Discogs 호출을 감싸는 유일한 모듈이다. 화면·Route Handler는 `CatalogCandidate`, `CatalogError`, `CatalogAdapter` 인터페이스만 사용하므로 다른 API로 교체할 때 이 파일만 바꾼다.
- `createCatalogAdapter({ getToken, fetch?, now?, requestsPerMinute?, timeoutMs? })`: 테스트는 `fetch`·`now`를 주입한다.
- `search({ barcode?, catalogNumber?, keyword? })`: Discogs `/database/search?type=release` 결과를 Edition 필드로 변환한다. `Vinyl`→`LP`, `CD`, `Cassette` 외 포맷은 제외하고, 제목은 `"Artist - Title"`을 분리하며 아티스트 동명이인 번호 `(2)`를 제거한다. 레이블은 첫 항목, 바코드는 12–13자리 숫자 항목만 사용한다(Discogs 바코드 배열에는 매트릭스 각인이 섞여 있고 바코드 검색도 부분 일치한다). 국가는 Discogs 영문 표기를 그대로 둔다.
- 모든 요청에 `CATALOG_USER_AGENT`(`VYNL/0.1 +https://github.com/sjinssun/Web-programing`)와 `Authorization: Discogs token=...`을 보낸다. 고정 1분 창으로 분당 60회를 넘기면 대기하지 않고 `RATE_LIMITED`를 던진다.
- 오류 코드: `NOT_CONFIGURED`(토큰 없음), `RATE_LIMITED`(로컬 한도 또는 Discogs 429), `UPSTREAM_FAILED`(네트워크·타임아웃 8초·비정상 응답).
- 싱글턴: `lib/catalog-adapter-instance.ts`의 `catalogAdapter`. `process.env.DISCOGS_TOKEN`을 요청 시점에 서버에서만 읽는다.

## HTTP 엔드포인트

| Method | Path | 설명 |
| --- | --- | --- |
| `GET` | `/api/meta` | 승인 판본과 폼 선택지 조회 |
| `GET` | `/api/listings` | 활성 판매글 목록 조회 |
| `GET` | `/api/listings/:id` | 판매글 상세 조회 |
| `PATCH` | `/api/listings/:id` | 관리자 전용 판매글 사진 수정 |
| `PATCH` | `/api/editions/:id` | 관리자 전용 판본 메타데이터 수정 |
| `POST` | `/api/editions` | 관리자 전용 판본 추가 |
| `GET` | `/api/catalog/search` | 관리자 전용 외부 카탈로그(Discogs) 판본 검색 |
| `GET` | `/api/editions/:id/price-history` | 판본의 체결가 이력과 요약 시세 조회 |
| `GET` | `/api/editions/:id/ratings` | 판본의 공개 별점 요약과 로그인 사용자의 평가 조회 |
| `PUT` | `/api/editions/:id/ratings` | 로그인 사용자의 판본 별점 생성·수정 |
| `POST` | `/api/listings` | 판매글 생성 및 공개 |
| `POST` | `/api/auth/login` | 이메일·비밀번호 로그인 및 세션 쿠키 발급 |
| `GET` | `/api/auth/session` | 현재 로그인 사용자 조회 |
| `DELETE` | `/api/auth/logout` | 서버 세션 폐기 및 쿠키 만료 |

## 관리자 화면

- 경로: `/admin` (`app/admin/page.tsx`)
- 접근 제어: 서버에서 `vynl_session`을 확인해 `ADMIN` 역할이 아니면 `/`로 이동시킨다.
- 메인 화면에서 `ADMIN` 계정이 로그인하면 클라이언트가 자동으로 `/admin`으로 이동시킨다.
- 제공 범위: 전체·판매 중·거래 진행·비공개/완료 판매글 수, 최근 판매글 8개의 가격·상태·등록일 조회. 각 행의 `상세·수정` 링크는 해당 판매글 상세 URL로 이동한다.
- 판매글 상세에서 관리자에게만 `앨범 페이지 수정` 버튼이 표시된다. `app/listings/[id]/admin-edition-editor.tsx`의 네이티브 `<dialog>`에서 제목·아티스트·포맷·연도·국가·레이블·카탈로그 번호·바코드와 실물 사진 URL을 편집한다.
- UI 노출과 별개로 `PATCH /api/editions/:id`가 세션의 `ADMIN` 역할을 다시 검사한다. 같은 `editionId`를 공유하는 모든 판매글에 판본 수정이 반영된다.
- 실물 사진은 판본 공통 정보가 아니라 매물별 정보이므로 `PATCH /api/listings/:id`로 별도 저장되며 현재 판매글에만 반영된다. 현재 프로토타입은 파일 업로드 대신 한 줄당 하나의 이미지 URL을 사용한다.
- 판매글 상태 변경, 차단, 신고 처리, 판본 승인, 주문·환불·정산은 아직 제공하지 않는다. 다음 증분에서 역할 권한을 다시 확인하는 전용 API로 추가해야 한다.

### 앨범 정보 관리

- 경로: `/admin/albums` (`app/admin/albums/page.tsx`). 서버 컴포넌트가 `vynl_session`을 확인하며 `ADMIN`이 아니면 `/`로 이동시킨다.
- 상단 `앨범 추가` 영역(`app/admin/albums/edition-create-form.tsx`, 클라이언트 컴포넌트)은 바코드·카탈로그 번호·키워드로 `GET /api/catalog/search`를 호출하고, 결과를 클릭하면 폼을 채운다. 관리자가 수정한 뒤 `POST /api/editions`로 저장하고 페이지를 새로고침한다. 검색이 실패하거나 토큰이 없어도 직접 입력해 저장할 수 있다. 스타일은 `public/styles.css`의 `edition-create-*`, `catalog-search`, `catalog-results` 클래스다.
- 전체 판본의 제목·아티스트·판본·별점·판매 중 매물 수를 표시하고 각 `/albums/:editionId`의 `상세·수정`으로 연결한다.
- 앨범 정보 페이지는 관리자 세션에만 `앨범 페이지 수정` 버튼을 표시한다. 기존 `AdminEditionEditor`를 메타데이터 전용 모드로 재사용하며 제목·판본 정보와 홈/앨범 페이지 공통 썸네일 URL을 수정한다. 판매글 상세에서 사용할 때만 매물별 실물 사진 입력을 함께 표시한다.
- 저장 요청은 기존 관리자 전용 `PATCH /api/editions/:id`를 사용한다. API가 권한을 다시 확인하고 홈, 앨범 정보, 판매글 상세, 두 관리자 화면을 재검증한다.

## 홈과 마켓

- `/`는 헤더 바로 아래 검색창과 `오늘의 신보`(`NEW RELEASE`), `COMMUNITY RATINGS` 두 섹션을 순서대로 표시한다. 검색 폼은 `GET /?q=검색어`를 사용하며 앨범명·아티스트·카탈로그 번호·바코드를 기준으로 두 섹션을 함께 필터링한다. 홈 목록은 장터 판매글이 아니라 판본 아카이브 데이터만 사용한다. `오늘의 신보`는 최근 추가 순서의 판본 5개를, `COMMUNITY RATINGS`는 신작 5개를 제외한 평균 별점 상위 판본 5개를 선택한다. 두 섹션 모두 데스크톱에서 한 행에 앨범 5개를 배치하고 커버 아래에 앨범 정보를 표시하며, 모든 카드는 `/albums/:editionId` 앨범 정보 페이지로 이동한다.
- `/market`은 기존 검색·필터·정렬·로그인·판매 등록 기능을 그대로 제공한다. 서버 진입점은 `app/market/page.tsx`, 클라이언트 UI는 `app/market-page.tsx`다.
- 홈과 마켓 헤더에는 `홈`, `마켓` 탭이 있으며 현재 경로를 활성 상태로 표시한다. 상세페이지의 `마켓으로`와 관리자 화면의 `마켓으로` 링크는 `/market`으로 이동한다.
- 홈은 서버에서 현재 세션 역할을 확인하고 `ADMIN` 사용자에게만 헤더의 `관리자` 탭을 표시한다.
- 홈 헤더의 우측 버튼은 `/mypage`로 이동한다. 최소 마이페이지 진입 화면은 `app/mypage/page.tsx`에 있으며, 세션이 있으면 계정 이름·이메일·역할을 표시하고 비로그인 상태에는 마켓 로그인 안내를 표시한다. 내 별점·판매 내역 조회는 아직 연결하지 않았다.
- 홈 화면 스타일 진입점은 `public/styles.css`의 `new-release-*`, `archive-*` 클래스다. 주요 클래스는 `archive-search-section`, `archive-search`, `new-release`, `new-release-grid`, `rating-archive`, `archive-section-heading`, `archive-grid`, `archive-card`다.

## 앨범 정보 화면

- 경로: `/albums/:editionId` (`app/albums/[id]/page.tsx`)
- `BoardStore.findEdition()`으로 판매글과 독립된 판본 정보를 조회하고 커버·아티스트·제목·발매연도·국가·레이블·카탈로그 번호·바코드와 판본 별점을 표시한다.
- 별점 입력은 기존 `app/listings/[id]/rating-widget.tsx`를 재사용하며 판본의 `editionId`로 저장된다.
- 하단 장터 영역은 해당 판본의 활성 판매글 수를 표시하고, 매물이 있으면 별도의 `/listings/:id`로 이동한다. 존재하지 않는 판본 ID는 404를 반환한다.

## 판매글 상세 화면

- 경로: `/listings/:id` (`app/listings/[id]/page.tsx`)
- 마켓의 판매글 카드는 상세 URL로 직접 이동하므로 새로고침과 URL 공유가 가능하다.
- 서버에서 `BoardStore.findListing()`과 `getPriceHistory()`를 호출해 판매글, 판본, 시세를 함께 렌더링한다.
- 상세 상단은 900px 초과 화면에서 정사각형 실물 사진과 제목·별점·시세 영역을 좌우로 배치한다. 왼쪽 열은 상세 영역 너비의 `47.5%`를 사용하되 최소 `480px`, 최대 상세 영역 기준 약 `590px`이며, 캐러셀은 `width: 100%`와 `aspect-ratio: 1 / 1`로 프레임 너비와 높이가 항상 같이 변한다. 상단 그리드와 오른쪽 정보 영역에는 인라인 `height: auto`도 지정해 창 크기 변경 후 과거의 `480px` 높이 규칙이 남더라도 캐러셀이 부모 밖으로 넘치지 않고 두 영역이 같은 행 높이를 사용한다. 앨범 이미지는 `object-fit: contain`으로 원본 비율을 보존한다. 900px 이하에서는 사진과 정보가 한 열로 전환되고 사진은 최대 `480px`의 정사각형으로 표시된다. 상태·구성품·하자·구매 안내는 하단 정보 영역에 둔다.
- 오른쪽 상품 영역은 최근 거래가와 `그래프 보기` 버튼만 표시하며, 시세 그래프는 `app/listings/[id]/price-history-dialog.tsx`의 네이티브 `<dialog>`에서 연다.
- 실물 사진은 `app/listings/[id]/photo-carousel.tsx`에서 현재 사진 한 장만 렌더링한다. 좌우 버튼·키보드 방향키·모바일 스와이프로 사진을 바꾸며 가로 전환 애니메이션을 적용한다. 캐러셀 핵심 스타일은 `photo-carousel.module.css`에 분리되어 있으며, 캐러셀 너비를 기준으로 `aspect-ratio: 1 / 1`이 높이를 계산하므로 확대 시에도 프레임과 사진 비율이 어긋나지 않는다. Safari에 이전 전역 `min-height` 규칙이 남아 있어도 세로만 늘어나지 않도록 같은 정사각형 제약을 캐러셀 루트의 인라인 스타일에도 적용한다.
- 시세 SVG 컴포넌트: `app/listings/[id]/price-history-chart.tsx`
- SVG 거래 지점의 날짜·가격 접근성 정보는 React SSR hydration이 일치하도록 `aria-label`에 제공한다.
- `app/listings/[id]/rating-widget.tsx`는 평균·참여 수를 표시하며 별 버튼의 `aria-label`과 `aria-pressed`로 키보드·스크린리더 평가를 지원한다.
- 관리자 세션에는 `admin-edition-editor.tsx`가 표시된다. 저장 후에는 전체 문서를 새로고침해 수정 데이터를 표시하고, Safari에서 RSC만 갱신할 때 상세페이지 CSS가 누락되는 현상을 방지한다.
- 존재하지 않는 판매글 ID는 Next.js `notFound()`로 404 화면을 반환한다.

`GET /api/catalog/search`: 세션의 `ADMIN` 역할을 다시 검사한다(401/403). `barcode`, `catno`, `q` 중 하나 이상이 필요하며(없으면 400) `{ items: CatalogCandidate[], total }`을 반환한다. 어댑터 오류는 `NOT_CONFIGURED` 503, `RATE_LIMITED` 429, `UPSTREAM_FAILED` 502로 변환한다.

`POST /api/editions`: 세션의 `ADMIN` 역할을 다시 검사한다(401/403). 성공 시 `201`과 생성된 `Edition`을 반환하고 홈·`/admin/albums`를 재검증한다. 검증 오류와 중복 `discogsReleaseId`는 `400`과 `fields`로 반환한다.

엔드포인트 구현 위치:

- `/api/meta`: `app/api/meta/route.ts`
- `/api/listings`: `app/api/listings/route.ts`
- `/api/listings/:id`: `app/api/listings/[id]/route.ts`
- `/api/editions/:id`: `app/api/editions/[id]/route.ts`
- `/api/editions`: `app/api/editions/route.ts`
- `/api/catalog/search`: `app/api/catalog/search/route.ts`
- `/api/editions/:id/price-history`: `app/api/editions/[id]/price-history/route.ts`
- `/api/editions/:id/ratings`: `app/api/editions/[id]/ratings/route.ts`

`GET /api/listings` 쿼리:

- `query`: 앨범명, 아티스트, 카탈로그 번호, 바코드 부분 검색
- `format`: `LP`, `CD`, `Cassette`
- `condition`: `최상`, `양호`, `사용감 있음`
- `minPrice`, `maxPrice`: 경계를 포함하는 정수 KRW 가격
- `sort`: `newest`, `priceAsc`, `priceDesc`

`POST /api/listings` 주요 필드:

- `editionId`, `sellerName`, `price`, `shippingFee`
- `mediaCondition`, `packageCondition`, `sealed`
- `components[]`, `defects`, `photos[]` (최소 1개)
- 인증된 사용자의 이름이 판매자명으로 서버에서 설정되며, 비로그인 요청은 `401`을 반환한다.

## 다음 확장 지점

- `lib/board-store-instance.ts`의 `BoardStore`를 DB 저장소로 교체해 판매글과 판본을 영구 저장한다.
- `POST /api/listings`에 인증된 판매자 ID와 이미지 업로드 파이프라인을 연결한다.
- `AuthStore`를 영구 사용자 저장소와 이메일 가입·비밀번호 재설정·연락처 인증으로 확장한다.
- 상세 화면의 비활성 구매 버튼을 원자적 점유·체크아웃 API에 연결한다.
- 실제 주문 완료 시 체결가를 기록하고 `priceHistory` 데모 데이터를 영구 거래 이력 저장소로 교체한다. 취소·환불 주문은 시세 집계에서 제외한다.
- `ratings`를 영구 저장소로 교체할 때 `(edition_id, user_id)` 고유 제약을 두고 평균·개수 집계를 캐시하거나 원자적으로 갱신한다.
- 페이지네이션을 추가할 때 정렬값과 판매글 ID를 묶은 안정적 커서를 사용한다.
