import { RiskTier } from "../../lib/borrow-risk";

const TIER_LABEL: Record<RiskTier, string> = {
  safe: "Safe",
  warning: "Warning",
  danger: "Danger",
};

/**
 * Communicates risk severity through weight/fill rather than new hues,
 * since the theme is restricted to the existing neutral palette.
 */
const TIER_DOT_CLASS: Record<RiskTier, string> = {
  safe: "bg-market-text-muted",
  warning: "border border-market-text-secondary bg-transparent",
  danger: "bg-market-text",
};

export function RiskIndicator({ tier }: { tier: RiskTier }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm transition-colors duration-200">
      <span className={`h-2 w-2 rounded-full ${TIER_DOT_CLASS[tier]}`} aria-hidden="true" />
      <span className="font-medium text-market-text">{TIER_LABEL[tier]}</span>
    </span>
  );
}
