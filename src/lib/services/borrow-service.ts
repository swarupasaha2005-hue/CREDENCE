import { BorrowableAsset, BorrowPosition, BorrowSnapshot } from "../../../packages/interfaces/src";
import { protocol } from "../protocol";
import { MarketService } from "./market-service";

/**
 * Dedicated data-access layer for the Borrow page.
 * Wraps the Protocol SDK so components never call SDK methods directly.
 */
export const BorrowService = {
  async getBorrowPositions(user: string): Promise<BorrowPosition[]> {
    return protocol.getBorrowPositions(user);
  },

  async getBorrowSnapshot(user: string): Promise<BorrowSnapshot> {
    return protocol.getBorrowSnapshot(user);
  },

  async getBorrowableAssets(user: string): Promise<BorrowableAsset[]> {
    const [markets, snapshot] = await Promise.all([
      MarketService.getMarkets(),
      protocol.getBorrowSnapshot(user),
    ]);

    const remainingBorrowPowerUsd = Math.max(
      0,
      (snapshot.totalCollateralUsd * snapshot.maxLtvBps) / 10_000 - snapshot.totalDebtUsd
    );

    return markets.map((market) => {
      const availableLiquidityUsd =
        (Number(market.availableLiquidity) / 10 ** market.decimals) * market.priceUsd;
      const maxBorrowableUsd = Math.min(availableLiquidityUsd, remainingBorrowPowerUsd);
      const maxBorrowable = BigInt(
        Math.max(0, Math.floor((maxBorrowableUsd / market.priceUsd) * 10 ** market.decimals))
      );

      return { ...market, maxBorrowable };
    });
  },

  async borrow(assetSymbol: string, amount: bigint, signer: string): Promise<string> {
    const market = await MarketService.getMarket(assetSymbol);
    if (!market) throw new Error(`Unknown asset: ${assetSymbol}`);
    return protocol.borrow(market.assetAddress, amount, signer);
  },

  async repay(assetSymbol: string, amount: bigint, signer: string): Promise<string> {
    const market = await MarketService.getMarket(assetSymbol);
    if (!market) throw new Error(`Unknown asset: ${assetSymbol}`);
    return protocol.repay(market.assetAddress, amount, signer);
  },
};
