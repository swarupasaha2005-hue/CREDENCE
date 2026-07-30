"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BorrowableAsset, BorrowSnapshot } from "../../../packages/interfaces/src";
import { useStellar } from "../../context/StellarContext";
import { useBorrowMutation } from "../../hooks/useBorrow";
import { computeBorrowPowerRemainingUsd, projectBorrow } from "../../lib/borrow-risk";
import { formatCompactUsdAmount, formatPercent, formatTokenQuantity } from "../../lib/market-format";
import { captureWalletError } from "../../lib/monitoring";
import { TransactionState, TransactionStatus } from "../earn/TransactionStatus";
import { HealthFactorBadge } from "./HealthFactorBadge";
import { RiskIndicator } from "./RiskIndicator";

function toTransactionState(status: "idle" | "pending" | "success" | "error"): TransactionState {
  if (status === "pending") return "submitting";
  if (status === "error") return "failed";
  return status;
}

interface BorrowModalProps {
  asset: BorrowableAsset | null;
  snapshot: BorrowSnapshot;
  onClose: () => void;
}

export function BorrowModal({ asset, snapshot, onClose }: BorrowModalProps) {
  const open = Boolean(asset);

  return (
    <AnimatePresence>
      {open && asset && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <BorrowModalContent key={asset.symbol} asset={asset} snapshot={snapshot} onClose={onClose} />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface BorrowModalContentProps {
  asset: BorrowableAsset;
  snapshot: BorrowSnapshot;
  onClose: () => void;
}

function BorrowModalContent({ asset, snapshot, onClose }: BorrowModalContentProps) {
  const { address, walletId, network } = useStellar();
  const [amount, setAmount] = useState("");
  const mutation = useBorrowMutation();

  const parsedAmount = Number(amount);
  const isValidAmount = amount !== "" && parsedAmount > 0;
  const maxQuantity = Number(asset.maxBorrowable) / 10 ** asset.decimals;
  const exceedsMax = isValidAmount && parsedAmount > maxQuantity;
  const borrowPowerRemainingUsd = useMemo(() => computeBorrowPowerRemainingUsd(snapshot), [snapshot]);

  const projection = useMemo(() => {
    const amountUsd = isValidAmount ? parsedAmount * asset.priceUsd : 0;
    return projectBorrow(snapshot, amountUsd);
  }, [snapshot, isValidAmount, parsedAmount, asset.priceUsd]);

  const handleConfirm = async () => {
    if (!address) {
      toast.error("Connect your wallet first");
      return;
    }
    if (!isValidAmount || exceedsMax) return;

    const amountRaw = BigInt(Math.round(parsedAmount * 10 ** asset.decimals));
    try {
      await mutation.mutateAsync({ symbol: asset.symbol, amount: amountRaw, signer: address });
      toast.success("Borrow successful");
    } catch (error) {
      toast.error("Borrow failed");
      captureWalletError(error, { walletType: walletId, action: "borrow", network });
    }
  };

  const isSubmitting = mutation.isPending;

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Borrow ${asset.symbol}`}
      className="w-full max-w-md rounded-2xl border border-market-border bg-market-surface p-6"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.15 }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-market-surface-hover">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset.iconUrl} alt={`${asset.name} icon`} className="h-full w-full object-cover" />
          </div>
          <h2 className="text-lg font-medium text-market-text">Borrow {asset.symbol}</h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1.5 text-market-text-muted transition-colors hover:bg-market-surface-hover hover:text-market-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-market-text-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <dl className="mb-4 grid grid-cols-2 gap-y-2 text-sm">
        <dt className="text-market-text-muted">Borrowing Power Remaining</dt>
        <dd className="text-right tabular-nums text-market-text">
          {formatCompactUsdAmount(borrowPowerRemainingUsd)}
        </dd>
        <dt className="text-market-text-muted">Maximum Borrowable</dt>
        <dd className="text-right tabular-nums text-market-text">
          {formatTokenQuantity(asset.maxBorrowable, asset.decimals)} {asset.symbol}
        </dd>
      </dl>

      <div className="mb-2 flex items-center justify-between text-sm">
        <label htmlFor="borrow-modal-amount" className="text-market-text-secondary">
          Amount
        </label>
      </div>
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-market-border bg-market-surface-hover px-4 py-3">
        <input
          id="borrow-modal-amount"
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          disabled={isSubmitting}
          aria-label={`Amount of ${asset.symbol}`}
          className="w-full bg-transparent text-market-text outline-none placeholder:text-market-text-muted disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => setAmount(String(maxQuantity))}
          disabled={isSubmitting}
          className="shrink-0 rounded-md border border-market-border px-2 py-1 text-xs font-medium text-market-text-secondary transition-colors hover:text-market-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-market-text-secondary disabled:opacity-50"
        >
          MAX
        </button>
      </div>

      {exceedsMax && <p className="mb-4 text-xs text-market-text-secondary">Amount exceeds maximum borrowable.</p>}

      <dl className="mb-4 space-y-2 rounded-xl border border-market-border p-4 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-market-text-muted">Estimated Borrow APY</dt>
          <dd className="tabular-nums text-market-text">{formatPercent(asset.borrowApyBps)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-market-text-muted">Collateral Required</dt>
          <dd className="tabular-nums text-market-text">{formatCompactUsdAmount(projection.collateralRequiredUsd)}</dd>
        </div>
      </dl>

      <div className="mb-4 space-y-3 rounded-xl border border-market-border p-4 text-sm transition-colors duration-200">
        <div className="flex items-center justify-between">
          <dt className="text-market-text-muted">Health Factor Preview</dt>
          <HealthFactorBadge healthFactor={projection.healthFactor} size="sm" />
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-market-text-muted">Borrow Limit Preview</dt>
          <dd className="tabular-nums text-market-text">{formatPercent(projection.borrowLimitUsedBps)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-market-text-muted">Liquidation Risk</dt>
          <RiskIndicator tier={projection.tier} />
        </div>
      </div>

      {mutation.status !== "idle" && (
        <div className="mb-4">
          <TransactionStatus state={toTransactionState(mutation.status)} />
        </div>
      )}

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!isValidAmount || exceedsMax || isSubmitting}
        className="w-full rounded-xl bg-market-text py-3 font-medium text-market-surface transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-market-text-secondary disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? "Submitting..." : "Confirm Borrow"}
      </button>
    </motion.div>
  );
}
