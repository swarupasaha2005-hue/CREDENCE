"use client";

/** Back-compat re-export: wallet logic now lives in WalletContext / WalletService. */
export { WalletProvider as StellarProvider, useWallet as useStellar } from "./WalletContext";
