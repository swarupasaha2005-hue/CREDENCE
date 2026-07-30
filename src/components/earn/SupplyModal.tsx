"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useStellar } from "../../context/StellarContext";
import { useSupplyMutation, useWithdrawMutation } from "../../hooks/useSupply";
import { formatCompactUsdAmount, formatPercent } from "../../lib/market-format";
import { captureWalletError } from "../../lib/monitoring";
import { trackProtocolAction } from "../../lib/analytics";
import { TransactionState, TransactionStatus } from "./TransactionStatus";

function toTransactionState(status: "idle" | "pending" | "success" | "error"): TransactionState {
  if (status === "pending") return "submitting";
  if (status === "error") return "failed";
  return status;
}

export type SupplyModalMode = "supply" | "withdraw";

export interface SupplyModalTarget {
  symbol: string;
  name: string;
  iconUrl: string;
  decimals: number;
  priceUsd: number;
  supplyApyBps: number;
  /** Wallet balance when supplying, supplied amount when withdrawing. */
  maxRaw: bigint;
}

interface SupplyModalProps {
  target: SupplyModalTarget | null;
  mode: SupplyModalMode | null;
  onClose: () => void;
}

export function SupplyModal({ target, mode, onClose }: SupplyModalProps) {
  const open = Boolean(target && mode);

  return (
    <AnimatePresence>
      {open && target && mode && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <SupplyModalContent
            key={`${mode}-${target.symbol}`}
            target={target}
            mode={mode}
            onClose={onClose}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface SupplyModalContentProps {
  target: SupplyModalTarget;
  mode: SupplyModalMode;
  onClose: () => void;
}

function SupplyModalContent({ target, mode, onClose }: SupplyModalContentProps) {
  const { address, walletId, network } = useStellar();
  const [amount, setAmount] = useState("");
  const supplyMutation = useSupplyMutation();
  const withdrawMutation = useWithdrawMutation();
  const mutation = mode === "withdraw" ? withdrawMutation : supplyMutation;

  const parsedAmount = Number(amount);
  const isValidAmount = amount !== "" && parsedAmount > 0;
  const maxQuantity = Number(target.maxRaw) / 10 ** target.decimals;
  const exceedsMax = isValidAmount && parsedAmount > maxQuantity;
  const estimatedAnnualEarnings = isValidAmount
    ? (parsedAmount * target.priceUsd * target.supplyApyBps) / 10_000
    : 0;

  const handleConfirm = async () => {
    if (!address) {
      toast.error("Connect your wallet first");
      return;
    }
    if (!isValidAmount || exceedsMax) return;

    const amountRaw = BigInt(Math.round(parsedAmount * 10 ** target.decimals));
    try {
      await mutation.mutateAsync({ symbol: target.symbol, amount: amountRaw, signer: address });
      toast.success(mode === "withdraw" ? "Withdrawal successful" : "Supply successful");
      trackProtocolAction(mode, { symbol: target.symbol, walletType: walletId });
    } catch (error) {
      toast.error(mode === "withdraw" ? "Withdrawal failed" : "Supply failed");
      captureWalletError(error, { walletType: walletId, action: mode, network });
    }
  };

  const isSubmitting = mutation.isPending;
  const label = mode === "withdraw" ? "Withdraw" : "Supply";

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`${label} ${target.symbol}`}
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
            <img src={target.iconUrl} alt={`${target.name} icon`} className="h-full w-full object-cover" />
          </div>
          <h2 className="text-lg font-medium text-market-text">
            {label} {target.symbol}
          </h2>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="rounded-lg p-1.5 text-market-text-muted transition-colors hover:bg-market-surface-hover hover:text-market-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-market-text-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-2 flex items-center justify-between text-sm">
        <label htmlFor="supply-modal-amount" className="text-market-text-secondary">
          Amount
        </label>
        <span className="text-market-text-muted">
          {mode === "withdraw" ? "Supplied" : "Balance"}: {maxQuantity.toLocaleString()} {target.symbol}
        </span>
      </div>
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-market-border bg-market-surface-hover px-4 py-3">
        <input
          id="supply-modal-amount"
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          disabled={isSubmitting}
          aria-label={`Amount of ${target.symbol}`}
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

      {exceedsMax && <p className="mb-4 text-xs text-market-text-secondary">Amount exceeds available balance.</p>}

      <dl className="mb-6 space-y-2 rounded-xl border border-market-border p-4 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-market-text-muted">Estimated APY</dt>
          <dd className="tabular-nums text-market-text">{formatPercent(target.supplyApyBps)}</dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-market-text-muted">Estimated Annual Earnings</dt>
          <dd className="tabular-nums text-market-text">{formatCompactUsdAmount(estimatedAnnualEarnings)}</dd>
        </div>
      </dl>

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
        {isSubmitting ? "Submitting..." : `Confirm ${label}`}
      </button>
    </motion.div>
  );
}
