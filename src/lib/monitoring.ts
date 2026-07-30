import * as Sentry from "@sentry/nextjs";

export type WalletAction = "connect" | "send" | "supply" | "withdraw" | "borrow" | "repay";

interface WalletErrorContext {
  walletType: string | null;
  action: WalletAction;
  network: string | null;
}

/**
 * Reports a wallet/transaction failure to Sentry with non-sensitive context only.
 * Never pass signed XDRs, secret keys, or seed phrases here -- only identifiers
 * like wallet provider name, action name, and network.
 */
export function captureWalletError(error: unknown, context: WalletErrorContext) {
  Sentry.captureException(error, {
    tags: {
      walletType: context.walletType ?? "unknown",
      walletAction: context.action,
      network: context.network ?? "unknown",
    },
  });
}
