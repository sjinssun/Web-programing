"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import type { CatalogCandidate } from "../../../src/catalog-adapter.ts";
import type { AlbumFormat } from "../../../src/types.ts";

interface ApiErrorBody {
  message?: string;
  fields?: Record<string, string>;
}

type SearchField = "barcode" | "catno" | "q";

interface Draft {
  discogsReleaseId: number | null;
  artist: string;
  title: string;
  format: AlbumFormat;
  year: number | null;
  country: string;
  label: string;
  catalogNumber: string;
  barcode: string;
  cover: string;
}

const EMPTY_DRAFT: Draft = { discogsReleaseId: null, artist: "", title: "", format: "LP", year: null, country: "", label: "", catalogNumber: "", barcode: "", cover: "" };

export default function EditionCreateForm() {
  const [searchField, setSearchField] = useState<SearchField>("barcode");
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState("");
  const [results, setResults] = useState<CatalogCandidate[]>([]);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [draftKey, setDraftKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!searchTerm.trim()) return;
    setSearching(true);
    setSearchMessage("");
    setResults([]);
    try {
      const response = await fetch(`/api/catalog/search?${new URLSearchParams({ [searchField]: searchTerm.trim() })}`);
      const body = await response.json() as { items?: CatalogCandidate[] } & ApiErrorBody;
      if (!response.ok) {
        setSearchMessage(body.message ?? "외부 카탈로그를 검색하지 못했습니다. 직접 입력해 주세요.");
        return;
      }
      setResults(body.items ?? []);
      if (!body.items?.length) setSearchMessage("검색 결과가 없습니다. 다른 조건으로 검색하거나 직접 입력해 주세요.");
    } catch {
      setSearchMessage("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setSearching(false);
    }
  }

  function choose(candidate: CatalogCandidate) {
    const { sourceUrl: _sourceUrl, ...values } = candidate;
    setDraft(values);
    setDraftKey((key) => key + 1);
    setMessage("");
    setFields({});
  }

  function reset() {
    setDraft(EMPTY_DRAFT);
    setDraftKey((key) => key + 1);
    setMessage("");
    setFields({});
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setFields({});
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/editions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          artist: form.get("artist"),
          title: form.get("title"),
          format: form.get("format"),
          year: Number(form.get("year")),
          country: form.get("country"),
          label: form.get("label"),
          catalogNumber: form.get("catalogNumber"),
          barcode: form.get("barcode"),
          cover: form.get("cover"),
          discogsReleaseId: draft.discogsReleaseId ?? undefined
        })
      });
      const body = await response.json() as ApiErrorBody;
      if (!response.ok) {
        setMessage(body.message ?? "앨범을 추가하지 못했습니다.");
        setFields(body.fields ?? {});
        return;
      }
      window.location.reload();
    } catch {
      setMessage("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="admin-listings edition-create" aria-labelledby="edition-create-title">
      <div className="admin-section-heading"><div><p className="eyebrow">ADD ALBUM</p><h2 id="edition-create-title">앨범 추가</h2></div><p>Discogs에서 판본을 찾아 채우거나 직접 입력합니다.</p></div>
      <div className="edition-create-body">
        <form className="catalog-search" onSubmit={search} role="search">
          <select aria-label="검색 기준" value={searchField} onChange={(event) => setSearchField(event.target.value as SearchField)}>
            <option value="barcode">바코드</option>
            <option value="catno">카탈로그 번호</option>
            <option value="q">키워드</option>
          </select>
          <input aria-label="검색어" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="예: 602547311009" />
          <button className="button button-dark" type="submit" disabled={searching}>{searching ? "검색 중…" : "Discogs 검색"}</button>
        </form>
        {searchMessage && <p className="form-message" role="status">{searchMessage}</p>}
        {results.length > 0 && (
          <ul className="catalog-results">
            {results.map((candidate) => (
              <li key={candidate.discogsReleaseId}>
                <button type="button" className={candidate.discogsReleaseId === draft.discogsReleaseId ? "is-selected" : ""} onClick={() => choose(candidate)}>
                  {candidate.cover ? <img src={candidate.cover} alt="" loading="lazy" /> : <span className="catalog-result-placeholder" />}
                  <span>
                    <strong>{candidate.artist} — {candidate.title}</strong>
                    <small>{candidate.format} · {candidate.year ?? "연도 미상"} · {candidate.country || "국가 미상"} · {candidate.label || "레이블 미상"} · {candidate.catalogNumber || "카탈로그 번호 없음"}</small>
                    <small>Discogs #{candidate.discogsReleaseId}{candidate.barcode ? ` · ${candidate.barcode}` : ""}</small>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}

        <form key={draftKey} onSubmit={submit}>
          <p className="form-intro">
            {draft.discogsReleaseId
              ? <>Discogs 판본 <a href={`https://www.discogs.com/release/${draft.discogsReleaseId}`} target="_blank" rel="noreferrer">#{draft.discogsReleaseId}</a>의 정보로 채웠습니다. 국가 표기 등을 확인·수정한 뒤 저장해 주세요.</>
              : "검색 결과를 선택하면 아래 폼이 자동으로 채워집니다."}
          </p>
          <div className="form-grid">
            <label className="field">아티스트<input name="artist" defaultValue={draft.artist} required />{fields.artist && <small className="field-error">{fields.artist}</small>}</label>
            <label className="field">앨범 제목<input name="title" defaultValue={draft.title} required />{fields.title && <small className="field-error">{fields.title}</small>}</label>
            <label className="field">포맷<select name="format" defaultValue={draft.format}><option value="LP">LP</option><option value="CD">CD</option><option value="Cassette">Cassette</option></select>{fields.format && <small className="field-error">{fields.format}</small>}</label>
            <label className="field">발매연도<input name="year" type="number" min="1900" max="2100" defaultValue={draft.year ?? ""} required />{fields.year && <small className="field-error">{fields.year}</small>}</label>
            <label className="field">국가<input name="country" defaultValue={draft.country} required /><small>Discogs는 영문 표기(South Korea, Europe 등)를 사용합니다.</small>{fields.country && <small className="field-error">{fields.country}</small>}</label>
            <label className="field">레이블<input name="label" defaultValue={draft.label} required />{fields.label && <small className="field-error">{fields.label}</small>}</label>
            <label className="field">카탈로그 번호<input name="catalogNumber" defaultValue={draft.catalogNumber} required />{fields.catalogNumber && <small className="field-error">{fields.catalogNumber}</small>}</label>
            <label className="field">바코드<input name="barcode" defaultValue={draft.barcode} required />{fields.barcode && <small className="field-error">{fields.barcode}</small>}</label>
            <label className="field field-wide">앨범 썸네일 URL<span>*</span><input name="cover" defaultValue={draft.cover} required /><small>홈과 앨범 정보 페이지에 표시되는 대표 이미지입니다.</small>{fields.cover && <small className="field-error">{fields.cover}</small>}</label>
          </div>
          <p className="form-message" role="alert">{message || fields.discogsReleaseId || fields.form}</p>
          <div className="form-actions"><button className="button button-ghost" type="button" onClick={reset}>초기화</button><button className="button button-dark" type="submit" disabled={submitting}>{submitting ? "저장 중…" : "앨범 추가"}</button></div>
        </form>
      </div>
    </section>
  );
}
