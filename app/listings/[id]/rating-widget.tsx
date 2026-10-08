"use client";

import { useEffect, useState } from "react";
import type { RatingScore, RatingSummary } from "../../../src/types.ts";

const scores: RatingScore[] = [1, 2, 3, 4, 5];

export default function RatingWidget({ editionId, initialSummary }: {
  editionId: string;
  initialSummary: RatingSummary;
}) {
  const [summary, setSummary] = useState(initialSummary);
  const [preview, setPreview] = useState<RatingScore | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/editions/${encodeURIComponent(editionId)}/ratings`, { signal: controller.signal })
      .then(async (response) => {
        if (response.ok) setSummary(await response.json() as RatingSummary);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [editionId]);

  async function rate(score: RatingScore) {
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/editions/${encodeURIComponent(editionId)}/ratings`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ score })
      });
      const body = await response.json() as RatingSummary & { message?: string };
      if (!response.ok) {
        setMessage(body.message ?? "별점을 저장하지 못했습니다.");
        return;
      }
      setSummary(body);
      setMessage(`${score}점 평가를 저장했습니다.`);
    } catch {
      setMessage("별점을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSubmitting(false);
    }
  }

  const activeScore = preview ?? summary.userScore ?? 0;

  return (
    <section className="album-rating" aria-labelledby={`album-rating-${editionId}`}>
      <div className="album-rating-summary">
        <div><small id={`album-rating-${editionId}`}>앨범 평가</small><strong>{summary.averageScore?.toFixed(1) ?? "—"}</strong><span>/ 5</span></div>
        <p><strong>{summary.ratingCount}</strong>명이 평가했어요</p>
      </div>
      <div className="star-rating" role="group" aria-label="내 별점 선택" onMouseLeave={() => setPreview(null)}>
        {scores.map((score) => (
          <button
            key={score}
            type="button"
            className={score <= activeScore ? "active" : ""}
            aria-label={`${score}점`}
            aria-pressed={summary.userScore === score}
            disabled={submitting}
            onMouseEnter={() => setPreview(score)}
            onFocus={() => setPreview(score)}
            onBlur={() => setPreview(null)}
            onClick={() => rate(score)}
          >★</button>
        ))}
        <span>{summary.userScore ? `내 별점 ${summary.userScore}점` : "별점을 선택해 주세요"}</span>
      </div>
      <p className="rating-message" role="status" aria-live="polite">{message}</p>
    </section>
  );
}
