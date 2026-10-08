import type { PriceHistory } from "../../../src/types.ts";

const won = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0
});

const shortDate = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric"
});

export default function PriceHistoryChart({ history, currentPrice }: {
  history: PriceHistory | null;
  currentPrice: number;
}) {
  if (!history) return <p className="price-history-state">아직 표시할 거래 시세가 없습니다.</p>;

  const width = 520;
  const height = 220;
  const chart = { left: 58, right: 14, top: 14, bottom: 32 };
  const prices = [...history.points.map(({ price }) => price), currentPrice];
  const rawMin = Math.min(...prices);
  const rawMax = Math.max(...prices);
  const padding = Math.max((rawMax - rawMin) * 0.18, 1000);
  const minPrice = Math.max(0, rawMin - padding);
  const maxPrice = rawMax + padding;
  const x = (index: number) => chart.left + (index / Math.max(history.points.length - 1, 1)) * (width - chart.left - chart.right);
  const y = (price: number) => chart.top + ((maxPrice - price) / (maxPrice - minPrice)) * (height - chart.top - chart.bottom);
  const line = history.points.map((point, index) => `${x(index)},${y(point.price)}`).join(" ");
  const tickIndexes = [...new Set([0, Math.floor((history.points.length - 1) / 2), history.points.length - 1])];
  const yTicks = [maxPrice, (maxPrice + minPrice) / 2, minPrice];

  return (
    <section className="price-history" aria-labelledby={`price-history-${history.editionId}`}>
      <div className="price-history-heading">
        <div><p className="eyebrow">LAST 6 MONTHS</p><h2 id={`price-history-${history.editionId}`}>거래 시세</h2></div>
        <small>데모 체결 데이터 · 배송비 제외</small>
      </div>
      <dl className="price-summary">
        <div><dt>최근 거래</dt><dd>{won.format(history.latestPrice)}</dd></div>
        <div><dt>평균</dt><dd>{won.format(history.averagePrice)}</dd></div>
        <div><dt>거래 범위</dt><dd>{won.format(history.lowestPrice)}–{won.format(history.highestPrice)}</dd></div>
      </dl>
      <div className="price-chart-legend" aria-hidden="true"><span><i className="history-dot" />체결가</span><span><i className="current-line" />현재 판매가</span></div>
      <svg className="price-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`최근 거래가 ${history.lowestPrice}원에서 ${history.highestPrice}원, 현재 판매가 ${currentPrice}원`}>
        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={chart.left} x2={width - chart.right} y1={y(tick)} y2={y(tick)} className="price-grid-line" />
            <text x={chart.left - 7} y={y(tick) + 4} textAnchor="end">{Math.round(tick / 1000)}k</text>
          </g>
        ))}
        <line x1={chart.left} x2={width - chart.right} y1={y(currentPrice)} y2={y(currentPrice)} className="current-price-line" />
        <polyline points={line} className="history-price-line" />
        {history.points.map((point, index) => (
          <circle
            key={point.id}
            cx={x(index)}
            cy={y(point.price)}
            r="4"
            aria-label={`${shortDate.format(new Date(point.tradedAt))} · ${won.format(point.price)}`}
          />
        ))}
        {tickIndexes.map((index) => (
          <text key={history.points[index].id} x={x(index)} y={height - 8} textAnchor={index === 0 ? "start" : index === history.points.length - 1 ? "end" : "middle"}>
            {shortDate.format(new Date(history.points[index].tradedAt))}
          </text>
        ))}
      </svg>
    </section>
  );
}
