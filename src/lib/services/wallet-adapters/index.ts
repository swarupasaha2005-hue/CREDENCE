import { WalletAdapter, WalletId } from "./types";
import { freighterAdapter } from "./freighter-adapter";
import { albedoAdapter } from "./albedo-adapter";

export const WALLET_ADAPTERS: Record<WalletId, WalletAdapter> = {
  freighter: freighterAdapter,
  albedo: albedoAdapter,
};

export const SUPPORTED_WALLETS: WalletAdapter[] = [freighterAdapter, albedoAdapter];

export function getAdapter(id: WalletId): WalletAdapter {
  return WALLET_ADAPTERS[id];
}

export type { WalletAdapter, WalletId, WalletConnection, SignOptions } from "./types";
export { WalletServiceError } from "./errors";
