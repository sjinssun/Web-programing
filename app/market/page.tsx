import type { Metadata } from "next";
import { boardStore } from "../../lib/board-store-instance.ts";
import MarketPage from "../market-page.tsx";

export const metadata: Metadata = {
  title: "마켓 | VYNL",
  description: "판본과 실물 상태를 비교하고 거래하는 VYNL 앨범 마켓"
};

export default function MarketRoute() {
  return (
    <MarketPage
      initialListings={boardStore.findListings({ sort: "newest" })}
      editions={boardStore.getMeta().editions}
    />
  );
}
