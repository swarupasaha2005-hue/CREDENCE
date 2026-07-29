"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import Image from 'next/image';

const HeroSection = () => {
  return (
    <section className="relative pt-32 pb-32 md:pt-48 md:pb-48 overflow-hidden bg-[#050505] min-h-[90vh] flex items-center justify-center">
      
      {/* Flower Anchor (Background Layer) */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, y: [0, -5, 0] }}
        transition={{ 
          opacity: { duration: 1.5, ease: "easeOut" },
          y: { repeat: Infinity, duration: 12, ease: "easeInOut" }
        }}
        className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
      >
        <div className="relative w-full max-w-[750px] aspect-[4/3] md:aspect-square opacity-90">
          <Image 
            src="/images/cred_heroo.png" 
            alt="Credence Signature Flower" 
            fill
            className="object-contain object-center"
            priority
          />
        </div>
      </motion.div>

      {/* Typography & CTA (Foreground Layer) */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center text-center w-full">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="flex flex-col items-center w-full"
        >
          <h1 className="font-sans text-[72px] md:text-[90px] leading-[1.05] text-[#FAFAFA] font-light tracking-tight mb-8">
            Lend.<br/>
            Borrow.<br/>
            <span className="text-[#E88DAF]">Earn.</span>
          </h1>
          
          <p className="text-[16px] md:text-[18px] text-[#B7B7B7] mb-12 max-w-[650px] leading-[1.6] font-light tracking-wide">
            Credence is a decentralized liquidity protocol built on Stellar Soroban. Supply your assets, borrow with ease and earn sustainable yield.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Button size="lg" className="rounded-full h-14 px-10 text-[15px] font-medium bg-[#FAFAFA] text-[#050505] hover:bg-[#FAFAFA]/90 transition-colors w-full sm:w-auto">
              Launch App
            </Button>
            <Button variant="outline" size="lg" className="rounded-full h-14 px-10 text-[15px] font-medium bg-transparent border-[rgba(250,250,250,.15)] text-[#FAFAFA] hover:bg-[rgba(250,250,250,.05)] transition-colors w-full sm:w-auto">
              Explore Markets
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
