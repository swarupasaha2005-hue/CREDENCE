import { formatPercent } from "../../lib/market-format";

export function APYBadge({
  bps,
  tone = "supply",
}: {
  bps: number;
  tone?: "supply" | "borrow";
}) {
  const color =
    tone === "supply"
      ? "text-market-text"
      : "text-market-text-secondary transition-colors duration-200 group-hover:text-market-text";
  return <span className={`font-medium tabular-nums ${color}`}>{formatPercent(bps)}</span>;
}
