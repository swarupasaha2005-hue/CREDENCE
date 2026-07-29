import { SupplyAsset } from "../../../packages/interfaces/src";
import { EmptyState } from "../shared/EmptyState";
import { LoadingSkeletonCards, LoadingSkeletonRows } from "../shared/LoadingSkeleton";
import { AssetCard } from "./AssetCard";
import { SupplyRow } from "./SupplyRow";

const COLUMNS = ["Asset", "Wallet Balance", "Current Price", "Supply APY", "Total Supplied", "Utilization", ""];

interface SupplyTableProps {
  assets: SupplyAsset[];
  isLoading: boolean;
  onSupply: (asset: SupplyAsset) => void;
}

export function SupplyTable({ assets, isLoading, onSupply }: SupplyTableProps) {
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
    return <EmptyState title="No assets available" description="Check back later for supply markets." />;
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-2xl border border-market-border bg-market-surface md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">Available assets to supply</caption>
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
              <SupplyRow key={asset.symbol} asset={asset} onSupply={onSupply} />
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {assets.map((asset) => (
          <AssetCard key={asset.symbol} asset={asset} onSupply={onSupply} />
        ))}
      </div>
    </>
  );
}
