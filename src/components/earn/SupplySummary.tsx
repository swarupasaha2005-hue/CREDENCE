import { useMemo } from "react";
import { SupplyPosition } from "../../../packages/interfaces/src";
import { computeSupplyAggregates } from "../../lib/supply-aggregates";
import { formatCompactUsdAmount } from "../../lib/market-format";

export function SupplySummary({ positions }: { positions: SupplyPosition[] }) {
  const aggregates = useMemo(() => computeSupplyAggregates(positions), [positions]);

  const stats = [
    { label: "Total Supplied", value: formatCompactUsdAmount(aggregates.totalSuppliedUsd) },
    { label: "Estimated Annual Yield", value: formatCompactUsdAmount(aggregates.estimatedAnnualYieldUsd) },
    { label: "Active Supply Positions", value: String(aggregates.activePositionCount) },
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
