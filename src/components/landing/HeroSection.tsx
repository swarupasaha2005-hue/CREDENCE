"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/button';
import Image from 'next/image';
import Link from 'next/link';

const HeroSection = () => {
  return (
    <section className="relative min-h-screen pt-[88px] pb-20 flex flex-col items-center justify-center overflow-hidden">
      
      <div className="relative max-w-7xl mx-auto px-6 w-full flex items-center justify-center">
        
        {/* Flower Anchor (Background Layer) - Anchored strictly to the center of this container */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3, y: [0, -5, 0] }}
          transition={{ 
            opacity: { duration: 1.5, ease: "easeOut" },
            y: { repeat: Infinity, duration: 12, ease: "easeInOut" }
          }}
          className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
        >
          <div className="relative w-full max-w-[280px] sm:max-w-[400px] md:max-w-[600px] lg:max-w-[750px] aspect-square">
            <Image 
              src="/images/cred_herooo.png" 
              alt="Credence Signature Flower" 
              fill
              unoptimized
              className="object-contain object-center"
              priority
            />
          </div>
        </motion.div>

        {/* Typography & CTA (Foreground Layer) */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="relative z-10 flex flex-col items-center text-center w-full"
        >
          <h1 className="font-sans text-[44px] sm:text-[52px] md:text-[64px] lg:text-[84px] xl:text-[96px] leading-[1.05] md:leading-none text-[#FAFAFA] font-light tracking-[-0.03em] mb-6 md:mb-8 w-full max-w-[1200px]">
            Lend. Borrow. <span className="text-[#E88DAF]">Earn.</span>
          </h1>
          
          <p className="text-[15px] sm:text-[16px] md:text-[18px] text-[#B7B7B7] mb-8 md:mb-10 px-6 md:px-0 w-full max-w-[650px] leading-[1.6] font-light tracking-wide">
            Credence is a decentralized liquidity protocol built on Stellar Soroban. Supply your assets, borrow with ease and earn sustainable yield.
          </p>
          
          {/* CTA */}
          <div className="flex items-center justify-center w-full px-6 md:px-0">
            <Button asChild size="lg" className="h-[52px] md:h-14 px-10 text-[15px] font-medium bg-[#FAFAFA] text-[#050505] hover:bg-[#FAFAFA]/90 w-full max-w-[280px] sm:max-w-none sm:w-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E88DAF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]">
              <Link href="/dashboard">Launch App</Link>
            </Button>
          </div>
        </motion.div>

      </div>
    </section>
  );
};

export default HeroSection;
