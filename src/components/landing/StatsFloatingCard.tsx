"use client"
import React from 'react';
import { motion } from 'framer-motion';

const stats = [
  { value: "6", label: "Core Contracts" },
  { value: "100+", label: "Integration Tests" },
  { value: "3", label: "Protocol Layers" },
  { value: "Soroban", label: "Powered by Stellar" },
];

const StatsFloatingCard = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="group relative z-30 mx-auto w-full max-w-[1020px] rounded-[32px] px-6 py-5 md:px-14 md:py-5 transition-transform duration-[250ms] ease-out hover:-translate-y-[3px] flex flex-col justify-center"
    >
      {/* Absolute Glass Background Layer */}
      <div
        className="pointer-events-none absolute inset-0 z-0 rounded-[32px]"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.42)',
          backdropFilter: 'blur(32px)',
          WebkitBackdropFilter: 'blur(32px)',
          border: '1px solid rgba(255, 255, 255, 0.55)',
          boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 20px 60px rgba(23, 21, 47, 0.08)'
        }}
      ></div>

      {/* Subtle Noise Texture */}
      <div 
        className="pointer-events-none absolute inset-0 z-0 rounded-[32px] opacity-[0.025]" 
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.85%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
      ></div>

      <div className="relative z-10 grid grid-cols-2 gap-y-6 gap-x-4 md:grid-cols-4 md:gap-y-0 h-full items-center">
        {stats.map((stat, i) => (
          <div
            key={i}
            className={`flex flex-col items-center justify-center text-center ${
              i % 2 !== 0 ? 'border-l border-[rgba(23,21,47,0.06)] md:border-none' : ''
            } ${
              i !== 0 ? 'md:border-l md:border-[rgba(23,21,47,0.06)]' : ''
            }`}
          >
            <span className="mb-2 text-[44px] font-semibold leading-none tracking-tight text-[#17152F] transition-colors duration-[250ms] ease-out group-hover:text-[#6D63FF]">
              {stat.value}
            </span>
            <span className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#707070]">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default StatsFloatingCard;
