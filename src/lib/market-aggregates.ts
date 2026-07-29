import { MarketData } from "../../packages/interfaces/src";
import { formatTokenAmount } from "./market-format";

export interface MarketAggregates {
  count: number;
  totalValueLockedUsd: number;
  totalBorrowedUsd: number;
  availableLiquidityUsd: number;
  avgSupplyApyBps: number;
  avgBorrowApyBps: number;
}

export function computeMarketAggregates(markets: MarketData[]): MarketAggregates {
  if (markets.length === 0) {
    return {
      count: 0,
      totalValueLockedUsd: 0,
      totalBorrowedUsd: 0,
      availableLiquidityUsd: 0,
      avgSupplyApyBps: 0,
      avgBorrowApyBps: 0,
    };
  }

  const totals = markets.reduce(
    (acc, market) => {
      acc.tvl += formatTokenAmount(market.totalSupplied, market.decimals) * market.priceUsd;
      acc.borrowed += formatTokenAmount(market.totalBorrowed, market.decimals) * market.priceUsd;
      acc.liquidity += formatTokenAmount(market.availableLiquidity, market.decimals) * market.priceUsd;
      acc.supplyApyBps += market.supplyApyBps;
      acc.borrowApyBps += market.borrowApyBps;
      return acc;
    },
    { tvl: 0, borrowed: 0, liquidity: 0, supplyApyBps: 0, borrowApyBps: 0 }
  );

  return {
    count: markets.length,
    totalValueLockedUsd: totals.tvl,
    totalBorrowedUsd: totals.borrowed,
    availableLiquidityUsd: totals.liquidity,
    avgSupplyApyBps: totals.supplyApyBps / markets.length,
    avgBorrowApyBps: totals.borrowApyBps / markets.length,
  };
}
