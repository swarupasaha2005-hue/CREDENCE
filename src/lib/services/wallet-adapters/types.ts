export type WalletId = "freighter" | "albedo";

export interface WalletConnection {
  address: string;
  network: string | null;
}

export interface SignOptions {
  networkPassphrase: string;
  address: string;
}

/**
 * Common surface every supported Stellar wallet must implement. WalletContext and
 * WalletService only ever talk to this interface -- never to a wallet SDK directly.
 */
export interface WalletAdapter {
  id: WalletId;
  name: string;

  /** Whether this wallet can currently be used (extension installed, API reachable, etc). */
  isAvailable(): Promise<boolean>;

  /** Prompts the user to connect and returns the selected account + network. */
  connect(): Promise<WalletConnection>;

  /** Clears any adapter-level state. Most Stellar wallets have no programmatic disconnect. */
  disconnect(): void;

  /** Silently reads the connected public key, if any, without prompting the user. */
  getPublicKey(): Promise<string | null>;

  /** Whether the wallet currently reports an active, already-granted session. */
  isConnected(): Promise<boolean>;

  /** Currently selected network on the wallet side, if the wallet exposes one. */
  getNetwork(): Promise<string | null>;

  /** Requests a signature for a transaction XDR, returning the signed XDR. */
  signTransaction(xdr: string, opts: SignOptions): Promise<string>;
}
