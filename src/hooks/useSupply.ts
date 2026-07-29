"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SupplyService } from "../lib/services/supply-service";

const SUPPLY_ASSETS_QUERY_KEY = ["supply-assets"] as const;
const SUPPLY_POSITIONS_QUERY_KEY = ["supply-positions"] as const;
const POLL_INTERVAL_MS = 30_000;

export function useSupplyAssets(user: string) {
  const query = useQuery({
    queryKey: [...SUPPLY_ASSETS_QUERY_KEY, user],
    queryFn: () => SupplyService.getSupplyAssets(user),
    refetchInterval: POLL_INTERVAL_MS,
  });

  return {
    assets: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useSupplyPositions(user: string) {
  const query = useQuery({
    queryKey: [...SUPPLY_POSITIONS_QUERY_KEY, user],
    queryFn: () => SupplyService.getSupplyPositions(user),
    enabled: Boolean(user),
  });

  return {
    positions: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useSupplyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ symbol, amount, signer }: { symbol: string; amount: bigint; signer: string }) =>
      SupplyService.supply(symbol, amount, signer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLY_POSITIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SUPPLY_ASSETS_QUERY_KEY });
    },
  });
}

export function useWithdrawMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ symbol, amount, signer }: { symbol: string; amount: bigint; signer: string }) =>
      SupplyService.withdraw(symbol, amount, signer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUPPLY_POSITIONS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: SUPPLY_ASSETS_QUERY_KEY });
    },
  });
}
