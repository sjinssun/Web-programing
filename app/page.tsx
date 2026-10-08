import { cookies } from "next/headers";
import { authStore } from "../lib/auth-store-instance.ts";
import { boardStore } from "../lib/board-store-instance.ts";
import { SESSION_COOKIE } from "../src/auth-store.ts";

type HomeProps = { searchParams: Promise<{ q?: string }> };

export default async function Home({ searchParams }: HomeProps) {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  const isAdmin = authStore.findUserBySession(session)?.role === "ADMIN";
  const query = String((await searchParams).q ?? "").trim();
  const normalizedQuery = query.toLocaleLowerCase("ko-KR");
  const matchesQuery = (values: string[]) => !normalizedQuery
    || values.join(" ").toLocaleLowerCase("ko-KR").includes(normalizedQuery);
  const archive = boardStore.getRatingArchive();
  const latestAlbums = boardStore.getMeta().editions.slice(-5).reverse();
  const newReleaseIds = new Set(latestAlbums.map((edition) => edition.id));
  const newReleases = latestAlbums.filter((edition) => matchesQuery([
    edition.artist,
    edition.title,
    edition.catalogNumber,
    edition.barcode
  ]));
  const featuredAlbums = archive
    .filter(({ edition }) => !newReleaseIds.has(edition.id))
    .filter(({ edition }) => matchesQuery([edition.artist, edition.title, edition.catalogNumber, edition.barcode]))
    .slice(0, 5);

  return (
    <>
      <header className="site-header archive-header">
        <a className="brand" href="/" aria-label="VYNL 홈"><span className="brand-mark"><i /></span><span>VYNL</span></a>
        <nav aria-label="주 메뉴"><a className="active" href="/">홈</a><a href="/market">마켓</a>{isAdmin && <a href="/admin">관리자</a>}</nav>
        <a className="button button-outline archive-mypage-link" href="/mypage">마이페이지</a>
      </header>
      <main className="archive-home">
        <section className="archive-search-section" aria-label="앨범 검색">
          <form className="archive-search" action="/" method="get" role="search">
            <label className="sr-only" htmlFor="archive-search-input">앨범 또는 아티스트 검색</label>
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m21 21-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" /></svg>
            <input id="archive-search-input" name="q" defaultValue={query} placeholder="앨범, 아티스트, 카탈로그 번호 검색" autoComplete="off" />
            {query && <a href="/" aria-label="검색 초기화">초기화</a>}
            <button type="submit">검색</button>
          </form>
        </section>
        <section className="new-release" aria-labelledby="new-release-title">
          <div className="archive-section-heading">
            <div><p className="eyebrow">NEW RELEASE</p><h1 id="new-release-title">오늘의 신보</h1></div>
            <p>VYNL 아카이브에 최근 등록된 앨범입니다.</p>
          </div>
          <div className="new-release-grid">
            {newReleases.map((edition) => (
              <a className="new-release-card" href={`/albums/${encodeURIComponent(edition.id)}`} key={edition.id}>
                <div className="new-release-cover"><img src={edition.cover} alt={`${edition.artist} ${edition.title} 앨범 커버`} /></div>
                <p>{edition.artist}</p>
                <h2>{edition.title}</h2>
                <small>{edition.year} · {edition.format} · {edition.country}</small>
              </a>
            ))}
            {newReleases.length === 0 && <p className="archive-search-empty">검색 조건에 맞는 새 앨범이 없습니다.</p>}
          </div>
        </section>
        <section className="rating-archive" aria-labelledby="rating-archive-title">
          <div className="archive-section-heading">
            <div><p className="eyebrow">COMMUNITY RATINGS</p><h2 id="rating-archive-title">지금 주목받는 앨범</h2></div>
            <p>평균 별점이 높은 순서로 정리했어요.</p>
          </div>
          <div className="archive-grid">
            {featuredAlbums.map(({ edition, rating }, index) => {
              const score = rating.averageScore ?? 0;
              const content = (
                <>
                  <div className="archive-cover-wrap">
                    <img src={edition.cover} alt={`${edition.artist} ${edition.title} 앨범 커버`} />
                    <span>{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="archive-card-copy">
                    <p>{edition.artist}</p>
                    <h3>{edition.title}</h3>
                    <small>{edition.year} · {edition.format} · {edition.country}</small>
                    <div className="archive-rating-row">
                      <strong>{rating.averageScore?.toFixed(1) ?? "—"}</strong>
                      <span className="archive-stars" aria-hidden="true">{"★★★★★".slice(0, Math.round(score))}<i>{"★★★★★".slice(Math.round(score))}</i></span>
                      <small>{rating.ratingCount}명</small>
                    </div>
                    <span className="archive-card-action">앨범 정보 보기 →</span>
                  </div>
                </>
              );
              return <a className="archive-card" href={`/albums/${encodeURIComponent(edition.id)}`} key={edition.id}>{content}</a>;
            })}
            {featuredAlbums.length === 0 && <p className="archive-search-empty">검색 조건에 맞는 앨범이 없습니다.</p>}
          </div>
        </section>
      </main>
      <footer><a className="brand" href="/"><span className="brand-mark"><i /></span><span>VYNL</span></a><p>듣고, 평가하고, 오래 기억하는 음악 아카이브.</p><small>© 2026 VYNL. Prototype.</small></footer>
    </>
  );
}
