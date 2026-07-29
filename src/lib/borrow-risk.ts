import { BorrowSnapshot } from "../../packages/interfaces/src";

export type RiskTier = "safe" | "warning" | "danger";

const HEALTH_FACTOR_SAFE_THRESHOLD = 1.5;
const HEALTH_FACTOR_WARNING_THRESHOLD = 1.1;

export function computeHealthFactor(collateralUsd: number, debtUsd: number, liquidationThresholdBps: number): number {
  if (debtUsd <= 0) return Infinity;
  return (collateralUsd * (liquidationThresholdBps / 10_000)) / debtUsd;
}

export function healthFactorTier(healthFactor: number): RiskTier {
  if (healthFactor >= HEALTH_FACTOR_SAFE_THRESHOLD) return "safe";
  if (healthFactor >= HEALTH_FACTOR_WARNING_THRESHOLD) return "warning";
  return "danger";
}

export function computeBorrowLimitUsedBps(snapshot: BorrowSnapshot): number {
  const borrowLimitUsd = (snapshot.totalCollateralUsd * snapshot.maxLtvBps) / 10_000;
  if (borrowLimitUsd <= 0) return 0;
  return Math.min(10_000, Math.round((snapshot.totalDebtUsd / borrowLimitUsd) * 10_000));
}

export function computeBorrowPowerRemainingUsd(snapshot: BorrowSnapshot): number {
  const borrowLimitUsd = (snapshot.totalCollateralUsd * snapshot.maxLtvBps) / 10_000;
  return Math.max(0, borrowLimitUsd - snapshot.totalDebtUsd);
}

export function computeCurrentLtvBps(snapshot: BorrowSnapshot): number {
  if (snapshot.totalCollateralUsd <= 0) return 0;
  return Math.round((snapshot.totalDebtUsd / snapshot.totalCollateralUsd) * 10_000);
}

export interface RiskProjection {
  newDebtUsd: number;
  healthFactor: number;
  tier: RiskTier;
  borrowLimitUsedBps: number;
  collateralRequiredUsd: number;
}

export function projectBorrow(snapshot: BorrowSnapshot, additionalBorrowUsd: number): RiskProjection {
  const newDebtUsd = snapshot.totalDebtUsd + Math.max(0, additionalBorrowUsd);
  const healthFactor = computeHealthFactor(snapshot.totalCollateralUsd, newDebtUsd, snapshot.liquidationThresholdBps);
  const borrowLimitUsd = (snapshot.totalCollateralUsd * snapshot.maxLtvBps) / 10_000;
  const borrowLimitUsedBps = borrowLimitUsd > 0 ? Math.min(10_000, Math.round((newDebtUsd / borrowLimitUsd) * 10_000)) : 0;
  const collateralRequiredUsd = snapshot.maxLtvBps > 0 ? newDebtUsd / (snapshot.maxLtvBps / 10_000) : 0;

  return {
    newDebtUsd,
    healthFactor,
    tier: healthFactorTier(healthFactor),
    borrowLimitUsedBps,
    collateralRequiredUsd,
  };
}

export function projectRepay(snapshot: BorrowSnapshot, repayUsd: number): RiskProjection {
  const newDebtUsd = Math.max(0, snapshot.totalDebtUsd - Math.max(0, repayUsd));
  const healthFactor = computeHealthFactor(snapshot.totalCollateralUsd, newDebtUsd, snapshot.liquidationThresholdBps);
  const borrowLimitUsd = (snapshot.totalCollateralUsd * snapshot.maxLtvBps) / 10_000;
  const borrowLimitUsedBps = borrowLimitUsd > 0 ? Math.min(10_000, Math.round((newDebtUsd / borrowLimitUsd) * 10_000)) : 0;

  return {
    newDebtUsd,
    healthFactor,
    tier: healthFactorTier(healthFactor),
    borrowLimitUsedBps,
    collateralRequiredUsd: 0,
  };
}
