import { healthFactorTier } from "../../lib/borrow-risk";
import { RiskIndicator } from "./RiskIndicator";

export function HealthFactorBadge({ healthFactor, size = "lg" }: { healthFactor: number; size?: "lg" | "sm" }) {
  const tier = healthFactorTier(healthFactor);
  const display = Number.isFinite(healthFactor) ? healthFactor.toFixed(2) : "—";

  return (
    <div className="flex items-baseline gap-3">
      <span className={`font-medium tabular-nums text-market-text ${size === "lg" ? "text-3xl" : "text-lg"}`}>
        {display}
      </span>
      <RiskIndicator tier={tier} />
    </div>
  );
}
