interface LoadingSkeletonRowsProps {
  columns: number;
  rows?: number;
}

export function LoadingSkeletonRows({ columns, rows = 4 }: LoadingSkeletonRowsProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-market-border last:border-0">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-4 py-4">
              <div className="h-4 w-20 animate-pulse rounded bg-market-surface-hover" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function LoadingSkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 md:hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-40 animate-pulse rounded-2xl border border-market-border bg-market-surface" />
      ))}
    </div>
  );
}
