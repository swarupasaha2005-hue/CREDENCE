import {
  UserPosition,
  RiskParameters,
  PoolStats,
  MarketData
} from "../../interfaces/src";

const MOCK_MARKETS: MarketData[] = [
  {
    symbol: "XLM",
    name: "Stellar Lumens",
    assetAddress: "native",
    iconUrl: "/assets/tokens/xlm.svg",
    priceUsd: 0.112,
    decimals: 7,
    totalSupplied: 5_200_000n,
    totalBorrowed: 1_040_000n,
    availableLiquidity: 4_160_000n,
    supplyApyBps: 320,
    borrowApyBps: 610,
    utilizationBps: 2000,
    collateralEnabled: true,
    ltvBps: 7000,
    liquidationThresholdBps: 7500,
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    assetAddress: "USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
    iconUrl: "/assets/tokens/usdc.svg",
    priceUsd: 1.0,
    decimals: 6,
    totalSupplied: 3_800_000n,
    totalBorrowed: 2_850_000n,
    availableLiquidity: 950_000n,
    supplyApyBps: 480,
    borrowApyBps: 890,
    utilizationBps: 7500,
    collateralEnabled: true,
    ltvBps: 8500,
    liquidationThresholdBps: 9000,
  },
  {
    symbol: "AQUA",
    name: "Aquarius",
    assetAddress: "AQUA:GBNZILSTVQZ4R7IKQDGHYGY2QXL5QOFJYQMXPKWRRM5PAV7Y4M67AQUA",
    iconUrl: "/assets/tokens/aqua.svg",
    priceUsd: 0.0043,
    decimals: 7,
    totalSupplied: 890_000n,
    totalBorrowed: 120_000n,
    availableLiquidity: 770_000n,
    supplyApyBps: 150,
    borrowApyBps: 420,
    utilizationBps: 1350,
    collateralEnabled: false,
    ltvBps: 0,
    liquidationThresholdBps: 0,
  },
];

/**
 * High-level SDK for interacting with the Credence Protocol.
 * Abstracts Soroban XDR formatting and contract calls for the frontend.
 */
export class CredenceProtocol {
  private network: string;
  private registry: Record<string, string>;

  constructor(network: string, registry: Record<string, string>) {
    this.network = network;
    this.registry = registry;
  }

  // Configuration

  public async getRiskParameters(): Promise<RiskParameters> {
    // Mock binding call to ConfigurationContract
    return {
      base_rate: 200, // 2%
      optimal_utilization: 8000, // 80%
      slope_1: 400, // 4%
      slope_2: 7500, // 75%
      reserve_factor: 1000, // 10%
      liquidation_threshold: 8000, // 80%
      liquidation_bonus: 10500, // 105% (5% bonus)
    };
  }

  // Lending Pool Operations

  public async depositCollateral(asset: string, amount: bigint, signer: string): Promise<string> {
    const poolAddress = this.registry["lending_pool"];
    if (!poolAddress) throw new Error("Lending pool not found in registry");

    console.log(`Depositing ${amount.toString()} of ${asset} to pool ${poolAddress} by ${signer}`);
    // Here we would invoke the generated Soroban TS bindings:
    // const tx = await lendingPoolClient.deposit({ asset, amount, caller: signer });
    // return tx.hash;

    return "mock_tx_hash_deposit";
  }

  public async borrow(asset: string, amount: bigint, signer: string): Promise<string> {
    const poolAddress = this.registry["lending_pool"];
    console.log(`Borrowing ${amount.toString()} of ${asset} from pool ${poolAddress} by ${signer}`);
    // await lendingPoolClient.borrow({ asset, amount, caller: signer });
    return "mock_tx_hash_borrow";
  }

  public async repay(asset: string, amount: bigint, signer: string): Promise<string> {
    const poolAddress = this.registry["lending_pool"];
    console.log(`Repaying ${amount.toString()} of ${asset} to pool ${poolAddress} by ${signer}`);
    // await lendingPoolClient.repay({ asset, amount, caller: signer });
    return "mock_tx_hash_repay";
  }

  public async withdrawCollateral(asset: string, amount: bigint, signer: string): Promise<string> {
    const poolAddress = this.registry["lending_pool"];
    console.log(`Withdrawing ${amount.toString()} of ${asset} from pool ${poolAddress} by ${signer}`);
    // await lendingPoolClient.withdraw({ asset, amount, caller: signer });
    return "mock_tx_hash_withdraw";
  }

  // Liquidation

  public async liquidate(
    borrower: string, 
    debtAsset: string, 
    collatAsset: string, 
    debtToCover: bigint, 
    liquidator: string
  ): Promise<string> {
    const liqAddress = this.registry["liquidation_engine"];
    if (!liqAddress) throw new Error("Liquidation engine not found in registry");

    console.log(`Liquidating ${borrower} covering ${debtToCover.toString()} of ${debtAsset}`);
    // await liquidationEngineClient.liquidate({ ... });
    return "mock_tx_hash_liquidate";
  }

  // Data Queries

  public async getUserPosition(user: string, asset: string): Promise<UserPosition> {
    // return await lendingPoolClient.get_user_position_view({ user, asset });
    return {
      collateral_amount: 1000n,
      scaled_debt: 500n,
      last_interaction: Date.now()
    };
  }

  public async getPoolStats(asset: string): Promise<PoolStats> {
    // return await lendingPoolClient.get_pool_stats({ asset });
    return {
      total_liquidity: 100000n,
      total_borrowed: 20000n,
      borrow_index: 1000000000000000000n // WAD
    };
  }

  // Markets

  public async getMarkets(): Promise<MarketData[]> {
    // Would aggregate: oracleClient.get_price(), lendingPoolClient.get_pool_stats(),
    // configurationClient.get_risk_parameters() per registered reserve.
    return MOCK_MARKETS;
  }

  public async getMarket(symbol: string): Promise<MarketData | null> {
    const market = MOCK_MARKETS.find(
      (m) => m.symbol.toLowerCase() === symbol.toLowerCase()
    );
    return market ?? null;
  }
}
