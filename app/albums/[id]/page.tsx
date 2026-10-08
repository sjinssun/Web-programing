import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { authStore } from "../../../lib/auth-store-instance.ts";
import { boardStore } from "../../../lib/board-store-instance.ts";
import { SESSION_COOKIE } from "../../../src/auth-store.ts";
import AdminEditionEditor from "../../listings/[id]/admin-edition-editor.tsx";
import RatingWidget from "../../listings/[id]/rating-widget.tsx";

type AlbumPageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: AlbumPageProps): Promise<Metadata> {
  const edition = boardStore.findEdition((await params).id);
  return edition
    ? { title: `${edition.artist} – ${edition.title} | VYNL 앨범` }
    : { title: "앨범을 찾을 수 없습니다 | VYNL" };
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const edition = boardStore.findEdition((await params).id);
  if (!edition) notFound();

  const rating = boardStore.getRatingSummary(edition.id)!;
  const listings = boardStore.findListings().filter((listing) => listing.editionId === edition.id);
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  const isAdmin = authStore.findUserBySession(session)?.role === "ADMIN";

  return (
    <>
      <header className="site-header album-page-header">
        <a className="brand" href="/" aria-label="VYNL 홈"><span className="brand-mark"><i /></span><span>VYNL</span></a>
        <nav aria-label="주 메뉴"><a className="active" href="/">홈</a><a href="/market">마켓</a></nav>
        <a className="button button-outline album-mypage-link" href="/mypage">마이페이지</a>
      </header>
      <main className="album-page">
        <div className="album-page-heading">
          <p className="eyebrow">ALBUM ARCHIVE · {edition.id.toUpperCase()}</p>
          <div><a href="/">← 앨범 목록으로</a>{isAdmin && <AdminEditionEditor edition={edition} />}</div>
        </div>
        <article className="album-profile" aria-labelledby="album-title">
          <div className="album-cover"><img src={edition.cover} alt={`${edition.artist} ${edition.title} 앨범 커버`} /></div>
          <div className="album-profile-copy">
            <p className="eyebrow">{edition.format} · {edition.country}</p>
            <h1 id="album-title">{edition.title}</h1>
            <p className="album-profile-artist">{edition.artist}</p>
            <p className="album-profile-edition">{edition.year} · {edition.label}</p>
            <dl className="album-identifiers">
              <div><dt>CATALOG NO.</dt><dd>{edition.catalogNumber}</dd></div>
              <div><dt>BARCODE</dt><dd>{edition.barcode}</dd></div>
            </dl>
            <RatingWidget editionId={edition.id} initialSummary={rating} />
          </div>
        </article>
        <section className="album-market-panel" aria-labelledby="album-market-title">
          <div><p className="eyebrow">MARKET LISTINGS</p><h2 id="album-market-title">이 앨범의 장터 매물</h2><p>앨범 정보와 판매자가 등록한 실물 매물은 별도로 관리됩니다.</p></div>
          <div><strong>{listings.length}</strong><span>개의 판매 중 매물</span>{listings[0] ? <a className="button button-dark" href={`/listings/${encodeURIComponent(listings[0].id)}`}>매물 상세 보기</a> : <a className="button button-outline" href="/market">마켓 둘러보기</a>}</div>
        </section>
      </main>
      <footer><a className="brand" href="/"><span className="brand-mark"><i /></span><span>VYNL</span></a><p>듣고, 평가하고, 오래 기억하는 음악 아카이브.</p><small>© 2026 VYNL. Prototype.</small></footer>
    </>
  );
}
