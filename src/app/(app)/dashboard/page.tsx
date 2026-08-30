"use client";

import { useStellar } from "@/context/StellarContext";
import { motion } from "framer-motion";
import { 
  LogOut, 
  Copy, 
  RefreshCcw, 
  Send, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle,
  Wallet
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Dashboard() {
  const { address, balance, network, disconnectWallet, refreshBalance, sendXlm, walletName } = useStellar();
  const router = useRouter();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [recentTx, setRecentTx] = useState<{ hash: string; timestamp: Date } | null>(null);

  useEffect(() => {
    if (!address) {
      router.push("/");
    }
  }, [address, router]);

  if (!address) return null;

  const copyAddress = () => {
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard");
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) {
      toast.error("Please fill in all fields");
      return;
    }
    
    // Basic validation
    if (recipient.length !== 56 || !recipient.startsWith('G')) {
      toast.error("Invalid recipient address format");
      return;
    }
    if (parseFloat(amount) <= 0 || isNaN(parseFloat(amount))) {
      toast.error("Invalid amount");
      return;
    }
    if (balance && parseFloat(amount) > parseFloat(balance)) {
      toast.error("Insufficient XLM balance");
      return;
    }

    setIsSending(true);
    const hash = await sendXlm(recipient, amount);
    if (hash) {
      setRecentTx({ hash, timestamp: new Date() });
      setRecipient("");
      setAmount("");
    }
    setIsSending(false);
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  return (
    <div className="min-h-screen pt-24 pb-12 px-6 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-end border-b border-market-border pb-6">
          <div>
            <h1 className="text-3xl font-display font-bold tracking-tight text-market-text">Dashboard</h1>
            <p className="text-market-text-secondary mt-1">Manage your Credence assets</p>
          </div>
          <button
            onClick={disconnectWallet}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-market-surface-hover transition-colors text-sm font-medium text-market-text-secondary"
          >
            <LogOut className="w-4 h-4" />
            <span>Disconnect</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Wallet Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-market-border bg-market-surface p-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-[40px] -mr-10 -mt-10 pointer-events-none" />
            <h2 className="text-sm font-medium text-market-text-muted uppercase tracking-wider mb-4 flex items-center space-x-2">
              <Wallet className="w-4 h-4" />
              <span>Connected via {walletName ?? "Wallet"}</span>
            </h2>

            <div className="flex items-center justify-between bg-market-surface-hover border border-market-border rounded-xl p-4 mb-4">
              <span className="font-mono text-lg text-market-text">{formatAddress(address)}</span>
              <button
                onClick={copyAddress}
                className="p-2 hover:bg-market-surface-hover rounded-lg transition-colors"
                title="Copy Address"
              >
                <Copy className="w-4 h-4 text-market-text-secondary" />
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${network === 'TESTNET' ? 'bg-accent' : 'bg-yellow-500'}`} />
              <span className="text-sm font-medium text-market-text-secondary">
                {network === 'TESTNET' ? 'Stellar Testnet' : 'Wrong Network (Switch to Testnet)'}
              </span>
            </div>
          </motion.div>

          {/* Balance Card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-2xl border border-market-border bg-market-surface p-6 relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-sm font-medium text-market-text-muted uppercase tracking-wider">
                Available Balance
              </h2>
              <button
                onClick={refreshBalance}
                className="p-2 hover:bg-market-surface-hover rounded-lg transition-colors"
                title="Refresh Balance"
              >
                <RefreshCcw className="w-4 h-4 text-market-text-secondary" />
              </button>
            </div>

            <div className="flex items-baseline space-x-2">
              {balance === null ? (
                <div className="h-10 w-32 bg-market-surface-hover animate-pulse rounded-lg" />
              ) : (
                <>
                  <span className="text-5xl font-display font-bold text-market-text">{parseFloat(balance).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  <span className="text-xl text-market-text-secondary font-medium">XLM</span>
                </>
              )}
            </div>
          </motion.div>

        </div>

        {/* Transfer Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-market-border bg-market-surface p-6 md:p-8"
        >
          <h2 className="text-xl font-display font-bold mb-6 text-market-text">Transfer XLM</h2>
          <form onSubmit={handleSend} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-market-text-secondary">Recipient Address</label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="G..."
                className="w-full bg-market-surface-hover border border-market-border rounded-xl px-4 py-3 font-mono text-market-text outline-none focus:border-accent transition-colors"
                disabled={isSending}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-market-text-secondary">Amount (XLM)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.0000001"
                min="0"
                className="w-full bg-market-surface-hover border border-market-border rounded-xl px-4 py-3 font-sans text-market-text outline-none focus:border-accent transition-colors"
                disabled={isSending}
              />
            </div>

            <button
              type="submit"
              disabled={isSending || network !== 'TESTNET'}
              className="w-full flex items-center justify-center space-x-2 bg-foreground text-background py-4 rounded-xl font-medium transition-all hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <span className="animate-pulse">Processing Transaction...</span>
              ) : (
                <>
                  <span>Send XLM</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Recent Transaction */}
        {recentTx && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-market-border bg-market-surface p-6 flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-accent/20 p-3 rounded-full">
                <CheckCircle2 className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="font-medium text-market-text">Transaction Successful</p>
                <p className="text-sm text-market-text-secondary">{recentTx.timestamp.toLocaleTimeString()}</p>
              </div>
            </div>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${recentTx.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-accent hover:text-accent-hover transition-colors text-sm font-medium"
            >
              <span>View on Explorer</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </motion.div>
        )}

      </div>
    </div>
  );
}
