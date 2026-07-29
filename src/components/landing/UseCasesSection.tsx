"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Wallet, ActivitySquare, TerminalSquare } from 'lucide-react';
import Image from 'next/image';

const UseCasesSection = () => {
  return (
    <section className="py-24 bg-gray-50 border-t border-border">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Left Text */}
          <div className="lg:col-span-3">
            <p className="text-xs font-bold tracking-widest text-primary uppercase mb-6">
              USE CASES
            </p>
            <h2 className="font-serif text-4xl md:text-5xl text-dark leading-[1.1] mb-6">
              Built for everyone
            </h2>
            <p className="text-sm text-text-secondary leading-relaxed mb-8">
              Whether you're a lender, borrower or builder, Credence gives you the tools you need.
            </p>
            <button className="flex items-center text-primary font-medium hover:text-primary-hover transition-colors text-sm group">
              View all use cases
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Right Grid */}
          <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            
            {/* Lenders */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl p-8 border border-border shadow-sm flex flex-col h-full z-10"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-dark mb-4">For Lenders</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Earn competitive yield by supplying assets to the protocol and supporting the ecosystem.
              </p>
            </motion.div>

            {/* Borrowers */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl p-8 border border-border shadow-sm flex flex-col h-full z-10"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <ActivitySquare className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-dark mb-4">For Borrowers</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Unlock liquidity without selling your assets. Borrow securely and efficiently.
              </p>
            </motion.div>

            {/* Builders */}
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-white rounded-3xl p-8 border border-border shadow-sm flex flex-col h-full z-10"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
                <TerminalSquare className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-dark mb-4">For Builders</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Integrate Credence into your dApps and build the future of DeFi on Stellar.
              </p>
            </motion.div>

            {/* Decorative Flower on Right */}
            <div className="absolute -right-32 -bottom-24 w-96 h-96 opacity-40 mix-blend-multiply pointer-events-none z-0 hidden lg:block">
              <Image 
                 src="/images/credence_hero.png" 
                 alt="Ornament" 
                 fill 
                 className="object-contain"
              />
            </div>
            
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCasesSection;
