"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { SupplyService } from "../lib/services/supply-service";
import { SUPPLY_ASSETS_QUERY_KEY, SUPPLY_POSITIONS_QUERY_KEY } from "./protocol-query-keys";
import { useProtocolMutationSuccess } from "./useProtocolMutationSuccess";

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
  const onProtocolMutationSuccess = useProtocolMutationSuccess();

  return useMutation({
    mutationFn: ({ symbol, amount, signer }: { symbol: string; amount: bigint; signer: string }) =>
      SupplyService.supply(symbol, amount, signer),
    onSuccess: onProtocolMutationSuccess,
  });
}

export function useWithdrawMutation() {
  const onProtocolMutationSuccess = useProtocolMutationSuccess();

  return useMutation({
    mutationFn: ({ symbol, amount, signer }: { symbol: string; amount: bigint; signer: string }) =>
      SupplyService.withdraw(symbol, amount, signer),
    onSuccess: onProtocolMutationSuccess,
  });
}
