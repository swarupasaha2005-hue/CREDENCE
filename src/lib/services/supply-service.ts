import { SupplyAsset, SupplyPosition } from "../../../packages/interfaces/src";
import { protocol } from "../protocol";
import { MarketService } from "./market-service";

/**
 * Dedicated data-access layer for the Earn page.
 * Wraps the Protocol SDK so components never call SDK methods directly.
 */
export const SupplyService = {
  async getSupplyAssets(user: string): Promise<SupplyAsset[]> {
    const markets = await MarketService.getMarkets();
    return Promise.all(
      markets.map(async (market) => ({
        ...market,
        walletBalance: await protocol.getWalletBalance(market.symbol, user),
      }))
    );
  },

  async getSupplyPositions(user: string): Promise<SupplyPosition[]> {
    return protocol.getSupplyPositions(user);
  },

  async supply(assetSymbol: string, amount: bigint, signer: string): Promise<string> {
    const market = await MarketService.getMarket(assetSymbol);
    if (!market) throw new Error(`Unknown asset: ${assetSymbol}`);
    return protocol.supply(market.assetAddress, amount, signer);
  },

  async withdraw(assetSymbol: string, amount: bigint, signer: string): Promise<string> {
    const market = await MarketService.getMarket(assetSymbol);
    if (!market) throw new Error(`Unknown asset: ${assetSymbol}`);
    return protocol.withdraw(market.assetAddress, amount, signer);
  },
};
