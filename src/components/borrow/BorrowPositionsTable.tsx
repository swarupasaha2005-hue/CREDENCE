import { useMemo } from "react";
import { BorrowPosition } from "../../../packages/interfaces/src";
import { computeBorrowPositionsAggregate, healthContributionBps } from "../../lib/borrow-aggregates";
import { formatCompactUsd, formatPercent, formatTokenQuantity } from "../../lib/market-format";
import { EmptyState } from "../shared/EmptyState";
import { LoadingSkeletonCards, LoadingSkeletonRows } from "../shared/LoadingSkeleton";
import { BorrowPositionCard } from "./BorrowPositionCard";

const COLUMNS = [
  "Asset",
  "Borrowed Amount",
  "Current Value",
  "Borrow APY",
  "Accrued Interest",
  "Health Contribution",
  "Actions",
];

interface BorrowPositionsTableProps {
  positions: BorrowPosition[];
  isLoading: boolean;
  isConnected: boolean;
  onRepay: (position: BorrowPosition) => void;
}

export function BorrowPositionsTable({ positions, isLoading, isConnected, onRepay }: BorrowPositionsTableProps) {
  const totalBorrowedUsd = useMemo(() => computeBorrowPositionsAggregate(positions).totalBorrowedUsd, [positions]);

  if (!isConnected) {
    return (
      <EmptyState
        title="No wallet connected"
        description="Connect your wallet to view and manage your borrow positions."
      />
    );
  }

  if (isLoading) {
    return (
      <>
        <div className="hidden overflow-x-auto rounded-2xl border border-market-border bg-market-surface md:block">
          <table className="w-full text-left text-sm">
            <tbody>
              <LoadingSkeletonRows columns={COLUMNS.length} rows={2} />
            </tbody>
          </table>
        </div>
        <LoadingSkeletonCards count={2} />
      </>
    );
  }

  if (positions.length === 0) {
    return (
      <EmptyState
        title="No active loans"
        description="Borrow against your supplied collateral once you've deposited assets."
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-market-border bg-market-surface md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">My borrow positions</caption>
          <thead>
            <tr className="border-b border-market-border text-xs uppercase tracking-wider text-market-text-muted">
              {COLUMNS.map((col) => (
                <th key={col} scope="col" className="px-6 py-3 font-medium first:pl-4 last:pr-4">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => (
              <tr
                key={position.symbol}
                className="border-b border-market-border transition-colors duration-200 last:border-0 hover:bg-market-surface-hover/70"
              >
                <td className="py-5 pl-4 pr-6">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-market-surface-hover">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={position.iconUrl} alt={`${position.name} icon`} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="font-medium text-market-text">{position.symbol}</span>
                      <span className="text-xs text-market-text-muted">{position.name}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5 tabular-nums text-market-text">
                  {formatTokenQuantity(position.borrowedAmount, position.decimals)} {position.symbol}
                </td>
                <td className="px-6 py-5 tabular-nums text-market-text">
                  {formatCompactUsd(position.borrowedAmount, position.decimals, position.priceUsd)}
                </td>
                <td className="px-6 py-5 tabular-nums text-market-text">{formatPercent(position.borrowApyBps)}</td>
                <td className="px-6 py-5 tabular-nums text-market-text">
                  {formatCompactUsd(position.accruedInterest, position.decimals, position.priceUsd)}
                </td>
                <td className="px-6 py-5 tabular-nums text-market-text">
                  {formatPercent(healthContributionBps(position, totalBorrowedUsd))}
                </td>
                <td className="py-5 pl-6 pr-4">
                  <button
                    type="button"
                    onClick={() => onRepay(position)}
                    className="rounded-lg border border-market-border px-3 py-1.5 text-xs font-medium text-market-text transition-colors hover:bg-market-surface-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-market-text-secondary"
                  >
                    Repay
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {positions.map((position) => (
          <BorrowPositionCard
            key={position.symbol}
            position={position}
            totalBorrowedUsd={totalBorrowedUsd}
            onRepay={onRepay}
          />
        ))}
      </div>
    </>
  );
}
