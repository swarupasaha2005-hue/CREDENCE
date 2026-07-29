"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useState } from "react";
import { MarketData } from "../../../packages/interfaces/src";

export type MarketAction = "supply" | "borrow";

interface SupplyBorrowModalProps {
  market: MarketData | null;
  action: MarketAction | null;
  onClose: () => void;
}

/**
 * Placeholder modal wired to the SDK-backed action flow.
 * Replace the submit handler with real signer + MarketService calls once
 * a dedicated transaction-review modal exists.
 */
export function SupplyBorrowModal({ market, action, onClose }: SupplyBorrowModalProps) {
  const [amount, setAmount] = useState("");
  const open = Boolean(market && action);

  return (
    <AnimatePresence>
      {open && market && action && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${action === "supply" ? "Supply" : "Borrow"} ${market.symbol}`}
            className="w-full max-w-md rounded-2xl border border-market-border bg-market-surface p-6"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-medium capitalize text-market-text">
                {action} {market.symbol}
              </h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-1.5 text-market-text-muted transition-colors hover:bg-market-surface-hover hover:text-market-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mb-2 block text-sm text-market-text-secondary" htmlFor="amount">
              Amount
            </label>
            <input
              id="amount"
              type="number"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="mb-6 w-full rounded-xl border border-market-border bg-market-surface-hover px-4 py-3 text-market-text outline-none focus:border-market-text-secondary"
            />

            <button
              type="button"
              disabled={!amount || Number(amount) <= 0}
              className="w-full rounded-xl bg-market-text py-3 font-medium text-market-surface transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              Confirm {action}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
