import { RefreshCcw } from "lucide-react";
import { MarketData } from "../../../packages/interfaces/src";
import { MarketAction } from "./SupplyBorrowModal";
import { MarketCard } from "./MarketCard";
import { MarketRow } from "./MarketRow";

const COLUMNS = [
  "Asset",
  "Price",
  "Total Supplied",
  "Total Borrowed",
  "Available Liquidity",
  "Supply APY",
  "Borrow APY",
  "Utilization",
  "Actions",
];

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b border-market-border last:border-0">
          {COLUMNS.map((col) => (
            <td key={col} className="px-4 py-4">
              <div className="h-4 w-20 animate-pulse rounded bg-market-surface-hover" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function SkeletonCards() {
  return (
    <div className="space-y-3 md:hidden">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl border border-market-border bg-market-surface" />
      ))}
    </div>
  );
}

interface MarketsTableProps {
  markets: MarketData[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onAction: (market: MarketData, action: MarketAction) => void;
}

export function MarketsTable({ markets, isLoading, isError, onRetry, onAction }: MarketsTableProps) {
  if (isError) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-market-border bg-market-surface py-16 text-center">
        <p className="text-market-text">Failed to load markets.</p>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-lg border border-market-border px-4 py-2 text-sm text-market-text transition-colors hover:bg-market-surface-hover"
        >
          <RefreshCcw className="h-4 w-4" />
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <>
        <div className="hidden overflow-x-auto rounded-2xl border border-market-border bg-market-surface md:block">
          <table className="w-full text-left text-sm">
            <tbody>
              <SkeletonRows />
            </tbody>
          </table>
        </div>
        <SkeletonCards />
      </>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="rounded-2xl border border-market-border bg-market-surface py-16 text-center text-market-text-muted">
        No markets match your filters.
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-market-border bg-market-surface md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Lending markets</caption>
          <thead>
            <tr className="border-b border-market-border text-xs uppercase tracking-wider text-market-text-muted">
              {COLUMNS.map((col) => (
                <th key={col} scope="col" className="px-4 py-3 font-medium first:pl-4 last:pr-4">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {markets.map((market) => (
              <MarketRow key={market.symbol} market={market} onAction={onAction} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {markets.map((market) => (
          <MarketCard key={market.symbol} market={market} onAction={onAction} />
        ))}
      </div>
    </>
  );
}
