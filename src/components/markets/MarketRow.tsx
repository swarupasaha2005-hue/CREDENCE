import { MarketData } from "../../../packages/interfaces/src";
import { formatCompactUsd, formatUsd } from "../../lib/market-format";
import { ActionButtons } from "./ActionButtons";
import { APYBadge } from "./APYBadge";
import { AssetBadge } from "./AssetBadge";
import { MarketAction } from "./ActionButtons";
import { UtilizationBar } from "./UtilizationBar";

interface MarketRowProps {
  market: MarketData;
  onAction: (market: MarketData, action: MarketAction) => void;
}

export function MarketRow({ market, onAction }: MarketRowProps) {
  return (
    <tr className="group border-b border-market-border transition-colors duration-200 last:border-0 hover:bg-market-surface-hover/70">
      <td className="py-5 pr-6">
        <AssetBadge market={market} />
      </td>
      <td className="px-6 py-5 tabular-nums text-market-text-secondary">
        {formatUsd(market.priceUsd, market.priceUsd < 1 ? 4 : 2)}
      </td>
      <td className="px-6 py-5 tabular-nums text-market-text">
        {formatCompactUsd(market.totalSupplied, market.decimals, market.priceUsd)}
      </td>
      <td className="px-6 py-5 tabular-nums text-market-text">
        {formatCompactUsd(market.totalBorrowed, market.decimals, market.priceUsd)}
      </td>
      <td className="px-6 py-5 tabular-nums text-market-text">
        {formatCompactUsd(market.availableLiquidity, market.decimals, market.priceUsd)}
      </td>
      <td className="px-6 py-5">
        <APYBadge bps={market.supplyApyBps} tone="supply" />
      </td>
      <td className="px-6 py-5">
        <APYBadge bps={market.borrowApyBps} tone="borrow" />
      </td>
      <td className="px-6 py-5">
        <UtilizationBar bps={market.utilizationBps} />
      </td>
      <td className="py-5 pl-6">
        <ActionButtons onAction={(action) => onAction(market, action)} />
      </td>
    </tr>
  );
}
