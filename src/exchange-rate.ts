// 해외 참고 시세를 원화로 환산할 때 쓰는 유일한 고정 환율이다. 실시간 환율이 아니다.
// 값을 바꿀 때는 기준일도 함께 갱신한다.
// 2026-10-29 USD/KRW 시장 중간값(XE 1,333.70 · Trading Economics 1,332.23)을 반올림했다.
export const USD_TO_KRW = 1334;
export const USD_TO_KRW_BASE_DATE = "2026-10-29";

// 기존 KRW 가격과 같이 원 단위 정수로 반올림한다.
export function usdToKrw(usd: number): number {
  return Math.round(usd * USD_TO_KRW);
}
