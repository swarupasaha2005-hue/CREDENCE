"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useWallet } from "../context/WalletContext";
import { invalidateProtocolQueries } from "./protocol-query-keys";

/**
 * Centralized success handler for every protocol mutation (supply, withdraw,
 * borrow, repay, liquidate). Invalidates all protocol query keys and
 * refreshes wallet balances via WalletContext's existing refresh function --
 * never called on failure, since mutation `onSuccess` callbacks only fire
 * after a successful transaction.
 */
export function useProtocolMutationSuccess() {
  const queryClient = useQueryClient();
  const { refreshBalances } = useWallet();

  return () => {
    invalidateProtocolQueries(queryClient);
    void refreshBalances();
  };
}
