import { MarketAction } from "./SupplyBorrowModal";

interface ActionButtonsProps {
  onAction: (action: MarketAction) => void;
}

export function ActionButtons({ onAction }: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onAction("supply")}
        className="rounded-lg bg-market-text px-3 py-1.5 text-xs font-medium text-market-surface transition-opacity hover:opacity-90"
      >
        Supply
      </button>
      <button
        type="button"
        onClick={() => onAction("borrow")}
        className="rounded-lg border border-market-border px-3 py-1.5 text-xs font-medium text-market-text-secondary transition-colors hover:bg-market-surface-hover hover:text-market-text"
      >
        Borrow
      </button>
    </div>
  );
}
