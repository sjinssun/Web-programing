import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { boardStore } from "../../lib/board-store-instance.ts";
import { authStore } from "../../lib/auth-store-instance.ts";
import { SESSION_COOKIE } from "../../src/auth-store.ts";

const dateTime = new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
const won = new Intl.NumberFormat("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 });

export default async function AdminPage() {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = authStore.findUserBySession(session);
  if (user?.role !== "ADMIN") redirect("/");

  const dashboard = boardStore.getAdminDashboard();
  const stats = [
    ["전체 판매글", dashboard.totalListings],
    ["판매 중", dashboard.activeListings],
    ["거래 진행", dashboard.inTransactionListings],
    ["비공개·완료", dashboard.unavailableListings]
  ];

  return (
    <main className="admin-page">
      <header className="admin-header">
        <a className="brand" href="/"><span className="brand-mark"><i /></span><span>VYNL</span></a>
        <div><span>{user.name}</span><a className="button button-outline" href="/admin/albums">앨범 정보 관리</a><a className="button button-outline" href="/market">마켓으로</a></div>
      </header>
      <section className="admin-intro">
        <p className="eyebrow">ADMIN CONSOLE</p>
        <h1>운영 현황</h1>
        <p>판매글 상태와 최근 등록 내용을 확인합니다.</p>
      </section>
      <section className="admin-stats" aria-label="판매글 현황">
        {stats.map(([label, value]) => <article key={label}><span>{label}</span><strong>{value}</strong></article>)}
      </section>
      <section className="admin-listings" aria-labelledby="recent-listings-title">
        <div className="admin-section-heading"><div><p className="eyebrow">RECENT LISTINGS</p><h2 id="recent-listings-title">최근 판매글</h2></div><p>최신 등록순 · 최대 8개</p></div>
        <div className="admin-table-wrap">
          <table>
            <thead><tr><th>앨범</th><th>판매자</th><th>가격</th><th>상태</th><th>등록일</th><th><span className="sr-only">상세 이동</span></th></tr></thead>
            <tbody>{dashboard.recentListings.map((listing) => <tr key={listing.id}>
              <td><a className="admin-album-link" href={`/listings/${encodeURIComponent(listing.id)}`}><strong>{listing.edition.title}</strong><small>{listing.edition.artist} · {listing.edition.catalogNumber}</small></a></td>
              <td>{listing.sellerName}</td><td>{won.format(listing.price)}</td><td><span className={`status-badge status-${listing.status.toLowerCase()}`}>{listing.status}</span></td><td>{dateTime.format(new Date(listing.createdAt))}</td><td><a className="admin-listing-link" href={`/listings/${encodeURIComponent(listing.id)}`}>상세·수정 →</a></td>
            </tr>)}</tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
