import { track } from "@vercel/analytics";

export type ProtocolAction = "supply" | "withdraw" | "borrow" | "repay" | "liquidation";

/**
 * Fires a lightweight custom Vercel Analytics event for a successful protocol
 * action. Only the asset symbol and wallet provider are attached -- never an
 * address, amount, or anything else that could identify or fingerprint a user.
 */
export function trackProtocolAction(action: ProtocolAction, props: { symbol: string; walletType: string | null }) {
  track(action, {
    symbol: props.symbol,
    walletType: props.walletType ?? "unknown",
  });
}

export function trackWalletConnected(walletType: string | null) {
  track("wallet_connect", { walletType: walletType ?? "unknown" });
}
