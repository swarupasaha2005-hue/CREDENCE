"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import * as StellarSdk from "@stellar/stellar-sdk";
import { toast } from "sonner";
import { AssetBalance, WalletService, WalletServiceError } from "../lib/services/wallet-service";

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

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [balances, setBalances] = useState<AssetBalance[]>([]);
  const [connecting, setConnecting] = useState(false);

  const fetchBalancesSilently = useCallback(async (pubKey: string) => {
    const result = await WalletService.fetchBalances(pubKey);
    setBalances(result);
  }, []);

  const refreshBalances = useCallback(async () => {
    if (!address) return;
    await fetchBalancesSilently(address);
    toast.success("Balance refreshed");
  }, [address, fetchBalancesSilently]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const hasSession = await WalletService.hasPersistedSession();
      if (!hasSession || cancelled) return;

      const pubKey = await WalletService.getCurrentAddress();
      if (!pubKey || cancelled) return;

      const net = await WalletService.getNetwork();
      if (cancelled) return;

      setAddress(pubKey);
      setNetwork(net);

      await fetchBalancesSilently(pubKey);

      if (net !== "TESTNET") {
        toast.warning("Please switch to Stellar Testnet in Freighter");
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const { address: pubKey, network: net } = await WalletService.connect();
      setAddress(pubKey);
      setNetwork(net);
      WalletService.markPersisted();

      await fetchBalancesSilently(pubKey);

      if (net === "TESTNET") {
        toast.success("Wallet connected!");
      } else {
        toast.warning("Please switch to Stellar Testnet in Freighter");
      }
    } catch (error) {
      if (error instanceof WalletServiceError) {
        switch (error.code) {
          case "NOT_INSTALLED":
            toast.error("Freighter is not installed. Install it to continue.");
            break;
          case "REJECTED":
            toast.error("Wallet connection was rejected.");
            break;
          case "TIMEOUT":
            toast.error("Connection request timed out. Please try again.");
            break;
          default:
            toast.error("Failed to connect wallet.");
        }
      } else {
        toast.error("Failed to connect wallet. Ensure Freighter is installed and unlocked.");
      }
    } finally {
      setConnecting(false);
    }
  }, [fetchBalancesSilently]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setNetwork(null);
    setBalances([]);
    WalletService.clearPersisted();
    toast.info("Wallet disconnected");
  }, []);

  const sendXlm = useCallback(
    async (destination: string, amount: string) => {
      if (!address) {
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

        const signedXdr = await WalletService.signTransaction(tx.toXDR(), StellarSdk.Networks.TESTNET);
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
    [address, network, fetchBalancesSilently]
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
