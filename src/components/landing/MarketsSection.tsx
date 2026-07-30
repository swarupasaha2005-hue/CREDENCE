"use client"
import React from 'react';
import { Button } from '../ui/button';
import { useMarkets } from '../../hooks/useMarkets';
import { formatCompactUsd, formatPercent } from '../../lib/market-format';

const MarketsSection = () => {
  const { markets, isLoading, isError } = useMarkets();

  return (
    <section id="markets" className="py-24 bg-gray-50 border-y border-border">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">

        {/* Left Side: Text */}
        <div className="lg:col-span-4">
          <p className="text-xs font-bold tracking-widest text-primary uppercase mb-6">
            LENDING MARKETS
          </p>
          <h2 className="font-serif text-5xl md:text-6xl text-dark leading-[1.1] mb-6">
            Deep liquidity.<br/>Best rates.
          </h2>
          <p className="text-sm text-text-secondary leading-relaxed mb-10">
            Supply assets to earn yield or borrow against your collateral. Transparent rates. Efficient markets.
          </p>
          <Button variant="outline" className="rounded-full bg-white">
            View all markets
          </Button>
        </div>

        {/* Right Side: Table */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 md:p-8 border border-border shadow-sm overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="border-b border-border text-xs text-text-secondary">
                <th className="pb-4 font-medium">Asset</th>
                <th className="pb-4 font-medium text-right">Total Supplied</th>
                <th className="pb-4 font-medium text-right">Total Borrowed</th>
                <th className="pb-4 font-medium text-right">Supply APY</th>
                <th className="pb-4 font-medium text-right">Borrow APY</th>
                <th className="pb-4 font-medium text-right w-32">Utilization</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading &&
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="py-5">
                      <div className="h-5 w-full animate-pulse rounded bg-gray-100" />
                    </td>
                  </tr>
                ))}

              {!isLoading && isError && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-text-secondary">
                    Live market data unavailable right now.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !isError &&
                markets.map((market) => {
                  const utilPercent = market.utilizationBps / 100;
                  return (
                    <tr key={market.symbol} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-dark border border-border">
                          {market.symbol[0]}
                        </div>
                        <span className="font-semibold text-dark text-sm">{market.symbol}</span>
                      </td>
                      <td className="py-5 text-right text-sm text-dark font-medium">
                        {formatCompactUsd(market.totalSupplied, market.decimals, market.priceUsd)}
                      </td>
                      <td className="py-5 text-right text-sm text-dark font-medium">
                        {formatCompactUsd(market.totalBorrowed, market.decimals, market.priceUsd)}
                      </td>
                      <td className="py-5 text-right text-sm text-success font-semibold">
                        {formatPercent(market.supplyApyBps)}
                      </td>
                      <td className="py-5 text-right text-sm text-primary font-semibold">
                        {formatPercent(market.borrowApyBps)}
                      </td>
                      <td className="py-5 text-right">
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-xs font-bold text-dark">{utilPercent.toFixed(2)}%</span>
                          <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full"
                              style={{ width: `${Math.min(100, utilPercent)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

      </div>
    </section>
  );
};

export default MarketsSection;
