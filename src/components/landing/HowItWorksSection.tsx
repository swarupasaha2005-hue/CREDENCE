"use client"
import React from 'react';
import { LineChart, Sparkles, RefreshCcw, Download } from 'lucide-react';

const steps = [
  {
    num: "1",
    title: "Supply",
    desc: "Deposit your assets into Credence.",
    icon: <LineChart className="w-5 h-5 text-primary" />,
  },
  {
    num: "2",
    title: "Earn",
    desc: "Earn yield as your assets are utilized in markets.",
    icon: <Sparkles className="w-5 h-5 text-primary" />,
  },
  {
    num: "3",
    title: "Borrow",
    desc: "Borrow against your collateral instantly.",
    icon: <RefreshCcw className="w-5 h-5 text-primary" />,
  },
  {
    num: "4",
    title: "Repay & Withdraw",
    desc: "Repay loans and withdraw your assets anytime.",
    icon: <Download className="w-5 h-5 text-primary" />,
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="mb-16">
          <p className="text-xs font-bold tracking-widest text-primary uppercase mb-4">
            HOW IT WORKS
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-dark leading-tight">
            Simple. Secure. Powerful.
          </h2>
        </div>

        <div className="relative">
          {/* Dotted Line */}
          <div className="hidden md:block absolute top-8 left-12 right-12 h-[2px] bg-border border-t-2 border-dotted border-gray-300 -z-10"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-start bg-white relative">
                <div className="w-16 h-16 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center mb-6 relative">
                  {step.icon}
                  {/* Step Number Badge */}
                  <div className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-white border border-border flex items-center justify-center text-xs font-bold text-dark shadow-sm">
                    {step.num}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-dark mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed max-w-[200px]">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default HowItWorksSection;
