"use client";

import { useEffect, useMemo, useState } from "react";
import { MarketData } from "../../../packages/interfaces/src";
import { computeMarketAggregates } from "../../lib/market-aggregates";
import { formatCompactUsdAmount, formatPercent, formatRelativeTime } from "../../lib/market-format";

interface ProtocolSummaryBarProps {
  markets: MarketData[];
  dataUpdatedAt: number;
}

function LastUpdated({ dataUpdatedAt }: { dataUpdatedAt: number }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  return <>{formatRelativeTime(dataUpdatedAt, now)}</>;
}

export function ProtocolSummaryBar({ markets, dataUpdatedAt }: ProtocolSummaryBarProps) {
  const aggregates = useMemo(() => computeMarketAggregates(markets), [markets]);

  const metrics = [
    { label: "Markets", value: aggregates.count },
    { label: "TVL", value: formatCompactUsdAmount(aggregates.totalValueLockedUsd) },
    { label: "Avg Supply APY", value: formatPercent(aggregates.avgSupplyApyBps) },
    { label: "Avg Borrow APY", value: formatPercent(aggregates.avgBorrowApyBps) },
  ];

  return (
    <div className="rounded-2xl border border-market-border bg-market-surface px-5 py-3">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="flex items-baseline gap-2">
            <span className="text-xs uppercase tracking-wider text-market-text-muted">{metric.label}</span>
            <span className="text-sm font-medium tabular-nums text-market-text">{metric.value}</span>
          </div>
        ))}
        <div className="flex items-baseline gap-2">
          <span className="text-xs uppercase tracking-wider text-market-text-muted">Last Updated</span>
          <span className="text-sm font-medium tabular-nums text-market-text">
            <LastUpdated dataUpdatedAt={dataUpdatedAt} />
          </span>
        </div>
      </div>
    </div>
  );
}
