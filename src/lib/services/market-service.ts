import { MarketData } from "../../../packages/interfaces/src";
import { protocol } from "../protocol";

/**
 * Dedicated data-access layer for the Markets page.
 * Wraps the Protocol SDK so components never call SDK methods directly.
 */
export const MarketService = {
  async getMarkets(): Promise<MarketData[]> {
    return protocol.getMarkets();
  },

  async getMarket(symbol: string): Promise<MarketData | null> {
    return protocol.getMarket(symbol);
  },

  async refreshMarkets(): Promise<MarketData[]> {
    return protocol.getMarkets();
  },
};
