import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authStore } from "../../../lib/auth-store-instance.ts";
import { boardStore } from "../../../lib/board-store-instance.ts";
import { SESSION_COOKIE } from "../../../src/auth-store.ts";
import EditionCreateForm from "./edition-create-form.tsx";

export default async function AdminAlbumsPage() {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = authStore.findUserBySession(session);
  if (user?.role !== "ADMIN") redirect("/");

  const editions = boardStore.getMeta().editions;
  const activeListings = boardStore.findListings();

  return (
    <main className="admin-page admin-albums-page">
      <header className="admin-header">
        <a className="brand" href="/"><span className="brand-mark"><i /></span><span>VYNL</span></a>
        <div><span>{user.name}</span><a className="button button-outline" href="/admin">판매글 관리</a><a className="button button-outline" href="/">홈으로</a></div>
      </header>
      <section className="admin-intro">
        <p className="eyebrow">ALBUM ADMIN</p>
        <h1>앨범 정보 관리</h1>
        <p>홈 아카이브에 표시되는 판본 정보와 별점 현황을 관리합니다.</p>
      </section>
      <EditionCreateForm />
      <section className="admin-listings" aria-labelledby="admin-albums-title">
        <div className="admin-section-heading"><div><p className="eyebrow">ALBUM ARCHIVE</p><h2 id="admin-albums-title">등록 앨범</h2></div><p>총 {editions.length}개 판본</p></div>
        <div className="admin-table-wrap">
          <table>
            <thead><tr><th>앨범</th><th>판본</th><th>평균 별점</th><th>판매 중 매물</th><th><span className="sr-only">관리</span></th></tr></thead>
            <tbody>{editions.map((edition) => {
              const rating = boardStore.getRatingSummary(edition.id)!;
              const listingCount = activeListings.filter((listing) => listing.editionId === edition.id).length;
              return <tr key={edition.id}>
                <td><a className="admin-album-link" href={`/albums/${encodeURIComponent(edition.id)}`}><strong>{edition.title}</strong><small>{edition.artist}</small></a></td>
                <td>{edition.year} · {edition.format}<small>{edition.country} · {edition.catalogNumber}</small></td>
                <td>{rating.averageScore?.toFixed(1) ?? "—"}<small>{rating.ratingCount}명 참여</small></td>
                <td>{listingCount}개</td>
                <td><a className="admin-listing-link" href={`/albums/${encodeURIComponent(edition.id)}`}>상세·수정 →</a></td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
