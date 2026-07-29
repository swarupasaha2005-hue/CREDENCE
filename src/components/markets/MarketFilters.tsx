export type MarketFilter = "all" | "collateral";
export type MarketSort = "supply-desc" | "borrow-desc" | "apy-desc" | "utilization-desc";

const FILTER_OPTIONS: { value: MarketFilter; label: string }[] = [
  { value: "all", label: "All markets" },
  { value: "collateral", label: "Collateral enabled" },
];

const SORT_OPTIONS: { value: MarketSort; label: string }[] = [
  { value: "supply-desc", label: "Total supplied" },
  { value: "borrow-desc", label: "Total borrowed" },
  { value: "apy-desc", label: "Supply APY" },
  { value: "utilization-desc", label: "Utilization" },
];

const selectClass =
  "rounded-lg border border-market-border bg-market-surface px-3 py-2 text-sm text-market-text outline-none focus:border-market-text-secondary";

interface MarketFiltersProps {
  filter: MarketFilter;
  onFilterChange: (filter: MarketFilter) => void;
  sort: MarketSort;
  onSortChange: (sort: MarketSort) => void;
}

export function MarketFilters({ filter, onFilterChange, sort, onSortChange }: MarketFiltersProps) {
  return (
    <div className="flex gap-2">
      <select
        aria-label="Filter markets"
        value={filter}
        onChange={(e) => onFilterChange(e.target.value as MarketFilter)}
        className={selectClass}
      >
        {FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Sort markets"
        value={sort}
        onChange={(e) => onSortChange(e.target.value as MarketSort)}
        className={selectClass}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            Sort: {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
