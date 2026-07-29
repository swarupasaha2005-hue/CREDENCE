"use client"
import React from 'react';
import { ArrowRight } from 'lucide-react';

const Newsletter = () => {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="bg-gray-50 border border-border rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          
          <div className="flex-1">
            <h3 className="font-bold text-dark text-xl mb-2">Stay in the loop</h3>
            <p className="text-sm text-text-secondary max-w-sm">
              Get updates on new features, markets, and protocol developments.
            </p>
          </div>

          <div className="flex-1 w-full max-w-md relative">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="w-full h-14 bg-white border border-border rounded-full pl-6 pr-16 text-sm outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
            />
            <button className="absolute right-2 top-2 bottom-2 w-10 h-10 bg-primary hover:bg-primary-hover text-white rounded-full flex items-center justify-center transition-colors">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Newsletter;
