import { BorrowableAsset } from "../../../packages/interfaces/src";
import { formatCompactUsd, formatTokenQuantity, formatUsd } from "../../lib/market-format";
import { APYBadge } from "../markets/APYBadge";
import { AssetBadge } from "../markets/AssetBadge";
import { UtilizationBar } from "../markets/UtilizationBar";

interface BorrowRowProps {
  asset: BorrowableAsset;
  onBorrow: (asset: BorrowableAsset) => void;
}

export function BorrowRow({ asset, onBorrow }: BorrowRowProps) {
  return (
    <tr className="group border-b border-market-border transition-colors duration-200 last:border-0 hover:bg-market-surface-hover/70">
      <td className="py-5 pl-4 pr-6">
        <AssetBadge market={asset} />
      </td>
      <td className="px-6 py-5 tabular-nums text-market-text">
        {formatCompactUsd(asset.availableLiquidity, asset.decimals, asset.priceUsd)}
      </td>
      <td className="px-6 py-5 tabular-nums text-market-text-secondary">
        {formatUsd(asset.priceUsd, asset.priceUsd < 1 ? 4 : 2)}
      </td>
      <td className="px-6 py-5">
        <APYBadge bps={asset.borrowApyBps} tone="borrow" />
      </td>
      <td className="px-6 py-5 tabular-nums text-market-text">
        {formatTokenQuantity(asset.maxBorrowable, asset.decimals)} {asset.symbol}
      </td>
      <td className="px-6 py-5">
        <UtilizationBar bps={asset.utilizationBps} />
      </td>
      <td className="py-5 pl-6 pr-4">
        <button
          type="button"
          onClick={() => onBorrow(asset)}
          disabled={asset.maxBorrowable <= 0n}
          className="rounded-lg bg-market-text px-3 py-1.5 text-xs font-medium text-market-surface transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-market-text-secondary disabled:cursor-not-allowed disabled:opacity-40"
        >
          Borrow
        </button>
      </td>
    </tr>
  );
}
