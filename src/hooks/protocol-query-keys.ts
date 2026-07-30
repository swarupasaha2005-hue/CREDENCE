import { QueryClient } from "@tanstack/react-query";

/**
 * Canonical query keys for every piece of protocol data that can change as
 * a result of a Supply/Withdraw/Borrow/Repay/Liquidate mutation. Kept in one
 * place so every mutation invalidates the same, complete set.
 */
export const MARKETS_QUERY_KEY = ["markets"] as const;
export const SUPPLY_ASSETS_QUERY_KEY = ["supply-assets"] as const;
export const SUPPLY_POSITIONS_QUERY_KEY = ["supply-positions"] as const;
export const BORROW_POSITIONS_QUERY_KEY = ["borrow-positions"] as const;
export const BORROWABLE_ASSETS_QUERY_KEY = ["borrowable-assets"] as const;
export const BORROW_SNAPSHOT_QUERY_KEY = ["borrow-snapshot"] as const;
export const TRANSACTION_HISTORY_QUERY_KEY = ["transaction-history"] as const;

const PROTOCOL_QUERY_KEYS = [
  MARKETS_QUERY_KEY,
  SUPPLY_ASSETS_QUERY_KEY,
  SUPPLY_POSITIONS_QUERY_KEY,
  BORROW_POSITIONS_QUERY_KEY,
  BORROWABLE_ASSETS_QUERY_KEY,
  BORROW_SNAPSHOT_QUERY_KEY,
];

/**
 * Invalidates every protocol query that depends on on-chain state. Any
 * successful mutation (supply, withdraw, borrow, repay, liquidate) changes
 * pool liquidity/utilization and user positions, which every one of these
 * queries reads -- so a single mutation invalidates the full set rather than
 * only its own domain's keys.
 */
export function invalidateProtocolQueries(queryClient: QueryClient) {
  for (const queryKey of PROTOCOL_QUERY_KEYS) {
    queryClient.invalidateQueries({ queryKey });
  }
}
