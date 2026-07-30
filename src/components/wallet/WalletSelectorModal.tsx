"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Wallet, X } from "lucide-react";
import { useWallet } from "../../context/WalletContext";

interface WalletSelectorModalProps {
  open: boolean;
  onClose: () => void;
}

export function WalletSelectorModal({ open, onClose }: WalletSelectorModalProps) {
  const { availableWallets, selectWallet, connecting } = useWallet();

  const handleSelect = async (id: Parameters<typeof selectWallet>[0]) => {
    await selectWallet(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Choose wallet"
            className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0A0A0A] p-6"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-medium text-white">Choose Wallet</h2>
              <button
                onClick={onClose}
                aria-label="Close"
                className="rounded-lg p-1.5 text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              {availableWallets.map((wallet) => (
                <button
                  key={wallet.id}
                  type="button"
                  onClick={() => handleSelect(wallet.id)}
                  disabled={connecting}
                  className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-left transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#E88DAF]/15 text-[#E88DAF]">
                    <Wallet className="h-4 w-4" />
                  </span>
                  <span className="flex-1">
                    <span className="block text-sm font-medium text-white">{wallet.name}</span>
                  </span>
                  {connecting && (
                    <span className="text-xs text-white/40">Connecting…</span>
                  )}
                </button>
              ))}
            </div>

            <p className="mt-5 text-center text-xs text-white/40">
              Stellar Testnet only. Make sure your wallet is set to Testnet before connecting.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
