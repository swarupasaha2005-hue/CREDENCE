"use client"
import React from 'react';

const partners = [
  { name: "Stellar", logo: "Stellar" },
  { name: "KuCoin", logo: "KUCOIN" },
  { name: "NGC", logo: "NGC" },
  { name: "NoLimit", logo: "NoLimit" },
  { name: "Anchor", logo: "Anchor Labs" },
  { name: "Octus", logo: "OCTUS" },
  { name: "PaperDog", logo: "PAPERDOG" },
];

const PartnersSection = () => {
  return (
    <section className="py-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="border border-border rounded-full py-8 px-12 bg-white/50 flex flex-col md:flex-row items-center justify-between gap-8 flex-wrap shadow-sm">
          <p className="text-[10px] font-bold tracking-widest text-text-secondary uppercase w-full text-center md:text-left mb-2 md:mb-0 md:w-auto">
            BACKED BY THE BEST ECOSYSTEMS
          </p>
          
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-12 gap-y-6 flex-1">
            {partners.map((partner, i) => (
              <div key={i} className="text-sm font-black text-text-secondary/40 tracking-tighter uppercase grayscale opacity-70 hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
                {/* Mocking Logos with Text for now */}
                {partner.logo}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
