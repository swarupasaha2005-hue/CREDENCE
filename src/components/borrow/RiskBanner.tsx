import { useMemo } from "react";
import { BorrowSnapshot } from "../../../packages/interfaces/src";
import {
  computeBorrowPowerRemainingUsd,
  computeCurrentLtvBps,
  computeHealthFactor,
} from "../../lib/borrow-risk";
import { formatCompactUsdAmount, formatPercent } from "../../lib/market-format";
import { HealthFactorBadge } from "./HealthFactorBadge";

export function RiskBanner({ snapshot }: { snapshot: BorrowSnapshot }) {
  const derived = useMemo(() => {
    const healthFactor = computeHealthFactor(
      snapshot.totalCollateralUsd,
      snapshot.totalDebtUsd,
      snapshot.liquidationThresholdBps
    );
    return {
      healthFactor,
      borrowPowerRemainingUsd: computeBorrowPowerRemainingUsd(snapshot),
      currentLtvBps: computeCurrentLtvBps(snapshot),
    };
  }, [snapshot]);

  return (
    <div className="rounded-2xl border border-market-border bg-market-surface px-5 py-3">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
        <div className="flex items-baseline gap-2">
          <span className="text-xs uppercase tracking-wider text-market-text-muted">Health Factor</span>
          <HealthFactorBadge healthFactor={derived.healthFactor} size="sm" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs uppercase tracking-wider text-market-text-muted">Liquidation Threshold</span>
          <span className="text-sm font-medium tabular-nums text-market-text">
            {formatPercent(snapshot.liquidationThresholdBps)}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs uppercase tracking-wider text-market-text-muted">Borrow Limit Remaining</span>
          <span className="text-sm font-medium tabular-nums text-market-text">
            {formatCompactUsdAmount(derived.borrowPowerRemainingUsd)}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xs uppercase tracking-wider text-market-text-muted">Current LTV</span>
          <span className="text-sm font-medium tabular-nums text-market-text">
            {formatPercent(derived.currentLtvBps)}
          </span>
        </div>
      </div>
    </div>
  );
}
