"use client";

import { useQuery } from "@tanstack/react-query";
import { MarketService } from "../lib/services/market-service";

const MARKETS_QUERY_KEY = ["markets"] as const;
const POLL_INTERVAL_MS = 30_000;

export function useMarkets() {
  const query = useQuery({
    queryKey: MARKETS_QUERY_KEY,
    queryFn: () => MarketService.getMarkets(),
    refetchInterval: POLL_INTERVAL_MS,
  });

  return {
    markets: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    isFetching: query.isFetching,
    refetch: query.refetch,
    dataUpdatedAt: query.dataUpdatedAt,
  };
}

export function useMarket(symbol: string) {
  const query = useQuery({
    queryKey: [...MARKETS_QUERY_KEY, symbol],
    queryFn: () => MarketService.getMarket(symbol),
    enabled: Boolean(symbol),
  });

  return {
    market: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
