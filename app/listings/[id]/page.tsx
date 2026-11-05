import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { authStore } from "../../../lib/auth-store-instance.ts";
import { boardStore } from "../../../lib/board-store-instance.ts";
import { SESSION_COOKIE } from "../../../src/auth-store.ts";
import { CATALOG_SOURCE_NAME, catalogMarketUrl } from "../../../src/catalog-adapter.ts";
import AdminEditionEditor from "./admin-edition-editor.tsx";
import layoutStyles from "./listing-layout.module.css";
import MarketReference from "./market-reference.tsx";
import PhotoCarousel from "./photo-carousel.tsx";
import PriceHistoryDialog from "./price-history-dialog.tsx";
import RatingWidget from "./rating-widget.tsx";

const won = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0
});

const listedDate = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric"
});

type ListingPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: ListingPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = boardStore.findListing(id);
  return listing
    ? { title: `${listing.edition.artist} – ${listing.edition.title} | VYNL` }
    : { title: "판매글을 찾을 수 없습니다 | VYNL" };
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;
  const listing = boardStore.findListing(id);
  if (!listing) notFound();
  const history = boardStore.getPriceHistory(listing.editionId);
  const ratingSummary = boardStore.getRatingSummary(listing.editionId)!;
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  const isAdmin = authStore.findUserBySession(session)?.role === "ADMIN";

  return (
    <>
      <header className="site-header detail-page-header">
        <a className="brand" href="/" aria-label="VYNL 홈"><span className="brand-mark"><i /></span><span>VYNL</span></a>
        <nav aria-label="상세 페이지 이동"><a href="/market#market">← 마켓으로</a></nav>
      </header>
      <main className="listing-detail-page">
        <div className="detail-page-heading">
          <p className="eyebrow">LISTING DETAIL · {listing.id.toUpperCase()}</p>
          <div className="detail-page-heading-actions"><p>{listedDate.format(new Date(listing.createdAt))} 등록</p>{isAdmin && <AdminEditionEditor edition={listing.edition} listingId={listing.id} photos={listing.photos} />}</div>
        </div>
        <section
          className={`detail-page-layout ${layoutStyles.layout}`}
          style={{ height: "auto", minHeight: 0, gridTemplateRows: "auto" }}
          aria-labelledby="listing-title"
        >
          <PhotoCarousel photos={listing.photos} alt={`${listing.edition.artist} ${listing.edition.title}`} />
          <div
            className={`detail-info ${layoutStyles.info}`}
            style={{ height: "auto", minHeight: 0, alignSelf: "stretch" }}
          >
            <p className="eyebrow">{listing.edition.format} · {listing.edition.country}</p>
            <h1 id="listing-title">{listing.edition.title}</h1>
            <p className="listing-artist">{listing.edition.artist}</p>
            <p className="edition-line">{listing.edition.year} · {listing.edition.label} · {listing.edition.catalogNumber}</p>
            <p className="edition-barcode">BARCODE · {listing.edition.barcode}</p>
            <p className="detail-price"><strong>{won.format(listing.price)}</strong> <small>+ 배송비 {won.format(listing.shippingFee)}</small></p>
            <RatingWidget editionId={listing.editionId} initialSummary={ratingSummary} />
            <PriceHistoryDialog history={history} currentPrice={listing.price} />
            {listing.edition.discogsReleaseId && <MarketReference editionId={listing.editionId} sourceName={CATALOG_SOURCE_NAME} sourceUrl={catalogMarketUrl(listing.edition.discogsReleaseId)} />}
          </div>
        </section>
        <section className="detail-page-information" aria-label="판매 상품 정보">
          <div>
            <p className="eyebrow">ITEM CONDITION</p>
            <dl className="detail-specs">
              <div><dt>미디어 상태</dt><dd>{listing.mediaCondition}</dd></div>
              <div><dt>패키지 상태</dt><dd>{listing.packageCondition}</dd></div>
              <div><dt>구성품</dt><dd>{listing.components.join(", ")}</dd></div>
              <div><dt>판매자</dt><dd>{listing.sellerName}</dd></div>
              <div><dt>하자 설명</dt><dd>{listing.defects}</dd></div>
            </dl>
          </div>
          <aside className="detail-purchase-panel">
            <p className="detail-note">VYNL은 현재 상품을 직접 검수하지 않습니다. 결제 전 판매자의 실물 사진과 상태 설명을 확인해 주세요.</p>
            <div className="detail-actions"><button className="button button-outline" type="button">신고</button><button className="button button-dark" type="button" disabled>구매 준비 중</button></div>
          </aside>
        </section>
      </main>
      <footer><a className="brand" href="/"><span className="brand-mark"><i /></span><span>VYNL</span></a><p>당신의 음악이 다음 사람에게 이어지는 곳.</p><small>© 2026 VYNL. Prototype.</small></footer>
    </>
  );
}
