"use client"
import React from 'react';
import { Button } from '../ui/button';

const markets = [
  { asset: "USDC", totalSupplied: "$5.25M", totalBorrowed: "$3.21M", supplyApy: "4.35%", borrowApy: "6.71%", util: 68.21 },
  { asset: "XLM", totalSupplied: "$2.10M", totalBorrowed: "$885.4K", supplyApy: "2.18%", borrowApy: "4.32%", util: 42.17 },
  { asset: "AQUA", totalSupplied: "$1.52M", totalBorrowed: "$1.16M", supplyApy: "6.24%", borrowApy: "9.18%", util: 76.62 },
  { asset: "yXLM", totalSupplied: "$1.02M", totalBorrowed: "$564.1K", supplyApy: "5.12%", borrowApy: "7.34%", util: 55.21 },
  { asset: "BTC.e", totalSupplied: "$953.8K", totalBorrowed: "$298.1K", supplyApy: "1.75%", borrowApy: "3.85%", util: 31.42 },
];

const MarketsSection = () => {
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
              {markets.map((market, i) => (
                <tr key={i} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="py-5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-dark border border-border">
                      {market.asset[0]}
                    </div>
                    <span className="font-semibold text-dark text-sm">{market.asset}</span>
                  </td>
                  <td className="py-5 text-right text-sm text-dark font-medium">{market.totalSupplied}</td>
                  <td className="py-5 text-right text-sm text-dark font-medium">{market.totalBorrowed}</td>
                  <td className="py-5 text-right text-sm text-success font-semibold">{market.supplyApy}</td>
                  <td className="py-5 text-right text-sm text-primary font-semibold">{market.borrowApy}</td>
                  <td className="py-5 text-right">
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs font-bold text-dark">{market.util}%</span>
                      <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full" 
                          style={{ width: `${market.util}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>
    </section>
  );
};

export default MarketsSection;
