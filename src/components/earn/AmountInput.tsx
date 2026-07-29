import { formatTokenQuantity } from "../../lib/market-format";

interface AmountInputProps {
  value: string;
  onChange: (value: string) => void;
  maxRaw: bigint;
  decimals: number;
  symbol: string;
  disabled?: boolean;
}

export function AmountInput({ value, onChange, maxRaw, decimals, symbol, disabled }: AmountInputProps) {
  const maxQuantity = Number(maxRaw) / 10 ** decimals;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <label htmlFor="supply-amount" className="text-market-text-secondary">
          Amount
        </label>
        <span className="text-market-text-muted">
          Balance: {formatTokenQuantity(maxRaw, decimals)} {symbol}
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-xl border border-market-border bg-market-surface-hover px-4 py-3">
        <input
          id="supply-amount"
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          disabled={disabled}
          aria-label={`Amount of ${symbol}`}
          className="w-full bg-transparent text-market-text outline-none placeholder:text-market-text-muted disabled:opacity-50"
        />
        <button
          type="button"
          onClick={() => onChange(String(maxQuantity))}
          disabled={disabled}
          className="shrink-0 rounded-md border border-market-border px-2 py-1 text-xs font-medium text-market-text-secondary transition-colors hover:text-market-text focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-market-text-secondary disabled:opacity-50"
        >
          MAX
        </button>
      </div>
    </div>
  );
}
