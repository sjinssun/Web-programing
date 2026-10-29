"use client";

import { useEffect, useState } from "react";

const won = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0
});

const foreignAmount = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

interface MarketReferenceBody {
  numForSale: number;
  lowestPrice: { amount: number; currency: string; krw: number | null } | null;
  exchangeRate: { usdToKrw: number; baseDate: string };
}

type LoadState = { status: "loading" } | { status: "ready"; body: MarketReferenceBody } | { status: "unavailable" };

function currencyLabel(currency: string) {
  return currency === "USD" ? "US$" : currency;
}

// 외부 시세 실패가 페이지 렌더링에 영향을 주지 않도록 페이지가 그려진 뒤 서버 프록시에서 따로 불러온다.
export default function MarketReference({ editionId, sourceName, sourceUrl }: { editionId: string; sourceName: string; sourceUrl: string }) {
  const [state, setState] = useState<LoadState>({ status: "loading" });

  useEffect(() => {
    let active = true;
    fetch(`/api/editions/${encodeURIComponent(editionId)}/market-reference`)
      .then(async (response) => {
        if (!response.ok) throw new Error(String(response.status));
        const body = await response.json() as MarketReferenceBody;
        if (active) setState({ status: "ready", body });
      })
      .catch(() => {
        if (active) setState({ status: "unavailable" });
      });
    return () => {
      active = false;
    };
  }, [editionId]);

  const lowest = state.status === "ready" ? state.body.lowestPrice : null;

  return (
    <section className="market-reference" aria-label={`해외 최저가 (${sourceName} 참고)`} aria-busy={state.status === "loading"}>
      <p className="market-reference-title">해외 최저가 ({sourceName} 참고)</p>
      <p className="market-reference-value">
        {state.status === "loading" && <span>불러오는 중…</span>}
        {state.status === "unavailable" && <span>정보 없음</span>}
        {state.status === "ready" && (lowest
          ? <>
              {lowest.krw !== null && <strong>약 {won.format(lowest.krw)}</strong>}
              <span> ({currencyLabel(lowest.currency)} {foreignAmount.format(lowest.amount)})</span>
              <span> · 판매 {state.body.numForSale}건</span>
            </>
          : <span>정보 없음 · 현재 판매 중인 매물이 없습니다</span>)}
      </p>
      <p className="market-reference-meta">
        {lowest?.krw != null && state.status === "ready" && <span>환율 기준일 {state.body.exchangeRate.baseDate} · 1 USD = {won.format(state.body.exchangeRate.usdToKrw)} · </span>}
        <a href={sourceUrl} target="_blank" rel="noreferrer">출처: {sourceName} 마켓플레이스 ↗</a>
      </p>
    </section>
  );
}
