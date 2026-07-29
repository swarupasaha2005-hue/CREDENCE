"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { isAllowed, setAllowed, requestAccess, getAddress, getNetwork, signTransaction } from "@stellar/freighter-api";
import * as StellarSdk from "@stellar/stellar-sdk";
import { toast } from "sonner";

interface StellarContextType {
  address: string | null;
  balance: string | null;
  network: string | null;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  refreshBalance: () => Promise<void>;
  sendXlm: (destination: string, amount: string) => Promise<string | null>;
}

const StellarContext = createContext<StellarContextType | undefined>(undefined);

export function StellarProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const server = new StellarSdk.Horizon.Server("https://horizon-testnet.stellar.org");

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const { isAllowed: allowed } = await isAllowed();
      if (allowed) {
        const { address: pubKey } = await getAddress();
        const { network: net } = await getNetwork();
        
        if (pubKey) {
          setAddress(pubKey);
          setNetwork(net || null);
          await fetchBalance(pubKey);
          
          if (net !== "TESTNET") {
            toast.warning("Please switch to Stellar Testnet in Freighter");
          }
        }
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    }
  };

  const fetchBalance = async (pubKey: string) => {
    try {
      const account = await server.loadAccount(pubKey);
      const xlmBalance = account.balances.find((b) => b.asset_type === "native");
      if (xlmBalance) {
        setBalance(xlmBalance.balance);
      } else {
        setBalance("0");
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance("0");
    }
  };

  const refreshBalance = async () => {
    if (address) {
      await fetchBalance(address);
      toast.success("Balance refreshed");
    }
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      await setAllowed();
      const { address: pubKey, error } = await requestAccess();
      if (error) throw new Error(error);

      const { network: net } = await getNetwork();
      
      if (pubKey) {
        setAddress(pubKey);
        setNetwork(net || null);
        await fetchBalance(pubKey);
        
        if (net === "TESTNET") {
          toast.success("Wallet connected!");
        } else {
          toast.warning("Please switch to Stellar Testnet in Freighter");
        }
      }
    } catch (error) {
      console.error("Connection error:", error);
      toast.error("Failed to connect wallet. Ensure Freighter is installed and unlocked.");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setBalance(null);
    setNetwork(null);
    toast.info("Wallet disconnected");
  };

  const sendXlm = async (destination: string, amount: string) => {
    if (!address) {
      toast.error("Wallet not connected");
      return null;
    }
    if (network !== "TESTNET") {
      toast.error("Please switch to Testnet before sending");
      return null;
    }
    
    try {
      const sourceAccount = await server.loadAccount(address);
      
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

      const xdr = tx.toXDR();
      const { signedTxXdr, error: signError } = await signTransaction(xdr, { networkPassphrase: StellarSdk.Networks.TESTNET });
      
      if (signError) {
        throw new Error(signError as string);
      }
      
      const signedTx = StellarSdk.TransactionBuilder.fromXDR(
        signedTxXdr as string,
        StellarSdk.Networks.TESTNET
      );
      
      const result = await server.submitTransaction(signedTx as StellarSdk.Transaction);
      
      toast.success("Transaction successful!");
      await fetchBalance(address);
      return result.hash;
    } catch (error: any) {
      console.error("Transaction failed:", error);
      toast.error(error?.message || "Transaction failed or was rejected");
      return null;
    }
  };

  return (
    <StellarContext.Provider
      value={{
        address,
        balance,
        network,
        isConnecting,
        connectWallet,
        disconnectWallet,
        refreshBalance,
        sendXlm,
      }}
    >
      {children}
    </StellarContext.Provider>
  );
}

export function useStellar() {
  const context = useContext(StellarContext);
  if (context === undefined) {
    throw new Error("useStellar must be used within a StellarProvider");
  }
  return context;
}
