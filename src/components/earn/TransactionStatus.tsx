import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export type TransactionState = "idle" | "submitting" | "success" | "failed";

interface TransactionStatusProps {
  state: TransactionState;
  errorMessage?: string;
}

export function TransactionStatus({ state, errorMessage }: TransactionStatusProps) {
  if (state === "idle") return null;

  if (state === "submitting") {
    return (
      <div role="status" className="flex items-center gap-2 rounded-lg border border-market-border px-4 py-3 text-sm text-market-text-secondary">
        <Loader2 className="h-4 w-4 animate-spin" />
        Submitting transaction...
      </div>
    );
  }

  if (state === "success") {
    return (
      <div role="status" className="flex items-center gap-2 rounded-lg border border-market-border px-4 py-3 text-sm text-market-text">
        <CheckCircle2 className="h-4 w-4" />
        Transaction successful.
      </div>
    );
  }

  return (
    <div role="alert" className="flex items-center gap-2 rounded-lg border border-market-border px-4 py-3 text-sm text-market-text-secondary">
      <AlertCircle className="h-4 w-4" />
      {errorMessage || "Transaction failed. Please try again."}
    </div>
  );
}
