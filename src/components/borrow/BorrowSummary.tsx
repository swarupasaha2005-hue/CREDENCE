import { useMemo } from "react";
import { BorrowSnapshot } from "../../../packages/interfaces/src";
import {
  computeBorrowLimitUsedBps,
  computeBorrowPowerRemainingUsd,
  computeHealthFactor,
} from "../../lib/borrow-risk";
import { formatCompactUsdAmount, formatPercent } from "../../lib/market-format";
import { BorrowLimitBar } from "./BorrowLimitBar";
import { HealthFactorBadge } from "./HealthFactorBadge";

export function BorrowSummary({ snapshot }: { snapshot: BorrowSnapshot }) {
  const derived = useMemo(() => {
    const healthFactor = computeHealthFactor(
      snapshot.totalCollateralUsd,
      snapshot.totalDebtUsd,
      snapshot.liquidationThresholdBps
    );
    return {
      borrowPowerRemainingUsd: computeBorrowPowerRemainingUsd(snapshot),
      healthFactor,
      borrowLimitUsedBps: computeBorrowLimitUsedBps(snapshot),
    };
  }, [snapshot]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-2xl border border-market-border bg-market-surface p-4">
        <p className="text-xs uppercase tracking-wider text-market-text-muted">Borrow Power</p>
        <p className="mt-1 text-xl font-medium tabular-nums text-market-text">
          {formatCompactUsdAmount(derived.borrowPowerRemainingUsd)}
        </p>
      </div>

      <div className="rounded-2xl border border-market-border bg-market-surface p-4">
        <p className="text-xs uppercase tracking-wider text-market-text-muted">Total Borrowed</p>
        <p className="mt-1 text-xl font-medium tabular-nums text-market-text">
          {formatCompactUsdAmount(snapshot.totalDebtUsd)}
        </p>
      </div>

      <div className="rounded-2xl border border-market-border bg-market-surface p-4">
        <p className="text-xs uppercase tracking-wider text-market-text-muted">Health Factor</p>
        <div className="mt-1">
          <HealthFactorBadge healthFactor={derived.healthFactor} />
        </div>
      </div>

      <div className="rounded-2xl border border-market-border bg-market-surface p-4">
        <p className="text-xs uppercase tracking-wider text-market-text-muted">Borrow Limit Used</p>
        <p className="mt-1 mb-2 text-xl font-medium tabular-nums text-market-text">
          {formatPercent(derived.borrowLimitUsedBps)}
        </p>
        <BorrowLimitBar bps={derived.borrowLimitUsedBps} />
      </div>
    </div>
  );
}
