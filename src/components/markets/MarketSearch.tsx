import { Search } from "lucide-react";

interface MarketSearchProps {
  value: string;
  onChange: (value: string) => void;
}

export function MarketSearch({ value, onChange }: MarketSearchProps) {
  return (
    <div className="relative flex-1 sm:max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-market-text-muted" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search markets..."
        aria-label="Search markets"
        className="w-full rounded-lg border border-market-border bg-market-surface py-2 pl-9 pr-3 text-sm text-market-text outline-none placeholder:text-market-text-muted focus:border-market-text-secondary"
      />
    </div>
  );
}
