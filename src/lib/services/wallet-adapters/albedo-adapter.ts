import albedo from "@albedo-link/intent";
import { WalletAdapter, WalletConnection, SignOptions } from "./types";
import { WalletServiceError } from "./errors";

/**
 * Albedo (https://albedo.link) signs through a secure popup window rather than a
 * browser extension, so there is nothing to "install" and no passive session to
 * probe on page load -- every connection and every signature requires an explicit
 * user-approved popup. `isConnected()`/`getPublicKey()` reflect that honestly by
 * returning false/null instead of faking a persisted session.
 */
function mapAlbedoError(err: unknown): WalletServiceError {
  const message = err && typeof err === "object" && "message" in err ? String((err as { message: unknown }).message) : "";
  if (/reject|cancel|denied|closed/i.test(message)) {
    return new WalletServiceError("REJECTED", "Wallet connection was rejected.");
  }
  return new WalletServiceError("UNKNOWN", message || "Albedo request failed.");
}

export const albedoAdapter: WalletAdapter = {
  id: "albedo",
  name: "Albedo",

  async isAvailable() {
    // Albedo requires no extension -- it works in any browser via a popup window.
    return typeof window !== "undefined";
  },

  async connect(): Promise<WalletConnection> {
    try {
      const result = await albedo.publicKey({});
      return { address: result.pubkey, network: "TESTNET" };
    } catch (err) {
      throw mapAlbedoError(err);
    }
  },

  disconnect() {
    // Albedo has no persisted grant to revoke -- each session is popup-approved.
  },

  async getPublicKey() {
    // Albedo has no silent public-key read; connect() must be re-invoked to prompt the user.
    return null;
  },

  async isConnected() {
    // No passive session probe exists for Albedo; app-level persistence (selected wallet
    // + last known address) is used instead, see WalletContext.
    return false;
  },

  async getNetwork() {
    return "TESTNET";
  },

  async signTransaction(xdr: string, opts: SignOptions) {
    try {
      const result = await albedo.tx({
        xdr,
        pubkey: opts.address,
        network: "testnet",
      });
      return result.signed_envelope_xdr;
    } catch (err) {
      throw mapAlbedoError(err);
    }
  },
};
