import {
  isConnected,
  isAllowed,
  setAllowed,
  requestAccess,
  getAddress,
  getNetwork,
  signTransaction,
} from "@stellar/freighter-api";
import * as StellarSdk from "@stellar/stellar-sdk";

export interface AssetBalance {
  symbol: string;
  balance: string;
}

export interface WalletConnection {
  address: string;
  network: string | null;
}

const HORIZON_URL = "https://horizon-testnet.stellar.org";
const STORAGE_KEY = "credence:wallet-connected";

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

export class WalletServiceError extends Error {
  code: "NOT_INSTALLED" | "REJECTED" | "WRONG_NETWORK" | "TIMEOUT" | "UNKNOWN";

  constructor(code: WalletServiceError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "WalletServiceError";
  }
}

const server = new StellarSdk.Horizon.Server(HORIZON_URL);

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new WalletServiceError("TIMEOUT", `${label} timed out`)), ms)
    ),
  ]);
}

export const WalletService = {
  async isFreighterInstalled(): Promise<boolean> {
    try {
      const { isConnected: connected } = await isConnected();
      return Boolean(connected);
    } catch {
      return false;
    }
  },

  /** True if the site has previously been granted access and the user opted to persist the session. */
  async hasPersistedSession(): Promise<boolean> {
    if (typeof window === "undefined") return false;
    if (localStorage.getItem(STORAGE_KEY) !== "true") return false;
    try {
      const { isAllowed: allowed } = await isAllowed();
      return Boolean(allowed);
    } catch {
      return false;
    }
  },

  markPersisted() {
    if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, "true");
  },

  clearPersisted() {
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY);
  },

  async getNetwork(): Promise<string | null> {
    const { network } = await getNetwork();
    return network ?? null;
  },

  async getCurrentAddress(): Promise<string | null> {
    const { address } = await getAddress();
    return address || null;
  },

  async connect(): Promise<WalletConnection> {
    const installed = await this.isFreighterInstalled();
    if (!installed) {
      throw new WalletServiceError(
        "NOT_INSTALLED",
        "Freighter wallet extension is not installed."
      );
    }

    try {
      await withTimeout(setAllowed(), 30000, "Connection request");
      const { address, error } = await withTimeout(requestAccess(), 30000, "Connection request");

      if (error || !address) {
        throw new WalletServiceError("REJECTED", "Wallet connection was rejected.");
      }

      const network = await this.getNetwork();
      return { address, network };
    } catch (err) {
      if (err instanceof WalletServiceError) throw err;
      throw new WalletServiceError("REJECTED", "Wallet connection was rejected.");
    }
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

  async signTransaction(xdr: string, networkPassphrase: string) {
    const { signedTxXdr, error } = await signTransaction(xdr, { networkPassphrase });
    if (error) {
      throw new WalletServiceError("REJECTED", "Transaction signing was rejected.");
    }
    return signedTxXdr as string;
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
