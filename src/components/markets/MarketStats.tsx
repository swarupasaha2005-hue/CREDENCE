import { useMemo } from "react";
import { MarketData } from "../../../packages/interfaces/src";
import { computeMarketAggregates } from "../../lib/market-aggregates";
import { formatCompactUsdAmount } from "../../lib/market-format";

export function MarketStats({ markets }: { markets: MarketData[] }) {
  const aggregates = useMemo(() => computeMarketAggregates(markets), [markets]);

  const stats = [
    { label: "Total Value Locked", value: formatCompactUsdAmount(aggregates.totalValueLockedUsd) },
    { label: "Total Borrowed", value: formatCompactUsdAmount(aggregates.totalBorrowedUsd) },
    { label: "Available Liquidity", value: formatCompactUsdAmount(aggregates.availableLiquidityUsd) },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-market-border bg-market-surface p-4">
          <p className="text-xs uppercase tracking-wider text-market-text-muted">{stat.label}</p>
          <p className="mt-1 text-xl font-medium tabular-nums text-market-text">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
