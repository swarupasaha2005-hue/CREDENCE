"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { toast } from "sonner";
import { AssetBalance, WalletService } from "../lib/services/wallet-service";
import { WalletAdapter, WalletId, WalletServiceError, SUPPORTED_WALLETS, getAdapter } from "../lib/services/wallet-adapters";
import { protocol } from "../lib/protocol";

export type { WalletId } from "../lib/services/wallet-adapters";

export interface AvailableWallet {
  id: WalletId;
  name: string;
}

interface WalletContextType {
  // Preferred API
  connected: boolean;
  connecting: boolean;
  address: string | null;
  shortAddress: string | null;
  network: string | null;
  balances: AssetBalance[];
  connect: () => Promise<void>;
  disconnect: () => void;
  refreshBalances: () => Promise<void>;

  // Multi-wallet API
  walletId: WalletId | null;
  walletName: string | null;
  availableWallets: AvailableWallet[];
  selectWallet: (id: WalletId) => Promise<void>;

  // Legacy aliases kept for existing pages/components (Dashboard, Earn, Borrow, modals)
  balance: string | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
  sendXlm: (destination: string, amount: string) => Promise<string | null>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

function shorten(address: string | null): string | null {
  if (!address) return null;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function describeWalletError(error: unknown, walletName: string): string {
  if (error instanceof WalletServiceError) {
    switch (error.code) {
      case "NOT_INSTALLED":
        return `${walletName} is not installed. Install it to continue.`;
      case "REJECTED":
        return "Wallet connection was rejected.";
      case "WRONG_NETWORK":
        return `Please switch to Stellar Testnet in ${walletName}.`;
      case "TIMEOUT":
        return "Connection request timed out. Please try again.";
      default:
        return `Failed to connect ${walletName}.`;
    }
  }
  return `Failed to connect ${walletName}. Ensure it is installed and unlocked.`;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [balances, setBalances] = useState<AssetBalance[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [walletId, setWalletId] = useState<WalletId | null>(null);

  const adapter: WalletAdapter | null = walletId ? getAdapter(walletId) : null;

  const fetchBalancesSilently = useCallback(async (pubKey: string) => {
    const result = await WalletService.fetchBalances(pubKey);
    setBalances(result);
  }, []);

  const refreshBalances = useCallback(async () => {
    if (!address) return;
    await fetchBalancesSilently(address);
    toast.success("Balance refreshed");
  }, [address, fetchBalancesSilently]);

  const applyConnection = useCallback(
    (id: WalletId, pubKey: string, net: string | null) => {
      setWalletId(id);
      setAddress(pubKey);
      setNetwork(net);
      protocol.setSigner((xdr, opts) => getAdapter(id).signTransaction(xdr, opts));
    },
    []
  );

  // Attempt to silently restore the previously-selected wallet's session on mount.
  // Not every wallet supports this (see wallet-adapters/albedo-adapter.ts) -- a wallet
  // that can't report an existing session simply won't auto-reconnect, rather than the
  // app faking a persisted session it can't actually verify.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const persistedId = WalletService.getPersistedWalletId();
      if (!persistedId || cancelled) return;

      const persistedAdapter = getAdapter(persistedId);
      const hasSession = await persistedAdapter.isConnected();
      if (!hasSession || cancelled) return;

      const pubKey = await persistedAdapter.getPublicKey();
      if (!pubKey || cancelled) return;

      const net = await persistedAdapter.getNetwork();
      if (cancelled) return;

      applyConnection(persistedId, pubKey, net);
      await fetchBalancesSilently(pubKey);

      if (net !== "TESTNET") {
        toast.warning(`Please switch to Stellar Testnet in ${persistedAdapter.name}`);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectWallet = useCallback(
    async (id: WalletId) => {
      const chosenAdapter = getAdapter(id);
      setConnecting(true);
      try {
        const { address: pubKey, network: net } = await chosenAdapter.connect();
        applyConnection(id, pubKey, net);
        WalletService.markPersisted(id);

        await fetchBalancesSilently(pubKey);

        if (net === "TESTNET") {
          toast.success(`Connected via ${chosenAdapter.name}`);
        } else {
          toast.warning(`Please switch to Stellar Testnet in ${chosenAdapter.name}`);
        }
      } catch (error) {
        toast.error(describeWalletError(error, chosenAdapter.name));
      } finally {
        setConnecting(false);
      }
    },
    [applyConnection, fetchBalancesSilently]
  );

  /** Legacy no-argument connect: reconnects the last-selected wallet, defaulting to Freighter. */
  const connect = useCallback(async () => {
    await selectWallet(walletId ?? WalletService.getPersistedWalletId() ?? "freighter");
  }, [selectWallet, walletId]);

  const disconnect = useCallback(() => {
    adapter?.disconnect();
    setWalletId(null);
    setAddress(null);
    setNetwork(null);
    setBalances([]);
    WalletService.clearPersisted();
    protocol.setSigner(null);
    toast.info("Wallet disconnected");
  }, [adapter]);

  const sendXlm = useCallback(
    async (destination: string, amount: string) => {
      if (!address || !adapter) {
        toast.error("Wallet not connected");
        return null;
      }
      if (network !== "TESTNET") {
        toast.error("Please switch to Testnet before sending");
        return null;
      }

      try {
        const sourceAccount = await WalletService.loadAccount(address);

        const tx = new StellarSdk.TransactionBuilder(sourceAccount, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase: StellarSdk.Networks.TESTNET,
        })
          .addOperation(
            StellarSdk.Operation.payment({
              destination,
              asset: StellarSdk.Asset.native(),
              amount,
            })
          )
          .setTimeout(30)
          .build();

        const signedXdr = await adapter.signTransaction(tx.toXDR(), {
          networkPassphrase: StellarSdk.Networks.TESTNET,
          address,
        });
        const result = await WalletService.submitTransaction(signedXdr, StellarSdk.Networks.TESTNET);

        toast.success("Transaction successful!");
        await fetchBalancesSilently(address);
        return result.hash;
      } catch (error) {
        const message =
          error instanceof WalletServiceError
            ? error.message
            : error instanceof Error
            ? error.message
            : "Transaction failed or was rejected";
        toast.error(message);
        return null;
      }
    },
    [address, network, adapter, fetchBalancesSilently]
  );

  const xlmBalance = balances.find((b) => b.symbol === "XLM")?.balance ?? null;

  return (
    <WalletContext.Provider
      value={{
        connected: Boolean(address),
        connecting,
        address,
        shortAddress: shorten(address),
        network,
        balances,
        connect,
        disconnect,
        refreshBalances,

        walletId,
        walletName: adapter?.name ?? null,
        availableWallets: SUPPORTED_WALLETS.map((a) => ({ id: a.id, name: a.name })),
        selectWallet,

        balance: xlmBalance,
        isConnecting: connecting,
        connectWallet: connect,
        disconnectWallet: disconnect,
        refreshBalance: refreshBalances,
        sendXlm,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
