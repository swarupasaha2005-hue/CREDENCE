"use client"
import React from 'react';
import { Button } from '../ui/button';
import Image from 'next/image';

const stats = [
  { label: "Total Value Locked", value: "$12.84M", change: "+ 8.24%" },
  { label: "Total Borrowed", value: "$4.23M", change: "+ 6.71%" },
  { label: "Active Users", value: "2,318", change: "+ 5.35%" },
  { label: "Utilization Rate", value: "63.42%", change: "+ 2.14%" },
];

const FinalCTASection = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="bg-gradient-to-br from-gray-50 to-white border border-border rounded-[40px] p-8 md:p-16 relative overflow-hidden shadow-sm">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
            
            {/* Left Image Thumbnail */}
            <div className="hidden lg:block lg:col-span-3 h-48 relative">
              <Image 
                 src="/images/credence_hero.png" 
                 alt="Credence Coin" 
                 fill 
                 className="object-contain object-left scale-150 -translate-x-4"
              />
            </div>

            {/* Center Content */}
            <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
              <h2 className="font-serif text-4xl md:text-5xl text-dark leading-tight mb-4">
                The future of lending is here.
              </h2>
              <p className="text-sm text-text-secondary mb-10 max-w-md">
                Join thousands of users building the future of finance on Stellar.
              </p>
            </div>

            {/* Right Button */}
            <div className="lg:col-span-3 flex justify-center lg:justify-end">
              <Button size="lg" className="rounded-full shadow-lg shadow-primary/20 bg-dark text-white hover:bg-dark/90 group w-full md:w-auto">
                Launch App
                <span className="ml-2 group-hover:translate-x-1 transition-transform">↗</span>
              </Button>
            </div>
          </div>

          {/* Bottom Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-12 border-t border-border/50 relative z-10">
            {stats.map((stat, i) => (
              <div key={i} className="flex flex-col">
                <span className="text-2xl md:text-3xl font-bold text-dark mb-1">{stat.value}</span>
                <span className="text-xs font-medium text-text-secondary mb-2">{stat.label}</span>
                <span className="text-xs font-medium text-success">
                  {stat.change} <span className="text-text-secondary/60">this week</span>
                </span>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
};

export default FinalCTASection;
