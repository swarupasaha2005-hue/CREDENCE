"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BorrowService } from "../lib/services/borrow-service";

const BORROW_POSITIONS_QUERY_KEY = ["borrow-positions"] as const;
const BORROWABLE_ASSETS_QUERY_KEY = ["borrowable-assets"] as const;
const BORROW_SNAPSHOT_QUERY_KEY = ["borrow-snapshot"] as const;
const POLL_INTERVAL_MS = 30_000;

export function useBorrowPositions(user: string) {
  const query = useQuery({
    queryKey: [...BORROW_POSITIONS_QUERY_KEY, user],
    queryFn: () => BorrowService.getBorrowPositions(user),
    enabled: Boolean(user),
  });

  return {
    positions: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useBorrowableAssets(user: string) {
  const query = useQuery({
    queryKey: [...BORROWABLE_ASSETS_QUERY_KEY, user],
    queryFn: () => BorrowService.getBorrowableAssets(user),
    refetchInterval: POLL_INTERVAL_MS,
  });

  return {
    assets: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useBorrowSnapshot(user: string) {
  const query = useQuery({
    queryKey: [...BORROW_SNAPSHOT_QUERY_KEY, user],
    queryFn: () => BorrowService.getBorrowSnapshot(user),
    enabled: Boolean(user),
  });

  return {
    snapshot: query.data ?? { totalCollateralUsd: 0, totalDebtUsd: 0, maxLtvBps: 0, liquidationThresholdBps: 0 },
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

function invalidateBorrowQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: BORROW_POSITIONS_QUERY_KEY });
  queryClient.invalidateQueries({ queryKey: BORROWABLE_ASSETS_QUERY_KEY });
  queryClient.invalidateQueries({ queryKey: BORROW_SNAPSHOT_QUERY_KEY });
}

export function useBorrowMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ symbol, amount, signer }: { symbol: string; amount: bigint; signer: string }) =>
      BorrowService.borrow(symbol, amount, signer),
    onSuccess: () => invalidateBorrowQueries(queryClient),
  });
}

export function useRepayMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ symbol, amount, signer }: { symbol: string; amount: bigint; signer: string }) =>
      BorrowService.repay(symbol, amount, signer),
    onSuccess: () => invalidateBorrowQueries(queryClient),
  });
}
