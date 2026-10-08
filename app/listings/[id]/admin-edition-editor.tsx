"use client";

import { useRef, useState } from "react";
import type { FormEvent } from "react";
import type { Edition } from "../../../src/types.ts";

interface ApiErrorBody {
  message?: string;
  fields?: Record<string, string>;
}

export default function AdminEditionEditor({ edition, listingId, photos = [] }: { edition: Edition; listingId?: string; photos?: string[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});

  function close() {
    dialogRef.current?.close();
    setMessage("");
    setFields({});
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    setFields({});
    const form = new FormData(event.currentTarget);
    const nextPhotos = String(form.get("photos") ?? "").split("\n").map((photo) => photo.trim()).filter(Boolean);
    if (listingId && nextPhotos.length === 0) {
      setFields({ photos: "실제 상품 사진 URL을 1개 이상 입력해 주세요." });
      setMessage("판매글 사진을 확인해 주세요.");
      setSubmitting(false);
      return;
    }

    try {
      const editionResponse = await fetch(`/api/editions/${encodeURIComponent(edition.id)}`, {
        method: "PATCH",
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
          cover: form.get("cover")
        })
      });
      const editionBody = await editionResponse.json() as Edition & ApiErrorBody;
      if (!editionResponse.ok) {
        setMessage(editionBody.message ?? "앨범 정보를 수정하지 못했습니다.");
        setFields(editionBody.fields ?? {});
        return;
      }

      if (listingId) {
        const listingResponse = await fetch(`/api/listings/${encodeURIComponent(listingId)}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ photos: nextPhotos })
        });
        const listingBody = await listingResponse.json() as ApiErrorBody;
        if (!listingResponse.ok) {
          setMessage(listingBody.message ?? "판매글 사진을 수정하지 못했습니다.");
          setFields(listingBody.fields ?? {});
          return;
        }
      }
      close();
      window.location.reload();
    } catch {
      setMessage("네트워크 연결을 확인한 뒤 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button className="button button-outline admin-edit-trigger" type="button" onClick={() => dialogRef.current?.showModal()}>앨범 페이지 수정</button>
      <dialog ref={dialogRef} className="edition-edit-dialog" aria-labelledby="edition-edit-title" onCancel={close}>
        <form onSubmit={submit}>
          <div className="dialog-header">
            <div><p className="eyebrow">ADMIN EDIT</p><h2 id="edition-edit-title">앨범 페이지 수정</h2></div>
            <button className="dialog-close" type="button" onClick={close} aria-label="앨범 정보 수정 닫기">×</button>
          </div>
          <p className="form-intro">앨범 정보 변경 내용은 홈과 이 판본을 사용하는 모든 판매글에 함께 반영됩니다.</p>
          <div className="form-grid">
            <label className="field">아티스트<input name="artist" defaultValue={edition.artist} required />{fields.artist && <small className="field-error">{fields.artist}</small>}</label>
            <label className="field">앨범 제목<input name="title" defaultValue={edition.title} required />{fields.title && <small className="field-error">{fields.title}</small>}</label>
            <label className="field">포맷<select name="format" defaultValue={edition.format}><option value="LP">LP</option><option value="CD">CD</option><option value="Cassette">Cassette</option></select>{fields.format && <small className="field-error">{fields.format}</small>}</label>
            <label className="field">발매연도<input name="year" type="number" min="1900" max="2100" defaultValue={edition.year} required />{fields.year && <small className="field-error">{fields.year}</small>}</label>
            <label className="field">국가<input name="country" defaultValue={edition.country} required />{fields.country && <small className="field-error">{fields.country}</small>}</label>
            <label className="field">레이블<input name="label" defaultValue={edition.label} required />{fields.label && <small className="field-error">{fields.label}</small>}</label>
            <label className="field">카탈로그 번호<input name="catalogNumber" defaultValue={edition.catalogNumber} required />{fields.catalogNumber && <small className="field-error">{fields.catalogNumber}</small>}</label>
            <label className="field">바코드<input name="barcode" defaultValue={edition.barcode} required />{fields.barcode && <small className="field-error">{fields.barcode}</small>}</label>
            <label className="field field-wide">앨범 썸네일 URL<span>*</span><input name="cover" defaultValue={edition.cover} required /><small>홈과 앨범 정보 페이지에 표시되는 대표 이미지입니다.</small>{fields.cover && <small className="field-error">{fields.cover}</small>}</label>
            {listingId && <label className="field field-wide">실물 사진 URL<span>*</span><textarea name="photos" rows={5} defaultValue={photos.join("\n")} required /><small>한 줄에 URL 하나씩 입력해 주세요. 사진은 현재 판매글에만 반영됩니다.</small>{fields.photos && <small className="field-error">{fields.photos}</small>}</label>}
          </div>
          <p className="form-message" role="alert">{message || fields.form}</p>
          <div className="form-actions"><button className="button button-ghost" type="button" onClick={close}>취소</button><button className="button button-dark" type="submit" disabled={submitting}>{submitting ? "저장 중…" : "변경 저장"}</button></div>
        </form>
      </dialog>
    </>
  );
}
