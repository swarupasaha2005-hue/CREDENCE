import { BorrowableAsset } from "../../../packages/interfaces/src";
import { formatCompactUsd, formatTokenQuantity, formatUsd } from "../../lib/market-format";
import { APYBadge } from "../markets/APYBadge";
import { AssetBadge } from "../markets/AssetBadge";
import { UtilizationBar } from "../markets/UtilizationBar";

interface BorrowAssetCardProps {
  asset: BorrowableAsset;
  onBorrow: (asset: BorrowableAsset) => void;
}

export function BorrowAssetCard({ asset, onBorrow }: BorrowAssetCardProps) {
  return (
    <div className="rounded-2xl border border-market-border bg-market-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <AssetBadge market={asset} />
        <span className="tabular-nums text-sm text-market-text-secondary">
          {formatUsd(asset.priceUsd, asset.priceUsd < 1 ? 4 : 2)}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-y-3 text-sm">
        <div>
          <dt className="text-market-text-muted">Available Liquidity</dt>
          <dd className="tabular-nums text-market-text">
            {formatCompactUsd(asset.availableLiquidity, asset.decimals, asset.priceUsd)}
          </dd>
        </div>
        <div>
          <dt className="text-market-text-muted">Maximum Borrowable</dt>
          <dd className="tabular-nums text-market-text">
            {formatTokenQuantity(asset.maxBorrowable, asset.decimals)} {asset.symbol}
          </dd>
        </div>
        <div>
          <dt className="text-market-text-muted">Borrow APY</dt>
          <dd className="tabular-nums text-market-text">
            <APYBadge bps={asset.borrowApyBps} tone="borrow" />
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-market-border pt-4">
        <UtilizationBar bps={asset.utilizationBps} />
        <button
          type="button"
          onClick={() => onBorrow(asset)}
          disabled={asset.maxBorrowable <= 0n}
          className="rounded-lg bg-market-text px-3 py-1.5 text-xs font-medium text-market-surface transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-market-text-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Borrow
        </button>
      </div>
    </div>
  );
}
