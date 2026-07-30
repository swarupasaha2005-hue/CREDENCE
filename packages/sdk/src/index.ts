import { Client as ContractClient } from "@stellar/stellar-sdk/contract";
import { signTransaction as freighterSignTransaction } from "@stellar/freighter-api";
import {
  UserPosition,
  RiskParameters,
  PoolStats,
  MarketData,
  SupplyPosition,
  BorrowPosition,
  BorrowSnapshot,
} from "../../interfaces/src";

// WAD fixed-point precision used throughout the Rust contracts (1e18).
const WAD = 1_000_000_000_000_000_000n;

const NETWORK_CONFIG: Record<string, { rpcUrl: string; networkPassphrase: string }> = {
  testnet: {
    rpcUrl: "https://soroban-testnet.stellar.org",
    networkPassphrase: "Test SDF Network ; September 2015",
  },
  futurenet: {
    rpcUrl: "https://rpc-futurenet.stellar.org",
    networkPassphrase: "Test SDF Future Network ; October 2022",
  },
};

/** Static display metadata that has no on-chain representation. */
const ASSET_METADATA: Record<string, { name: string; iconUrl: string; collateralEnabled: boolean }> = {
  XLM: { name: "Stellar Lumens", iconUrl: "/assets/tokens/xlm.svg", collateralEnabled: true },
  USDC: { name: "USD Coin", iconUrl: "/assets/tokens/usdc.svg", collateralEnabled: true },
  AQUA: { name: "Aquarius", iconUrl: "/assets/tokens/aqua.svg", collateralEnabled: false },
};

interface AssetEntry {
  symbol: string;
  assetAddress: string;
  decimals: number;
}

type Registry = Record<string, string> & {
  assets?: Record<string, { symbol: string; assetAddress: string; decimals: number }>;
};

function toNumber(scaled: bigint, decimals: number): number {
  return Number(scaled) / 10 ** decimals;
}

/**
 * High-level SDK for interacting with the Credence Protocol.
 * Wraps the real Soroban contracts deployed on the configured network via
 * the generic `@stellar/stellar-sdk/contract` Client (the same mechanism
 * used by `stellar contract bindings typescript`), so every call below is a
 * genuine RPC simulation / invocation against the live contracts recorded
 * in `registry/deployments.json`.
 */
export class CredenceProtocol {
  private registry: Registry;
  private rpcUrl: string;
  private networkPassphrase: string;
  private assets: AssetEntry[];
  private clientCache: Map<string, Promise<ContractClient>> = new Map();

  constructor(network: string, registry: Record<string, string>) {
    this.registry = registry as Registry;

    const cfg = NETWORK_CONFIG[network] ?? NETWORK_CONFIG.testnet;
    this.rpcUrl = cfg.rpcUrl;
    this.networkPassphrase = cfg.networkPassphrase;

    const assetsMap = this.registry.assets ?? {};
    this.assets = Object.values(assetsMap).map((a) => ({
      symbol: a.symbol,
      assetAddress: a.assetAddress,
      decimals: a.decimals,
    }));
  }

  // --- Internal helpers ---------------------------------------------------

  private async client(contractId: string, publicKey?: string): Promise<ContractClient> {
    const cacheKey = `${contractId}:${publicKey ?? ""}`;
    let pending = this.clientCache.get(cacheKey);
    if (!pending) {
      pending = ContractClient.from({
        contractId,
        rpcUrl: this.rpcUrl,
        networkPassphrase: this.networkPassphrase,
        publicKey,
        allowHttp: this.rpcUrl.startsWith("http://"),
      });
      this.clientCache.set(cacheKey, pending);
    }
    return pending;
  }

  private async configClient(publicKey?: string) {
    const addr = this.registry["configuration"];
    if (!addr) throw new Error("Configuration contract not found in registry");
    return this.client(addr, publicKey);
  }

  private async oracleClient(publicKey?: string) {
    const addr = this.registry["oracle"];
    if (!addr) throw new Error("Oracle contract not found in registry");
    return this.client(addr, publicKey);
  }

  private async poolClient(publicKey?: string) {
    const addr = this.registry["lending_pool"];
    if (!addr) throw new Error("Lending pool not found in registry");
    return this.client(addr, publicKey);
  }

  private async interestClient(publicKey?: string) {
    const addr = this.registry["interest_rate_model"];
    if (!addr) throw new Error("Interest rate model not found in registry");
    return this.client(addr, publicKey);
  }

  private async liquidationClient(publicKey?: string) {
    const addr = this.registry["liquidation_engine"];
    if (!addr) throw new Error("Liquidation engine not found in registry");
    return this.client(addr, publicKey);
  }

  private resolveAsset(symbolOrAddress: string): AssetEntry {
    const bySymbol = this.assets.find(
      (a) => a.symbol.toLowerCase() === symbolOrAddress.toLowerCase()
    );
    if (bySymbol) return bySymbol;

    const byAddress = this.assets.find((a) => a.assetAddress === symbolOrAddress);
    if (byAddress) return byAddress;

    throw new Error(`Unknown asset: ${symbolOrAddress}`);
  }

  /** Simulates a read-only contract call and returns its typed result. */
  private async readCall<T>(client: ContractClient, method: string, args?: Record<string, unknown>): Promise<T> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = (client as any)[method];
    if (typeof fn !== "function") throw new Error(`Method ${method} not found on contract client`);
    const tx = args !== undefined ? await fn(args) : await fn();
    return tx.result as T;
  }

  /** Signs (via Freighter) and submits a write transaction, returning the tx hash. */
  private async writeCall(
    client: ContractClient,
    method: string,
    args: Record<string, unknown>,
    signer: string
  ): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fn = (client as any)[method];
    if (typeof fn !== "function") throw new Error(`Method ${method} not found on contract client`);

    const assembled = await fn(args, { simulate: true });
    const sent = await assembled.signAndSend({
      signTransaction: async (xdr: string, opts?: { networkPassphrase?: string }) => {
        const { signedTxXdr, error } = await freighterSignTransaction(xdr, {
          networkPassphrase: opts?.networkPassphrase ?? this.networkPassphrase,
          address: signer,
        });
        if (error) throw new Error("Transaction signing was rejected");
        return { signedTxXdr, signerAddress: signer };
      },
    });

    return sent.sendTransactionResponse?.hash ?? sent.getTransactionResponse?.txHash ?? "";
  }

  private async getAssetPriceUsd(assetAddress: string): Promise<number> {
    try {
      const oracle = await this.oracleClient();
      const price: bigint = await this.readCall(oracle, "get_price", { asset: assetAddress });
      // Oracle price is WAD-scaled USD price (1e18 = $1.00).
      return Number(price) / 1e18;
    } catch {
      return 0;
    }
  }

  // --- Configuration -------------------------------------------------------

  public async getRiskParameters(): Promise<RiskParameters> {
    const config = await this.configClient();
    const [
      base_rate,
      optimal_utilization,
      slope_1,
      slope_2,
      reserve_factor,
      liquidation_threshold,
      liquidation_bonus,
    ] = await Promise.all([
      this.readCall<number>(config, "get_base_borrow_rate"),
      this.readCall<number>(config, "get_optimal_utilization"),
      this.readCall<number>(config, "get_slope1"),
      this.readCall<number>(config, "get_slope2"),
      this.readCall<number>(config, "get_reserve_factor"),
      this.readCall<number>(config, "get_liquidation_threshold"),
      this.readCall<number>(config, "get_liquidation_bonus"),
    ]);

    return {
      base_rate,
      optimal_utilization,
      slope_1,
      slope_2,
      reserve_factor,
      liquidation_threshold,
      liquidation_bonus,
    };
  }

  // --- Lending Pool Operations (write) -------------------------------------

  public async depositCollateral(asset: string, amount: bigint, signer: string): Promise<string> {
    const { assetAddress } = this.resolveAsset(asset);
    const pool = await this.poolClient(signer);
    return this.writeCall(pool, "deposit_collateral", { user: signer, asset: assetAddress, amount }, signer);
  }

  /**
   * Borrows `amount` of `borrowAsset` against previously deposited collateral.
   * Accepts either the 3-arg legacy shape (asset, amount, signer) used by the
   * existing services -- collateral defaults to XLM in that case -- or the
   * fuller 4-arg shape (collateralAsset, borrowAsset, amount, signer).
   */
  public async borrow(asset: string, amount: bigint, signer: string): Promise<string>;
  public async borrow(collateralAsset: string, borrowAsset: string, amount: bigint, signer: string): Promise<string>;
  public async borrow(a: string, b: string | bigint, c: bigint | string, d?: string): Promise<string> {
    let collateralAsset: string;
    let borrowAsset: string;
    let amount: bigint;
    let signer: string;

    if (typeof b === "bigint") {
      borrowAsset = a;
      amount = b;
      signer = c as string;
      collateralAsset = "XLM";
    } else {
      collateralAsset = a;
      borrowAsset = b;
      amount = c as bigint;
      signer = d as string;
    }

    const { assetAddress: collatAddr } = this.resolveAsset(collateralAsset);
    const { assetAddress: borrowAddr } = this.resolveAsset(borrowAsset);
    const pool = await this.poolClient(signer);
    return this.writeCall(
      pool,
      "borrow",
      { user: signer, collateral_asset: collatAddr, borrow_asset: borrowAddr, amount },
      signer
    );
  }

  public async repay(asset: string, amount: bigint, signer: string): Promise<string> {
    const { assetAddress } = this.resolveAsset(asset);
    const pool = await this.poolClient(signer);
    return this.writeCall(pool, "repay", { user: signer, asset: assetAddress, amount }, signer);
  }

  /** Same dual-shape story as `borrow`: (asset, amount, signer) defaults the debt asset to USDC. */
  public async withdrawCollateral(asset: string, amount: bigint, signer: string): Promise<string>;
  public async withdrawCollateral(
    collateralAsset: string,
    borrowAsset: string,
    amount: bigint,
    signer: string
  ): Promise<string>;
  public async withdrawCollateral(a: string, b: string | bigint, c: bigint | string, d?: string): Promise<string> {
    let collateralAsset: string;
    let borrowAsset: string;
    let amount: bigint;
    let signer: string;

    if (typeof b === "bigint") {
      collateralAsset = a;
      amount = b;
      signer = c as string;
      borrowAsset = "USDC";
    } else {
      collateralAsset = a;
      borrowAsset = b;
      amount = c as bigint;
      signer = d as string;
    }

    const { assetAddress: collatAddr } = this.resolveAsset(collateralAsset);
    const { assetAddress: borrowAddr } = this.resolveAsset(borrowAsset);
    const pool = await this.poolClient(signer);
    return this.writeCall(
      pool,
      "withdraw_collateral",
      { user: signer, collateral_asset: collatAddr, borrow_asset: borrowAddr, amount },
      signer
    );
  }

  // --- Liquidation -----------------------------------------------------------

  public async liquidate(
    borrower: string,
    debtAsset: string,
    collatAsset: string,
    debtToCover: bigint,
    liquidator: string
  ): Promise<string> {
    const { assetAddress: debtAddr } = this.resolveAsset(debtAsset);
    const { assetAddress: collatAddr } = this.resolveAsset(collatAsset);
    const liq = await this.liquidationClient(liquidator);
    return this.writeCall(
      liq,
      "liquidate",
      {
        liquidator,
        borrower,
        debt_asset: debtAddr,
        collat_asset: collatAddr,
        debt_to_cover: debtToCover,
      },
      liquidator
    );
  }

  // --- Data Queries ------------------------------------------------------

  public async getUserPosition(user: string, asset: string): Promise<UserPosition> {
    const { assetAddress } = this.resolveAsset(asset);
    const pool = await this.poolClient();
    const position = await this.readCall<{
      collateral_amount: bigint;
      scaled_debt: bigint;
      last_interaction: bigint;
    }>(pool, "get_user_position_view", { user, asset: assetAddress });

    return {
      collateral_amount: position.collateral_amount,
      scaled_debt: position.scaled_debt,
      last_interaction: Number(position.last_interaction),
    };
  }

  public async getPoolStats(asset: string): Promise<PoolStats> {
    const { assetAddress } = this.resolveAsset(asset);
    const pool = await this.poolClient();
    const interest = await this.interestClient();
    const [state, borrow_index] = await Promise.all([
      this.readCall<{ total_liquidity: bigint; total_borrowed: bigint }>(pool, "get_pool_state_view", {
        asset: assetAddress,
      }),
      this.readCall<bigint>(interest, "get_borrow_index", { asset: assetAddress }),
    ]);

    return {
      total_liquidity: state.total_liquidity,
      total_borrowed: state.total_borrowed,
      borrow_index,
    };
  }

  // --- Markets -------------------------------------------------------------

  public async getMarkets(): Promise<MarketData[]> {
    if (this.assets.length === 0) return [];

    const [config, interest, pool, oracle] = await Promise.all([
      this.configClient(),
      this.interestClient(),
      this.poolClient(),
      this.oracleClient(),
    ]);
    const riskParams = await this.getRiskParameters();
    const ltvBps = await this.readCall<number>(config, "get_ltv");

    return Promise.all(
      this.assets.map(async (asset) => {
        const meta = ASSET_METADATA[asset.symbol] ?? {
          name: asset.symbol,
          iconUrl: "/assets/tokens/default.svg",
          collateralEnabled: true,
        };

        const [state, priceWad] = await Promise.all([
          this.readCall<{ total_liquidity: bigint; total_borrowed: bigint }>(pool, "get_pool_state_view", {
            asset: asset.assetAddress,
          }),
          this.readCall<bigint>(oracle, "get_price", { asset: asset.assetAddress }).catch(() => 0n),
        ]);

        const totalLiquidity = state.total_liquidity;
        const totalBorrowed = state.total_borrowed;

        const utilizationBps = Number(
          await this.readCall<bigint>(interest, "get_utilization_rate", {
            total_liquidity: totalLiquidity,
            total_borrowed: totalBorrowed,
          })
        );

        const borrowApyBps = Number(
          await this.readCall<bigint>(interest, "get_borrow_rate", {
            utilization: BigInt(utilizationBps),
            base_rate: BigInt(riskParams.base_rate),
            optimal_utilization: BigInt(riskParams.optimal_utilization),
            slope1: BigInt(riskParams.slope_1),
            slope2: BigInt(riskParams.slope_2),
          })
        );

        const supplyApyBps = Number(
          await this.readCall<bigint>(interest, "get_supply_rate", {
            borrow_rate: BigInt(borrowApyBps),
            utilization: BigInt(utilizationBps),
            reserve_factor: BigInt(riskParams.reserve_factor),
          })
        );

        const priceUsd = Number(priceWad) / 1e18;

        return {
          symbol: asset.symbol,
          name: meta.name,
          assetAddress: asset.assetAddress,
          iconUrl: meta.iconUrl,
          priceUsd,
          decimals: asset.decimals,
          totalSupplied: totalLiquidity + totalBorrowed,
          totalBorrowed,
          availableLiquidity: totalLiquidity,
          supplyApyBps,
          borrowApyBps,
          utilizationBps,
          collateralEnabled: meta.collateralEnabled,
          ltvBps: meta.collateralEnabled ? ltvBps : 0,
          liquidationThresholdBps: meta.collateralEnabled ? riskParams.liquidation_threshold : 0,
        } satisfies MarketData;
      })
    );
  }

  public async getMarket(symbol: string): Promise<MarketData | null> {
    const markets = await this.getMarkets();
    return markets.find((m) => m.symbol.toLowerCase() === symbol.toLowerCase()) ?? null;
  }

  // --- Supply ----------------------------------------------------------------

  public async getSupplyPositions(user: string): Promise<SupplyPosition[]> {
    if (!user || this.assets.length === 0) return [];

    const markets = await this.getMarkets();
    const positions = await Promise.all(
      this.assets.map(async (asset) => {
        const position = await this.getUserPosition(user, asset.symbol);
        if (position.collateral_amount <= 0n) return null;

        const market = markets.find((m) => m.symbol === asset.symbol);
        const meta = ASSET_METADATA[asset.symbol] ?? { name: asset.symbol, iconUrl: "" };

        return {
          symbol: asset.symbol,
          name: meta.name,
          iconUrl: meta.iconUrl,
          decimals: asset.decimals,
          priceUsd: market?.priceUsd ?? 0,
          suppliedAmount: position.collateral_amount,
          supplyApyBps: market?.supplyApyBps ?? 0,
          // Intentionally 0n, not an approximation: lending_pool's deposit_collateral/
          // withdraw_collateral mutate `collateral_amount` by the raw deposited/withdrawn
          // amount only (contracts/lending_pool/src/lib.rs) with no supply-side index or
          // scaled-shares mechanism analogous to `scaled_debt`/`BorrowIndex` on the borrow
          // side. There is no on-chain state distinguishing principal from accrued interest
          // for suppliers, so any nonzero value here would be fabricated. See the SDK
          // audit report for the minimal contract views needed to make this real.
          interestEarned: 0n,
        } satisfies SupplyPosition;
      })
    );

    return positions.filter((p): p is SupplyPosition => p !== null);
  }

  public async getWalletBalance(assetSymbol: string, user: string): Promise<bigint> {
    if (!user) return 0n;
    try {
      const { assetAddress } = this.resolveAsset(assetSymbol);
      const token = await this.client(assetAddress);
      return await this.readCall<bigint>(token, "balance", { id: user });
    } catch {
      return 0n;
    }
  }

  public async supply(asset: string, amount: bigint, signer: string): Promise<string> {
    return this.depositCollateral(asset, amount, signer);
  }

  public async withdraw(asset: string, amount: bigint, signer: string): Promise<string> {
    return this.withdrawCollateral(asset, amount, signer);
  }

  // --- Borrow ------------------------------------------------------------

  public async getBorrowPositions(user: string): Promise<BorrowPosition[]> {
    if (!user || this.assets.length === 0) return [];

    const markets = await this.getMarkets();
    const interest = await this.interestClient();

    const positions = await Promise.all(
      this.assets.map(async (asset) => {
        const position = await this.getUserPosition(user, asset.symbol);
        if (position.scaled_debt <= 0n) return null;

        const borrowIndex = await this.readCall<bigint>(interest, "get_borrow_index", {
          asset: asset.assetAddress,
        });
        const actualDebt = (position.scaled_debt * borrowIndex) / WAD;

        const market = markets.find((m) => m.symbol === asset.symbol);
        const meta = ASSET_METADATA[asset.symbol] ?? { name: asset.symbol, iconUrl: "" };

        return {
          symbol: asset.symbol,
          name: meta.name,
          iconUrl: meta.iconUrl,
          decimals: asset.decimals,
          priceUsd: market?.priceUsd ?? 0,
          borrowedAmount: actualDebt,
          borrowApyBps: market?.borrowApyBps ?? 0,
          accruedInterest: actualDebt > position.scaled_debt ? actualDebt - position.scaled_debt : 0n,
        } satisfies BorrowPosition;
      })
    );

    return positions.filter((p): p is BorrowPosition => p !== null);
  }

  public async getBorrowSnapshot(user: string): Promise<BorrowSnapshot> {
    if (!user || this.assets.length === 0) {
      return { totalCollateralUsd: 0, totalDebtUsd: 0, maxLtvBps: 0, liquidationThresholdBps: 0 };
    }

    const [riskParams, interest, config] = await Promise.all([
      this.getRiskParameters(),
      this.interestClient(),
      this.configClient(),
    ]);
    const ltvBps = await this.readCall<number>(config, "get_ltv");

    let totalCollateralUsd = 0;
    let totalDebtUsd = 0;

    for (const asset of this.assets) {
      const position = await this.getUserPosition(user, asset.symbol);
      const priceUsd = await this.getAssetPriceUsd(asset.assetAddress);

      if (position.collateral_amount > 0n) {
        totalCollateralUsd += toNumber(position.collateral_amount, asset.decimals) * priceUsd;
      }

      if (position.scaled_debt > 0n) {
        const borrowIndex = await this.readCall<bigint>(interest, "get_borrow_index", {
          asset: asset.assetAddress,
        });
        const actualDebt = (position.scaled_debt * borrowIndex) / WAD;
        totalDebtUsd += toNumber(actualDebt, asset.decimals) * priceUsd;
      }
    }

    return {
      totalCollateralUsd,
      totalDebtUsd,
      maxLtvBps: ltvBps,
      liquidationThresholdBps: riskParams.liquidation_threshold,
    };
  }
}
