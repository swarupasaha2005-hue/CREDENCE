import { SupplyPosition } from "../../../packages/interfaces/src";
import { formatCompactUsd, formatPercent, formatTokenQuantity } from "../../lib/market-format";
import { EmptyState } from "../shared/EmptyState";
import { LoadingSkeletonCards, LoadingSkeletonRows } from "../shared/LoadingSkeleton";
import { PositionCard } from "./PositionCard";

const COLUMNS = ["Asset", "Supplied Amount", "Current Value", "Supply APY", "Interest Earned", "Actions"];

interface PositionsTableProps {
  positions: SupplyPosition[];
  isLoading: boolean;
  isConnected: boolean;
  onWithdraw: (position: SupplyPosition) => void;
}

export function PositionsTable({ positions, isLoading, isConnected, onWithdraw }: PositionsTableProps) {
  if (!isConnected) {
    return (
      <EmptyState
        title="No wallet connected"
        description="Connect your wallet to view and manage your supply positions."
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
        title="No supply positions yet"
        description="Supply an asset below to start earning passive yield."
      />
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-market-border bg-market-surface md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">My supply positions</caption>
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
                  {formatTokenQuantity(position.suppliedAmount, position.decimals)} {position.symbol}
                </td>
                <td className="px-6 py-5 tabular-nums text-market-text">
                  {formatCompactUsd(position.suppliedAmount, position.decimals, position.priceUsd)}
                </td>
                <td className="px-6 py-5 tabular-nums text-market-text">{formatPercent(position.supplyApyBps)}</td>
                <td className="px-6 py-5 tabular-nums text-market-text">
                  {formatCompactUsd(position.interestEarned, position.decimals, position.priceUsd)}
                </td>
                <td className="py-5 pl-6 pr-4">
                  <button
                    type="button"
                    onClick={() => onWithdraw(position)}
                    className="rounded-lg border border-market-border px-3 py-1.5 text-xs font-medium text-market-text transition-colors hover:bg-market-surface-hover"
                  >
                    Withdraw
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {positions.map((position) => (
          <PositionCard key={position.symbol} position={position} onWithdraw={onWithdraw} />
        ))}
      </div>
    </>
  );
}
