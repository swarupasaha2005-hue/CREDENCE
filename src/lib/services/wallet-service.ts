import * as StellarSdk from "@stellar/stellar-sdk";
import { WalletId } from "./wallet-adapters";

export interface AssetBalance {
  symbol: string;
  balance: string;
}

export interface WalletConnection {
  address: string;
  network: string | null;
}

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const STORAGE_KEY = "credence:wallet-provider";

/** Assets tracked in addition to native XLM. Add new entries here to support more. */
const TRACKED_ASSETS: { symbol: string; code: string; issuer: string }[] = [
  {
    symbol: "USDC",
    code: "USDC",
    issuer: "GA3HX2NBHUGBP7SSXJ4BIS52LUXHGVHO3FGTYAAWWZQNLZSOSJTHEKKU",
  },
  {
    symbol: "AQUA",
    code: "AQUA",
    issuer: "GDVFA5Y32WGDJLHLDICJDSXTTM77V57YO655T66VXQL6BQUYHPMLVS66",
  },
];

const server = new StellarSdk.Horizon.Server(HORIZON_URL);

/**
 * Wallet-agnostic Stellar plumbing: balance lookups, account loading, transaction
 * submission, and persisted wallet-choice storage. Everything wallet-specific
 * (connect/sign/network) lives in `wallet-adapters/*` -- this service never imports
 * a wallet SDK directly, so it works identically regardless of which wallet is active.
 */
export const WalletService = {
  /** The wallet the user previously chose, if any -- read on mount to attempt reconnect. */
  getPersistedWalletId(): WalletId | null {
    if (typeof window === "undefined") return null;
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "freighter" || value === "albedo" ? value : null;
  },

  markPersisted(walletId: WalletId) {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, walletId);
  },

  clearPersisted() {
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  },

  async fetchBalances(address: string): Promise<AssetBalance[]> {
    try {
      const account = await server.loadAccount(address);

      const xlm = account.balances.find((b) => b.asset_type === "native");
      const balances: AssetBalance[] = [
        { symbol: "XLM", balance: xlm ? xlm.balance : "0" },
      ];

      for (const tracked of TRACKED_ASSETS) {
        const match = account.balances.find(
          (b) =>
            (b.asset_type === "credit_alphanum4" || b.asset_type === "credit_alphanum12") &&
            "asset_code" in b &&
            b.asset_code === tracked.code &&
            "asset_issuer" in b &&
            b.asset_issuer === tracked.issuer
        );
        balances.push({ symbol: tracked.symbol, balance: match ? match.balance : "0" });
      }

      return balances;
    } catch {
      return [
        { symbol: "XLM", balance: "0" },
        ...TRACKED_ASSETS.map((a) => ({ symbol: a.symbol, balance: "0" })),
      ];
    }
  },

  async submitTransaction(signedXdr: string, networkPassphrase: string) {
    const tx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
    return server.submitTransaction(tx as StellarSdk.Transaction);
  },

  async loadAccount(address: string) {
    return server.loadAccount(address);
  },

  get server() {
    return server;
  },
};

export { WalletServiceError } from "./wallet-adapters/errors";
