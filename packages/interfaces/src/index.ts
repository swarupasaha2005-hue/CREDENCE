export interface AssetPrice {
  asset: string;
  price: bigint;
  decimals: number;
}

export interface RiskParameters {
  base_rate: number;
  optimal_utilization: number;
  slope_1: number;
  slope_2: number;
  reserve_factor: number;
  liquidation_threshold: number;
  liquidation_bonus: number;
}

export interface UserPosition {
  collateral_amount: bigint;
  scaled_debt: bigint;
  last_interaction: number;
}

export interface HealthFactorResult {
  isHealthy: boolean;
  healthFactorBps: bigint; // BPS format
}

export interface PoolStats {
  total_liquidity: bigint;
  total_borrowed: bigint;
  borrow_index: bigint;
}

export interface ProtocolErrors {
  InsufficientCollateral: string;
  HealthFactorViolation: string;
  OracleUnavailable: string;
  Unauthorized: string;
}

export interface MarketData {
  symbol: string;
  name: string;
  assetAddress: string;
  iconUrl: string;
  priceUsd: number;
  decimals: number;
  totalSupplied: bigint;
  totalBorrowed: bigint;
  availableLiquidity: bigint;
  supplyApyBps: number;
  borrowApyBps: number;
  utilizationBps: number;
  collateralEnabled: boolean;
  ltvBps: number;
  liquidationThresholdBps: number;
}

export interface SupplyAsset extends MarketData {
  walletBalance: bigint;
}

export interface SupplyPosition {
  symbol: string;
  name: string;
  iconUrl: string;
  decimals: number;
  priceUsd: number;
  suppliedAmount: bigint;
  supplyApyBps: number;
  interestEarned: bigint;
}

export interface BorrowPosition {
  symbol: string;
  name: string;
  iconUrl: string;
  decimals: number;
  priceUsd: number;
  borrowedAmount: bigint;
  borrowApyBps: number;
  accruedInterest: bigint;
}

export interface BorrowableAsset extends MarketData {
  maxBorrowable: bigint;
}

export interface BorrowSnapshot {
  totalCollateralUsd: number;
  totalDebtUsd: number;
  maxLtvBps: number;
  liquidationThresholdBps: number;
}
