"use client"
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Droplet, Shield } from 'lucide-react';
import Image from 'next/image';

const WhyCredenceSection = () => {
  return (
    <section className="py-24 md:py-32 bg-white mt-16 md:mt-24">
      <div className="max-w-7xl mx-auto px-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-start">
          
          {/* Left Side: Text */}
          <div className="lg:col-span-5 lg:pr-12 lg:sticky top-32">
            <p className="text-xs font-bold tracking-widest text-primary uppercase mb-6">
              Why Credence?
            </p>
            <h2 className="font-serif text-5xl md:text-6xl text-dark leading-[1.1] mb-8">
              Capital that works as hard as you do.
            </h2>
            <p className="text-base text-text-secondary mb-10 leading-relaxed">
              Credence unlocks the power of decentralized lending on Stellar. Lend your assets, borrow instantly, and earn competitive yields — in a secure, transparent, and composable protocol.
            </p>
            <button className="flex items-center text-primary font-medium hover:text-primary-hover transition-colors group">
              Learn more about Credence
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Right Side: Grid */}
          <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: Light (Full Width on mobile, spanning 2 cols possibly on tablet, but in standard grid fits normally) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="md:col-span-2 bg-gray-50 rounded-[32px] p-8 md:p-12 border border-border flex flex-col md:flex-row items-center gap-8 overflow-hidden relative group hover:border-primary/20 transition-colors"
            >
              <div className="flex-1 relative z-10">
                <h3 className="text-2xl font-bold text-dark mb-4">Capital that grows</h3>
                <p className="text-sm text-text-secondary leading-relaxed mb-8">
                  Earn passive income as your assets power the Credence protocol and grow with sustainable yield.
                </p>
                <button className="flex items-center text-primary font-medium text-sm group-hover:text-primary-hover transition-colors">
                  Learn more
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
              
              <div className="w-full md:w-1/2 h-[200px] relative mt-8 md:mt-0 flex-shrink-0 flex items-center justify-center">
                 {/* Decorative mock for the flower/coin illustration from reference */}
                 <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-full blur-3xl"></div>
                 <div className="w-32 h-32 bg-gradient-to-tr from-primary to-purple-400 rounded-full opacity-20 blur-xl"></div>
                 <Image 
                    src="/images/credence_hero.png" 
                    alt="Flower Growth" 
                    fill 
                    className="object-contain scale-150 translate-x-12 translate-y-12 drop-shadow-xl"
                 />
              </div>
            </motion.div>

            {/* Card 2: Dark */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="bg-dark rounded-[32px] p-8 md:p-10 flex flex-col h-full relative overflow-hidden group"
            >
              <h3 className="text-2xl font-bold text-white mb-4 z-10">Always liquid, always stable</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-12 z-10">
                Stay fully collateralized with instant access to your funds — no lockups or delays.
              </p>
              <div className="mt-auto self-end w-12 h-12 rounded-full border border-gray-700 flex items-center justify-center text-white group-hover:bg-primary group-hover:border-primary transition-colors z-10">
                <Droplet className="w-5 h-5" />
              </div>
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>
            </motion.div>

            {/* Card 3: Dark */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-dark rounded-[32px] p-8 md:p-10 flex flex-col h-full relative overflow-hidden group"
            >
              <h3 className="text-2xl font-bold text-white mb-4 z-10">100% hands-free</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-12 z-10">
                No need to manage strategies manually. Credence works in the background for you.
              </p>
              <div className="mt-auto self-end w-12 h-12 rounded-full border border-gray-700 flex items-center justify-center text-white group-hover:bg-primary group-hover:border-primary transition-colors z-10">
                <Shield className="w-5 h-5" />
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyCredenceSection;
