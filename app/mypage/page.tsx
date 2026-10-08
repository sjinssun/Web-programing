import type { Metadata } from "next";
import { cookies } from "next/headers";
import { authStore } from "../../lib/auth-store-instance.ts";
import { SESSION_COOKIE } from "../../src/auth-store.ts";

export const metadata: Metadata = {
  title: "마이페이지 | VYNL",
  description: "VYNL 계정과 음악 기록을 확인하는 마이페이지"
};

export default async function MyPage() {
  const session = (await cookies()).get(SESSION_COOKIE)?.value;
  const user = authStore.findUserBySession(session);

  return (
    <>
      <header className="site-header mypage-header">
        <a className="brand" href="/" aria-label="VYNL 홈"><span className="brand-mark"><i /></span><span>VYNL</span></a>
        <nav aria-label="주 메뉴"><a href="/">홈</a><a href="/market">마켓</a></nav>
      </header>
      <main className="mypage">
        <p className="eyebrow">MY VYNL</p>
        <h1>마이페이지</h1>
        {user ? (
          <section className="mypage-profile" aria-labelledby="profile-title">
            <div><span>PROFILE</span><strong id="profile-title">{user.name}</strong></div>
            <dl><div><dt>이메일</dt><dd>{user.email}</dd></div><div><dt>계정 유형</dt><dd>{user.role === "ADMIN" ? "관리자" : "일반 회원"}</dd></div></dl>
            <p>내 별점과 판매 내역은 다음 구현에서 이 화면에 연결됩니다.</p>
          </section>
        ) : (
          <section className="mypage-login-state" aria-labelledby="login-required-title">
            <span aria-hidden="true">◎</span>
            <h2 id="login-required-title">로그인이 필요합니다.</h2>
            <p>마켓에서 로그인한 뒤 내 음악 기록과 계정 정보를 확인할 수 있습니다.</p>
            <a className="button button-dark" href="/market">마켓에서 로그인하기</a>
          </section>
        )}
      </main>
    </>
  );
}
