"use client";

import { useRef } from "react";
import type { PriceHistory } from "../../../src/types.ts";
import PriceHistoryChart from "./price-history-chart.tsx";

const won = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0
});

export default function PriceHistoryDialog({ history, currentPrice }: {
  history: PriceHistory | null;
  currentPrice: number;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button className="price-history-trigger" type="button" onClick={() => dialogRef.current?.showModal()}>
        <span><small>거래 시세</small><strong>{history ? `최근 ${won.format(history.latestPrice)}` : "거래 내역 없음"}</strong></span>
        <span aria-hidden="true">그래프 보기 →</span>
      </button>
      <dialog
        ref={dialogRef}
        className="price-history-dialog"
        aria-label="거래 시세 그래프"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="price-history-dialog-header">
          <div><p className="eyebrow">MARKET HISTORY</p><h2>판본 거래 시세</h2></div>
          <button className="dialog-close" type="button" onClick={() => dialogRef.current?.close()} aria-label="시세 그래프 닫기">×</button>
        </div>
        <PriceHistoryChart history={history} currentPrice={currentPrice} />
      </dialog>
    </>
  );
}
