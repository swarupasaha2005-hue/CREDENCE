import { SupplyAsset } from "../../../packages/interfaces/src";
import { formatCompactUsd, formatTokenQuantity, formatUsd } from "../../lib/market-format";
import { APYBadge } from "../markets/APYBadge";
import { AssetBadge } from "../markets/AssetBadge";
import { UtilizationBar } from "../markets/UtilizationBar";

interface AssetCardProps {
  asset: SupplyAsset;
  onSupply: (asset: SupplyAsset) => void;
}

export function AssetCard({ asset, onSupply }: AssetCardProps) {
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
          <dt className="text-market-text-muted">Wallet Balance</dt>
          <dd className="tabular-nums text-market-text">
            {formatTokenQuantity(asset.walletBalance, asset.decimals)} {asset.symbol}
          </dd>
        </div>
        <div>
          <dt className="text-market-text-muted">Total Supplied</dt>
          <dd className="tabular-nums text-market-text">
            {formatCompactUsd(asset.totalSupplied, asset.decimals, asset.priceUsd)}
          </dd>
        </div>
        <div>
          <dt className="text-market-text-muted">Supply APY</dt>
          <dd className="tabular-nums text-market-text">
            <APYBadge bps={asset.supplyApyBps} tone="supply" />
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-market-border pt-4">
        <UtilizationBar bps={asset.utilizationBps} />
        <button
          type="button"
          onClick={() => onSupply(asset)}
          className="rounded-lg bg-market-text px-3 py-1.5 text-xs font-medium text-market-surface transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-market-text-secondary"
        >
          Supply
        </button>
      </div>
    </div>
  );
}
