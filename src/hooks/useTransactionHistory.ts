"use client";

import { useQuery } from "@tanstack/react-query";
import { TRANSACTION_HISTORY_QUERY_KEY } from "./protocol-query-keys";
import { ProtocolEvent } from "../lib/services/event-service";

/**
 * Reads the live event feed populated by EventService (see event-service.ts). There is no
 * fetcher here -- this cache entry is written directly via `queryClient.setQueryData` as real
 * Supply/Withdraw/Borrow/Repay/Liquidation events arrive, so `queryFn` never runs.
 */
export function useTransactionHistory() {
  const query = useQuery<ProtocolEvent[]>({
    queryKey: TRANSACTION_HISTORY_QUERY_KEY,
    queryFn: () => [],
    initialData: [],
    staleTime: Infinity,
  });

  return {
    events: query.data ?? [],
  };
}
