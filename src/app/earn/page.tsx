"use client";

import { useState } from "react";
import { SupplyAsset, SupplyPosition } from "../../../packages/interfaces/src";
import { useStellar } from "../../context/StellarContext";
import { PositionsTable } from "../../components/earn/PositionsTable";
import { SupplyModal, SupplyModalMode, SupplyModalTarget } from "../../components/earn/SupplyModal";
import { SupplySummary } from "../../components/earn/SupplySummary";
import { SupplyTable } from "../../components/earn/SupplyTable";
import { useSupplyAssets, useSupplyPositions } from "../../hooks/useSupply";

export default function EarnPage() {
  const { address } = useStellar();
  const user = address ?? "";

  const { assets, isLoading: assetsLoading } = useSupplyAssets(user);
  const { positions, isLoading: positionsLoading } = useSupplyPositions(user);

  const [selected, setSelected] = useState<{ target: SupplyModalTarget; mode: SupplyModalMode } | null>(null);

  const handleSupply = (asset: SupplyAsset) => {
    setSelected({
      mode: "supply",
      target: {
        symbol: asset.symbol,
        name: asset.name,
        iconUrl: asset.iconUrl,
        decimals: asset.decimals,
        priceUsd: asset.priceUsd,
        supplyApyBps: asset.supplyApyBps,
        maxRaw: asset.walletBalance,
      },
    });
  };

  const handleWithdraw = (position: SupplyPosition) => {
    setSelected({
      mode: "withdraw",
      target: {
        symbol: position.symbol,
        name: position.name,
        iconUrl: position.iconUrl,
        decimals: position.decimals,
        priceUsd: position.priceUsd,
        supplyApyBps: position.supplyApyBps,
        maxRaw: position.suppliedAmount,
      },
    });
  };

  return (
    <div className="min-h-screen px-6 pb-12 pt-24">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-market-text">Earn</h1>
          <p className="mt-1 text-market-text-secondary">
            Supply assets to Credence and earn passive yield while keeping your funds available as collateral.
          </p>
        </div>

        <SupplySummary positions={positions} />

        <section className="space-y-4">
          <h2 className="text-lg font-medium text-market-text">My Supply Positions</h2>
          <PositionsTable
            positions={positions}
            isLoading={positionsLoading}
            isConnected={Boolean(address)}
            onWithdraw={handleWithdraw}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium text-market-text">Available Assets</h2>
          <SupplyTable assets={assets} isLoading={assetsLoading} onSupply={handleSupply} />
        </section>
      </div>

      <SupplyModal
        target={selected?.target ?? null}
        mode={selected?.mode ?? null}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
