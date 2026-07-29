import { SupplyPosition } from "../../../packages/interfaces/src";
import { formatCompactUsd, formatPercent, formatTokenQuantity } from "../../lib/market-format";

interface PositionCardProps {
  position: SupplyPosition;
  onWithdraw: (position: SupplyPosition) => void;
}

export function PositionCard({ position, onWithdraw }: PositionCardProps) {
  return (
    <div className="rounded-2xl border border-market-border bg-market-surface p-4">
      <div className="mb-4 flex items-center justify-between">
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
        <span className="text-sm font-medium tabular-nums text-market-text">
          {formatPercent(position.supplyApyBps)}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-y-3 text-sm">
        <div>
          <dt className="text-market-text-muted">Supplied Amount</dt>
          <dd className="tabular-nums text-market-text">
            {formatTokenQuantity(position.suppliedAmount, position.decimals)} {position.symbol}
          </dd>
        </div>
        <div>
          <dt className="text-market-text-muted">Current Value</dt>
          <dd className="tabular-nums text-market-text">
            {formatCompactUsd(position.suppliedAmount, position.decimals, position.priceUsd)}
          </dd>
        </div>
        <div>
          <dt className="text-market-text-muted">Interest Earned</dt>
          <dd className="tabular-nums text-market-text">
            {formatCompactUsd(position.interestEarned, position.decimals, position.priceUsd)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-market-border pt-4">
        <button
          type="button"
          onClick={() => onWithdraw(position)}
          className="w-full rounded-lg border border-market-border px-3 py-1.5 text-xs font-medium text-market-text transition-colors hover:bg-market-surface-hover"
        >
          Withdraw
        </button>
      </div>
    </div>
  );
}
