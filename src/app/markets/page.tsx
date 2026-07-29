"use client";

import { useMemo, useState } from "react";
import { MarketData } from "../../../packages/interfaces/src";
import { MarketFilters, MarketFilter, MarketSort } from "../../components/markets/MarketFilters";
import { MarketSearch } from "../../components/markets/MarketSearch";
import { MarketStats } from "../../components/markets/MarketStats";
import { MarketsTable } from "../../components/markets/MarketsTable";
import { ProtocolSummaryBar } from "../../components/markets/ProtocolSummaryBar";
import { MarketAction, SupplyBorrowModal } from "../../components/markets/SupplyBorrowModal";
import { useMarkets } from "../../hooks/useMarkets";

function sortMarkets(markets: MarketData[], sort: MarketSort): MarketData[] {
  const sorted = [...markets];
  switch (sort) {
    case "supply-desc":
      return sorted.sort((a, b) => Number(b.totalSupplied) - Number(a.totalSupplied));
    case "borrow-desc":
      return sorted.sort((a, b) => Number(b.totalBorrowed) - Number(a.totalBorrowed));
    case "apy-desc":
      return sorted.sort((a, b) => b.supplyApyBps - a.supplyApyBps);
    case "utilization-desc":
      return sorted.sort((a, b) => b.utilizationBps - a.utilizationBps);
    default:
      return sorted;
  }
}

export default function MarketsPage() {
  const { markets, isLoading, isError, refetch, dataUpdatedAt } = useMarkets();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<MarketFilter>("all");
  const [sort, setSort] = useState<MarketSort>("supply-desc");
  const [selected, setSelected] = useState<{ market: MarketData; action: MarketAction } | null>(null);

  const visibleMarkets = useMemo(() => {
    const query = search.trim().toLowerCase();
    const filtered = markets.filter((market) => {
      const matchesQuery =
        !query ||
        market.symbol.toLowerCase().includes(query) ||
        market.name.toLowerCase().includes(query);
      const matchesFilter = filter === "all" || market.collateralEnabled;
      return matchesQuery && matchesFilter;
    });
    return sortMarkets(filtered, sort);
  }, [markets, search, filter, sort]);

  return (
    <div className="min-h-screen px-6 pb-12 pt-24">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-market-text">Markets</h1>
          <p className="mt-1 text-market-text-secondary">
            Supply assets to earn yield or borrow against your collateral.
          </p>
        </div>

        <MarketStats markets={markets} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <MarketSearch value={search} onChange={setSearch} />
          <MarketFilters filter={filter} onFilterChange={setFilter} sort={sort} onSortChange={setSort} />
        </div>

        <ProtocolSummaryBar markets={markets} dataUpdatedAt={dataUpdatedAt} />

        <MarketsTable
          markets={visibleMarkets}
          isLoading={isLoading}
          isError={isError}
          onRetry={refetch}
          onAction={(market, action) => setSelected({ market, action })}
        />
      </div>

      <SupplyBorrowModal
        market={selected?.market ?? null}
        action={selected?.action ?? null}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
