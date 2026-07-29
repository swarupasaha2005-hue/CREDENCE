"use client";

import { useState } from "react";
import { MarketData } from "../../../packages/interfaces/src";

export function AssetBadge({ market }: { market: MarketData }) {
  const [iconFailed, setIconFailed] = useState(false);

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-market-surface-hover">
        {!iconFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={market.iconUrl}
            alt={`${market.name} icon`}
            className="h-full w-full object-cover"
            onError={() => setIconFailed(true)}
          />
        ) : (
          <span className="text-xs font-medium text-market-text-secondary">
            {market.symbol.slice(0, 2)}
          </span>
        )}
      </div>
      <div className="flex flex-col leading-tight">
        <span className="font-medium text-market-text">{market.symbol}</span>
        <span className="text-xs text-market-text-muted transition-colors duration-200 group-hover:text-market-text-secondary">
          {market.name}
        </span>
      </div>
    </div>
  );
}
