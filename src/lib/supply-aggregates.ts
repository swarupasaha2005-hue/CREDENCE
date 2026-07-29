import { SupplyPosition } from "../../packages/interfaces/src";
import { formatTokenAmount } from "./market-format";

export interface SupplyAggregates {
  totalSuppliedUsd: number;
  estimatedAnnualYieldUsd: number;
  activePositionCount: number;
}

export function computeSupplyAggregates(positions: SupplyPosition[]): SupplyAggregates {
  const totals = positions.reduce(
    (acc, position) => {
      const valueUsd = formatTokenAmount(position.suppliedAmount, position.decimals) * position.priceUsd;
      acc.suppliedUsd += valueUsd;
      acc.annualYieldUsd += (valueUsd * position.supplyApyBps) / 10_000;
      return acc;
    },
    { suppliedUsd: 0, annualYieldUsd: 0 }
  );

  return {
    totalSuppliedUsd: totals.suppliedUsd,
    estimatedAnnualYieldUsd: totals.annualYieldUsd,
    activePositionCount: positions.length,
  };
}
