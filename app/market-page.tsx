"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import type { CreateListingInput, Edition, ListingWithEdition } from "../src/types.ts";
import type { User } from "../src/auth-store.ts";

interface FiltersState {
  query: string;
  format: string;
  condition: string;
  minPrice: string;
  maxPrice: string;
  sort: string;
}

interface ApiErrorBody {
  message?: string;
  fields?: Record<string, string>;
}

class ApiError extends Error {
  fields: Record<string, string>;

  constructor(message: string, fields: Record<string, string> = {}) {
    super(message);
    this.fields = fields;
  }
}

const won = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0
});

const initialFilters: FiltersState = {
  query: "",
  format: "",
  condition: "",
  minPrice: "",
  maxPrice: "",
  sort: "newest"
};

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(path, options);
  const body = await response.json() as T & ApiErrorBody;
  if (!response.ok) {
    throw new ApiError(body.message ?? "요청을 처리하지 못했습니다.", body.fields);
  }
  return body;
}

function Modal({ className, children, onClose, label }: {
  className: string;
  children: ReactNode;
  onClose: () => void;
  label: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={className}
      aria-label={label}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {children}
    </dialog>
  );
}

function Header({ user, onCreate, onLogin, onLogout }: {
  user: User | null;
  onCreate: () => void;
  onLogin: () => void;
  onLogout: () => void;
}) {
  return (
    <header className="site-header market-header">
      <a className="brand" href="/" aria-label="VYNL 홈">
        <span className="brand-mark"><i /></span>
        <span>VYNL</span>
      </a>
      <nav aria-label="주 메뉴">
        <a href="/">홈</a>
        <a className="active" href="/market#market">마켓</a>
        <a href="#guide">거래 가이드</a>
        {user?.role === "ADMIN" && <a href="/admin">관리자</a>}
      </nav>
      <div className="header-actions">
        {user ? <button className="account-button" type="button" onClick={onLogout}>{user.name} · 로그아웃</button> : <button className="account-button" type="button" onClick={onLogin}>로그인</button>}
        <button className="button button-dark" type="button" onClick={onCreate}>판매 등록</button>
      </div>
    </header>
  );
}

function LoginDialog({ onClose, onLoggedIn }: { onClose: () => void; onLoggedIn: (user: User) => void }) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await request<{ user: User }>("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") })
      });
      onLoggedIn(result.user);
    } catch (error: unknown) {
      setMessage(error instanceof ApiError ? error.message : "로그인을 처리하지 못했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal className="login-dialog" label="로그인" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="dialog-header">
          <div><p className="eyebrow">WELCOME BACK</p><h2>로그인</h2></div>
          <button className="dialog-close" type="button" onClick={onClose} aria-label="로그인 닫기">×</button>
        </div>
        <p className="form-intro">판매글 등록과 이후 거래 기능은 로그인 후 이용할 수 있습니다.</p>
        <div className="form-grid login-fields">
          <label className="field field-wide">이메일<input name="email" type="email" required autoComplete="email" placeholder="you@example.com" /></label>
          <label className="field field-wide">비밀번호<input name="password" type="password" required autoComplete="current-password" placeholder="비밀번호" /></label>
        </div>
        <div className="demo-account">
          <p>일반 사용자: <strong>user@vynl.kr</strong> / <strong>vynl1234</strong></p>
          <p>관리자: <strong>demo@vynl.kr</strong> / <strong>vynl1234</strong></p>
        </div>
        <p className="form-message" role="alert">{message}</p>
        <div className="form-actions"><button className="button button-ghost" type="button" onClick={onClose}>취소</button><button className="button button-dark" type="submit" disabled={submitting}>{submitting ? "로그인 중…" : "로그인"}</button></div>
      </form>
    </Modal>
  );
}

function Hero({ query, onSearch }: { query: string; onSearch: (query: string) => void }) {
  const [value, setValue] = useState(query);
  useEffect(() => setValue(query), [query]);

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-copy">
        <p className="eyebrow">DIG DEEPER · LISTEN CLOSER</p>
        <h1 id="hero-title">좋아하는 음악을<br /><em>소장하는 방식.</em></h1>
        <p className="hero-description">판본부터 실제 상태까지 꼼꼼하게 비교하고,<br />당신의 다음 레코드를 발견하세요.</p>
        <form
          className="hero-search"
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            onSearch(value.trim());
            document.querySelector("#market")?.scrollIntoView();
          }}
        >
          <label className="sr-only" htmlFor="search-input">앨범 검색</label>
          <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m21 21-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z" /></svg>
          <input
            id="search-input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="앨범, 아티스트, 카탈로그 번호 검색"
            autoComplete="off"
          />
          <button type="submit">검색</button>
        </form>
      </div>
      <div className="hero-visual" aria-hidden="true">
        <div className="record record-back"><span /></div>
        <div className="record-sleeve">
          <div className="sleeve-copy"><span>VYNL</span><strong>LISTEN<br />AGAIN</strong><small>CURATED RECORDS<br />FOR EVERY MOMENT</small></div>
        </div>
        <div className="record record-front"><span /></div>
        <p className="catalog-no">CAT. NO. VY–2026</p>
      </div>
    </section>
  );
}

function Filters({ filters, onChange, onReset }: {
  filters: FiltersState;
  onChange: (changes: Partial<FiltersState>) => void;
  onReset: () => void;
}) {
  const [minPrice, setMinPrice] = useState(filters.minPrice);
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice);

  useEffect(() => {
    setMinPrice(filters.minPrice);
    setMaxPrice(filters.maxPrice);
  }, [filters.minPrice, filters.maxPrice]);

  const radios = (name: "format" | "condition", values: ReadonlyArray<readonly [string, string]>) => values.map(([value, label]) => (
    <label key={`${name}-${value || "all"}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={filters[name] === value}
        onChange={(event) => onChange({ [name]: event.target.value })}
      />
      <span>{label}</span>
    </label>
  ));

  return (
    <aside className="filters" aria-label="판매글 필터">
      <div className="filter-title"><strong>필터</strong><button type="button" onClick={onReset}>초기화</button></div>
      <fieldset>
        <legend>매체</legend>
        {radios("format", [["", "전체"], ["LP", "LP"], ["CD", "CD"], ["Cassette", "카세트"]])}
      </fieldset>
      <fieldset>
        <legend>상태</legend>
        {radios("condition", [["", "전체"], ["최상", "최상"], ["양호", "양호"], ["사용감 있음", "사용감 있음"]])}
      </fieldset>
      <fieldset>
        <legend>가격 범위</legend>
        <div className="price-fields">
          <input value={minPrice} onChange={(event) => setMinPrice(event.target.value)} type="number" min="0" step="1000" placeholder="최소" aria-label="최소 가격" />
          <span>—</span>
          <input value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} type="number" min="0" step="1000" placeholder="최대" aria-label="최대 가격" />
        </div>
        <button className="button button-outline filter-apply" type="button" onClick={() => onChange({ minPrice, maxPrice })}>가격 적용</button>
      </fieldset>
    </aside>
  );
}

function ListingCard({ listing }: { listing: ListingWithEdition }) {
  return (
    <article className="listing-card">
      <a className="listing-open" href={`/listings/${encodeURIComponent(listing.id)}`}>
        <div className="cover-wrap">
          <img className="listing-cover" src={listing.photos[0] ?? listing.edition.cover} alt={`${listing.edition.artist} ${listing.edition.title} 판매 실물 사진`} />
          <span className="format-badge">{listing.edition.format}</span>
          <span className="condition-badge">{listing.sealed ? "미개봉" : listing.mediaCondition}</span>
        </div>
        <div className="listing-info">
          <p className="listing-artist">{listing.edition.artist}</p>
          <h3 className="listing-title">{listing.edition.title}</h3>
          <p className="listing-edition">{listing.edition.year} · {listing.edition.country} · {listing.edition.catalogNumber}</p>
          <div className="listing-meta">
            <span>미디어 {listing.mediaCondition}</span>
            <span>{listing.components.join(" · ")}</span>
          </div>
          <div className="listing-price-row"><strong>{won.format(listing.price)}</strong><small>+ 배송비</small></div>
        </div>
      </a>
    </article>
  );
}

function CreateDialog({ editions, onClose, onCreated }: {
  editions: Edition[];
  onClose: () => void;
  onCreated: (listing: ListingWithEdition) => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setMessage("");
    const form = new FormData(event.currentTarget);
    const input: CreateListingInput = {
      editionId: form.get("editionId"),
      price: Number(form.get("price")),
      shippingFee: 3500,
      mediaCondition: form.get("mediaCondition"),
      packageCondition: form.get("packageCondition"),
      sealed: form.get("sealed") === "on",
      components: String(form.get("components") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
      defects: form.get("defects"),
      photos: String(form.get("photos") ?? "").split("\n").map((item) => item.trim()).filter(Boolean)
    };

    try {
      const created = await request<ListingWithEdition>("/api/listings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input)
      });
      onCreated(created);
    } catch (error: unknown) {
      const apiError = error instanceof ApiError ? error : new ApiError("판매글을 등록하지 못했습니다.");
      setMessage(apiError.message);
      setErrors(apiError.fields);
    }
  }

  const error = (name: string) => <small className="field-error">{errors[name]}</small>;

  return (
    <Modal className="create-dialog" label="판매글 등록" onClose={onClose}>
      <form onSubmit={submit}>
        <div className="dialog-header">
          <div><p className="eyebrow">SELL ON VYNL</p><h2>판매글 등록</h2></div>
          <button className="dialog-close" type="button" onClick={onClose} aria-label="등록 닫기">×</button>
        </div>
        <p className="form-intro">승인된 판본에 실제 보유한 앨범 한 개를 등록합니다.</p>
        <div className="form-grid">
          <label className="field field-wide">판본<span>*</span>
            <select name="editionId" required defaultValue="">
              <option value="">판본 선택</option>
              {editions.map((edition) => <option key={edition.id} value={edition.id}>{edition.artist} — {edition.title} ({edition.format}, {edition.year})</option>)}
            </select>{error("editionId")}
          </label>
          <label className="field">판매 가격<span>*</span><input name="price" type="number" min="1" step="100" required placeholder="원" />{error("price")}</label>
          <label className="field">미디어 상태<span>*</span><select name="mediaCondition" required defaultValue=""><option value="">선택</option><option>최상</option><option>양호</option><option>사용감 있음</option><option>미확인</option></select>{error("mediaCondition")}</label>
          <label className="field">패키지 상태<span>*</span><select name="packageCondition" required defaultValue=""><option value="">선택</option><option>최상</option><option>양호</option><option>사용감 있음</option></select>{error("packageCondition")}</label>
          <label className="check-field field-wide"><input name="sealed" type="checkbox" /> 미개봉 상품입니다 <small>미디어 상태를 ‘미확인’으로 선택하세요.</small></label>
          <label className="field field-wide">구성품<span>*</span><input name="components" required placeholder="쉼표로 구분: LP, 이너슬리브, 포스터" />{error("components")}</label>
          <label className="field field-wide">하자 및 상태 설명<span>*</span><textarea name="defects" required rows={3} placeholder="하자가 없다면 ‘하자 없음’으로 적어주세요." />{error("defects")}</label>
          <label className="field field-wide">실물 사진 URL<span>*</span><textarea name="photos" required rows={3} placeholder="한 줄에 URL 하나씩 입력" /><small>1장 이상 입력할 수 있습니다. 프로토타입에서는 이미지 업로드 대신 URL을 사용합니다.</small>{error("photos")}</label>
        </div>
        <div className="form-notice">VYNL은 현재 실물 검수·정품 감정을 제공하지 않습니다. 허위 설명, 불법 복제품, 외부 결제 유도는 금지됩니다.</div>
        <p className="form-message" role="alert">{message}</p>
        <div className="form-actions"><button className="button button-ghost" type="button" onClick={onClose}>취소</button><button className="button button-dark" type="submit">판매글 공개</button></div>
      </form>
    </Modal>
  );
}

function TrustSection() {
  return (
    <section className="trust" id="guide">
      <p className="eyebrow">BUY WITH CONTEXT</p>
      <h2>사진과 설명을 먼저,<br />거래는 그다음.</h2>
      <div className="trust-items">
        <article><span>01</span><h3>정확한 판본</h3><p>매체, 발매국, 연도와 카탈로그 번호로 원하는 판본인지 확인합니다.</p></article>
        <article><span>02</span><h3>실물 상태 공개</h3><p>판매자가 올린 사진과 미디어·패키지 상태, 구성품과 하자를 비교합니다.</p></article>
        <article><span>03</span><h3>안전거래 준비</h3><p>현재 프로토타입은 실물 검수를 제공하지 않으며 결제 기능은 다음 증분에 연결됩니다.</p></article>
      </div>
    </section>
  );
}

export default function MarketPage({ initialListings, editions }: {
  initialListings: ListingWithEdition[];
  editions: Edition[];
}) {
  const [filters, setFilters] = useState(initialFilters);
  const [listings, setListings] = useState(initialListings);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [creating, setCreating] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    request<{ user: User }>("/api/auth/session").then((result) => setUser(result.user)).catch(() => setUser(null));
  }, []);

  const loadListings = useCallback(async (nextFilters: FiltersState) => {
    setLoading(true);
    setLoadError("");
    const parameters = new URLSearchParams(Object.entries(nextFilters).filter(([, value]) => value !== ""));
    try {
      const result = await request<{ items: ListingWithEdition[]; total: number }>(`/api/listings?${parameters}`);
      setListings(result.items);
    } catch {
      setLoadError("판매글을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }, []);

  function changeFilters(changes: Partial<FiltersState>) {
    const nextFilters = { ...filters, ...changes };
    setFilters(nextFilters);
    loadListings(nextFilters);
  }

  function resetFilters() {
    setFilters(initialFilters);
    loadListings(initialFilters);
  }

  async function created(listing: ListingWithEdition) {
    setCreating(false);
    await loadListings(filters);
    window.location.assign(`/listings/${encodeURIComponent(listing.id)}`);
  }

  function startCreating() {
    if (user) setCreating(true);
    else setLoggingIn(true);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "DELETE" });
    setUser(null);
  }

  return (
    <>
      <Header user={user} onCreate={startCreating} onLogin={() => setLoggingIn(true)} onLogout={logout} />
      <main>
        <Hero query={filters.query} onSearch={(query) => changeFilters({ query })} />
        <section className="market" id="market" aria-labelledby="market-title">
          <div className="section-heading">
            <div><p className="eyebrow">JUST LISTED</p><h2 id="market-title">새로 등록된 앨범</h2></div>
            <p>판매자가 직접 촬영하고 상태를 기록한 실물 앨범입니다.</p>
          </div>
          <div className="market-layout">
            <Filters filters={filters} onChange={changeFilters} onReset={resetFilters} />
            <div className="listings-area">
              <div className="listings-toolbar">
                <p><strong>{listings.length}</strong>개의 판매글</p>
                <label>정렬
                  <select value={filters.sort} onChange={(event) => changeFilters({ sort: event.target.value })}>
                    <option value="newest">최신 등록순</option><option value="priceAsc">낮은 가격순</option><option value="priceDesc">높은 가격순</option>
                  </select>
                </label>
              </div>
              {loadError && <p className="load-error" role="alert">{loadError}</p>}
              {listings.length > 0 ? (
                <div className="listing-grid" aria-live="polite" aria-busy={loading}>
                  {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
                </div>
              ) : !loading && (
                <div className="empty-state">
                  <span>0</span><h3>조건에 맞는 앨범이 없습니다.</h3><p>검색어나 필터를 바꿔 다시 찾아보세요.</p>
                  <button className="button button-dark" type="button" onClick={resetFilters}>전체 판매글 보기</button>
                </div>
              )}
            </div>
          </div>
        </section>
        <TrustSection />
      </main>
      {creating && <CreateDialog editions={editions} onClose={() => setCreating(false)} onCreated={created} />}
      {loggingIn && <LoginDialog onClose={() => setLoggingIn(false)} onLoggedIn={(nextUser) => {
        setUser(nextUser);
        setLoggingIn(false);
        if (nextUser.role === "ADMIN") {
          window.location.assign("/admin");
          return;
        }
        setCreating(true);
      }} />}
      <footer><a className="brand" href="/"><span className="brand-mark"><i /></span><span>VYNL</span></a><p>당신의 음악이 다음 사람에게 이어지는 곳.</p><small>© 2026 VYNL. Prototype.</small></footer>
    </>
  );
}
