import { BorrowableAsset } from "../../../packages/interfaces/src";
import { EmptyState } from "../shared/EmptyState";
import { LoadingSkeletonCards, LoadingSkeletonRows } from "../shared/LoadingSkeleton";
import { BorrowAssetCard } from "./BorrowAssetCard";
import { BorrowRow } from "./BorrowRow";

const COLUMNS = [
  "Asset",
  "Available Liquidity",
  "Current Price",
  "Borrow APY",
  "Maximum Borrowable",
  "Utilization",
  "",
];

interface BorrowTableProps {
  assets: BorrowableAsset[];
  isLoading: boolean;
  onBorrow: (asset: BorrowableAsset) => void;
}

export function BorrowTable({ assets, isLoading, onBorrow }: BorrowTableProps) {
  if (isLoading) {
    return (
      <>
        <div className="hidden overflow-x-auto rounded-2xl border border-market-border bg-market-surface md:block">
          <table className="w-full text-left text-sm">
            <tbody>
              <LoadingSkeletonRows columns={COLUMNS.length} rows={3} />
            </tbody>
          </table>
        </div>
        <LoadingSkeletonCards />
      </>
    );
  }

  if (assets.length === 0) {
    return <EmptyState title="No assets available" description="Check back later for borrow markets." />;
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-market-border bg-market-surface md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Borrowable assets</caption>
          <thead>
            <tr className="border-b border-market-border text-xs uppercase tracking-wider text-market-text-muted">
              {COLUMNS.map((col, i) => (
                <th key={col || i} scope="col" className="px-6 py-3 font-medium first:pl-4 last:pr-4">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => (
              <BorrowRow key={asset.symbol} asset={asset} onBorrow={onBorrow} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {assets.map((asset) => (
          <BorrowAssetCard key={asset.symbol} asset={asset} onBorrow={onBorrow} />
        ))}
      </div>
    </>
  );
}
