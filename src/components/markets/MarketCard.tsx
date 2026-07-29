import { MarketData } from "../../../packages/interfaces/src";
import { formatCompactUsd, formatPercent, formatUsd } from "../../lib/market-format";
import { ActionButtons } from "./ActionButtons";
import { AssetBadge } from "./AssetBadge";
import { MarketAction } from "./SupplyBorrowModal";
import { UtilizationBar } from "./UtilizationBar";

interface MarketCardProps {
  market: MarketData;
  onAction: (market: MarketData, action: MarketAction) => void;
}

export function MarketCard({ market, onAction }: MarketCardProps) {
  return (
    <div className="rounded-2xl border border-market-border bg-market-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <AssetBadge market={market} />
        <span className="tabular-nums text-sm text-market-text-secondary">
          {formatUsd(market.priceUsd, market.priceUsd < 1 ? 4 : 2)}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-y-3 text-sm">
        <div>
          <dt className="text-market-text-muted">Supplied</dt>
          <dd className="tabular-nums text-market-text">
            {formatCompactUsd(market.totalSupplied, market.decimals, market.priceUsd)}
          </dd>
        </div>
        <div>
          <dt className="text-market-text-muted">Borrowed</dt>
          <dd className="tabular-nums text-market-text">
            {formatCompactUsd(market.totalBorrowed, market.decimals, market.priceUsd)}
          </dd>
        </div>
        <div>
          <dt className="text-market-text-muted">Available Liquidity</dt>
          <dd className="tabular-nums text-market-text">
            {formatCompactUsd(market.availableLiquidity, market.decimals, market.priceUsd)}
          </dd>
        </div>
        <div>
          <dt className="text-market-text-muted">Supply APY</dt>
          <dd className="tabular-nums text-market-text">{formatPercent(market.supplyApyBps)}</dd>
        </div>
        <div>
          <dt className="text-market-text-muted">Borrow APY</dt>
          <dd className="tabular-nums text-market-text-secondary">{formatPercent(market.borrowApyBps)}</dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-market-border pt-4">
        <UtilizationBar bps={market.utilizationBps} />
        <ActionButtons onAction={(action) => onAction(market, action)} />
      </div>
    </div>
  );
}
