import { formatPercent } from "../../lib/market-format";

export function UtilizationBar({ bps }: { bps: number }) {
  const percent = Math.min(100, bps / 100);
  return (
    <div className="flex min-w-[120px] items-center gap-2" role="meter" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Utilization">
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-market-surface-hover">
        <div
          className="h-full rounded-full bg-market-text-secondary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-market-text-muted">{formatPercent(bps)}</span>
    </div>
  );
}
