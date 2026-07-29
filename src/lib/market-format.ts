export function bpsToPercent(bps: number): number {
  return bps / 100;
}

export function formatPercent(bps: number, digits = 2): string {
  return `${bpsToPercent(bps).toFixed(digits)}%`;
}

const LOCALE = "en-US";

export function formatUsd(value: number, digits = 2): string {
  return value.toLocaleString(LOCALE, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
  });
}

export function formatTokenAmount(amount: bigint, decimals: number): number {
  return Number(amount) / 10 ** decimals;
}

export function formatTokenQuantity(amount: bigint, decimals: number, maxDigits = 4): string {
  return formatTokenAmount(amount, decimals).toLocaleString(LOCALE, {
    maximumFractionDigits: maxDigits,
  });
}

export function formatCompactUsdAmount(amount: number): string {
  return amount.toLocaleString(LOCALE, {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  });
}

export function formatCompactUsd(units: bigint, decimals: number, priceUsd: number): string {
  return formatCompactUsdAmount(formatTokenAmount(units, decimals) * priceUsd);
}

export function formatRelativeTime(timestampMs: number, nowMs: number): string {
  if (!timestampMs) return "—";
  const seconds = Math.max(0, Math.round((nowMs - timestampMs) / 1000));
  if (seconds < 1) return "just now";
  if (seconds < 60) return `${seconds} sec ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  return `${hours} hr ago`;
}
