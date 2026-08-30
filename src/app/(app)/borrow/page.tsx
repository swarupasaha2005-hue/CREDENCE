"use client";

import { useState } from "react";
import { BorrowableAsset, BorrowPosition } from "../../../../packages/interfaces/src";
import { useStellar } from "../../../context/StellarContext";
import { BorrowModal } from "../../../components/borrow/BorrowModal";
import { BorrowPositionsTable } from "../../../components/borrow/BorrowPositionsTable";
import { BorrowSummary } from "../../../components/borrow/BorrowSummary";
import { BorrowTable } from "../../../components/borrow/BorrowTable";
import { RepayModal } from "../../../components/borrow/RepayModal";
import { RiskBanner } from "../../../components/borrow/RiskBanner";
import { useBorrowableAssets, useBorrowPositions, useBorrowSnapshot } from "../../../hooks/useBorrow";

export default function BorrowPage() {
  const { address } = useStellar();
  const user = address ?? "";

  const { assets, isLoading: assetsLoading } = useBorrowableAssets(user);
  const { positions, isLoading: positionsLoading } = useBorrowPositions(user);
  const { snapshot } = useBorrowSnapshot(user);

  const [borrowTarget, setBorrowTarget] = useState<BorrowableAsset | null>(null);
  const [repayTarget, setRepayTarget] = useState<BorrowPosition | null>(null);

  return (
    <div className="min-h-screen px-6 pb-12 pt-24">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold tracking-tight text-market-text">Borrow</h1>
          <p className="mt-1 text-market-text-secondary">
            Borrow supported assets using your supplied collateral while monitoring your borrowing health.
          </p>
        </div>

        <BorrowSummary snapshot={snapshot} />

        <RiskBanner snapshot={snapshot} />

        <section className="space-y-4">
          <h2 className="text-lg font-medium text-market-text">My Borrow Positions</h2>
          <BorrowPositionsTable
            positions={positions}
            isLoading={positionsLoading}
            isConnected={Boolean(address)}
            onRepay={setRepayTarget}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-medium text-market-text">Borrowable Assets</h2>
          <BorrowTable assets={assets} isLoading={assetsLoading} onBorrow={setBorrowTarget} />
        </section>
      </div>

      <BorrowModal asset={borrowTarget} snapshot={snapshot} onClose={() => setBorrowTarget(null)} />
      <RepayModal position={repayTarget} onClose={() => setRepayTarget(null)} />
    </div>
  );
}
