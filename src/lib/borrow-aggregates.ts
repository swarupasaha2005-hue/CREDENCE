import { BorrowPosition } from "../../packages/interfaces/src";
import { formatTokenAmount } from "./market-format";

export interface BorrowPositionsAggregate {
  totalBorrowedUsd: number;
  totalAccruedInterestUsd: number;
}

export function computeBorrowPositionsAggregate(positions: BorrowPosition[]): BorrowPositionsAggregate {
  return positions.reduce(
    (acc, position) => {
      acc.totalBorrowedUsd += formatTokenAmount(position.borrowedAmount, position.decimals) * position.priceUsd;
      acc.totalAccruedInterestUsd +=
        formatTokenAmount(position.accruedInterest, position.decimals) * position.priceUsd;
      return acc;
    },
    { totalBorrowedUsd: 0, totalAccruedInterestUsd: 0 }
  );
}

export function positionValueUsd(position: BorrowPosition): number {
  return formatTokenAmount(position.borrowedAmount, position.decimals) * position.priceUsd;
}

export function healthContributionBps(position: BorrowPosition, totalBorrowedUsd: number): number {
  if (totalBorrowedUsd <= 0) return 0;
  return Math.round((positionValueUsd(position) / totalBorrowedUsd) * 10_000);
}
