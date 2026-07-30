import {
  isConnected,
  isAllowed,
  setAllowed,
  requestAccess,
  getAddress,
  getNetwork,
  signTransaction,
} from "@stellar/freighter-api";
import { WalletAdapter, WalletConnection, SignOptions } from "./types";
import { WalletServiceError } from "./errors";

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new WalletServiceError("TIMEOUT", `${label} timed out`)), ms)
    ),
  ]);
}

export const freighterAdapter: WalletAdapter = {
  id: "freighter",
  name: "Freighter",

  async isAvailable() {
    try {
      const { isConnected: available } = await isConnected();
      return Boolean(available);
    } catch {
      return false;
    }
  },

  async connect(): Promise<WalletConnection> {
    const available = await freighterAdapter.isAvailable();
    if (!available) {
      throw new WalletServiceError("NOT_INSTALLED", "Freighter wallet extension is not installed.");
    }

    try {
      await withTimeout(setAllowed(), 30000, "Connection request");
      const { address, error } = await withTimeout(requestAccess(), 30000, "Connection request");

      if (error || !address) {
        throw new WalletServiceError("REJECTED", "Wallet connection was rejected.");
      }

      const network = await freighterAdapter.getNetwork();
      return { address, network };
    } catch (err) {
      if (err instanceof WalletServiceError) throw err;
      throw new WalletServiceError("REJECTED", "Wallet connection was rejected.");
    }
  },

  disconnect() {
    // Freighter has no programmatic disconnect API -- the app clears its own session.
  },

  async getPublicKey() {
    const { address } = await getAddress();
    return address || null;
  },

  async isConnected() {
    try {
      const { isAllowed: allowed } = await isAllowed();
      return Boolean(allowed);
    } catch {
      return false;
    }
  },

  async getNetwork() {
    const { network } = await getNetwork();
    return network ?? null;
  },

  async signTransaction(xdr: string, opts: SignOptions) {
    const { signedTxXdr, error } = await signTransaction(xdr, {
      networkPassphrase: opts.networkPassphrase,
      address: opts.address,
    });
    if (error) {
      throw new WalletServiceError("REJECTED", "Transaction signing was rejected.");
    }
    return signedTxXdr as string;
  },
};
