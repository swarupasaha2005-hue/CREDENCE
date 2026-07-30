"use client"
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="border-t border-white/[0.06] pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-12 mb-16">
          
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative h-8">
                <Image 
                  src="/images/cred_logo.png" 
                  alt="Credence Logo" 
                  width={100} 
                  height={32} 
                  className="h-8 w-auto opacity-0"
                  priority
                />
                <div 
                  className="absolute inset-0 bg-[#E88DAF]" 
                  style={{ 
                    WebkitMaskImage: 'url(/images/cred_logo.png)',
                    WebkitMaskSize: 'contain',
                    WebkitMaskRepeat: 'no-repeat',
                    WebkitMaskPosition: 'left center',
                    maskImage: 'url(/images/cred_logo.png)',
                    maskSize: 'contain',
                    maskRepeat: 'no-repeat',
                    maskPosition: 'left center'
                  }} 
                />
              </div>
              <div>
                <h2 className="font-sans font-semibold text-base tracking-tight text-[#FFFFFF] leading-tight">CREDENCE</h2>
                <p className="font-sans text-[9px] text-white/[0.65] tracking-widest uppercase">Lending Reimagined</p>
              </div>
            </div>
            <p className="text-sm text-white/[0.65] leading-relaxed max-w-xs font-light">
              A decentralized liquidity protocol built on Stellar Soroban.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold text-[#FFFFFF] text-sm mb-6">Products</h3>
            <ul className="space-y-4 text-sm text-white/[0.65] font-light">
              <li><Link href="#" className="hover:text-[#E88DAF] transition-colors duration-200">Markets</Link></li>
              <li><Link href="#" className="hover:text-[#E88DAF] transition-colors duration-200">Borrow</Link></li>
              <li><Link href="#" className="hover:text-[#E88DAF] transition-colors duration-200">Earn</Link></li>
              <li><Link href="#" className="hover:text-[#E88DAF] transition-colors duration-200">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[#FFFFFF] text-sm mb-6">Resources</h3>
            <ul className="space-y-4 text-sm text-white/[0.65] font-light">
              <li><Link href="#" className="hover:text-[#E88DAF] transition-colors duration-200">Docs</Link></li>
              <li><Link href="#" className="hover:text-[#E88DAF] transition-colors duration-200">Blog</Link></li>
              <li><Link href="#" className="hover:text-[#E88DAF] transition-colors duration-200">Security</Link></li>
              <li><Link href="#" className="hover:text-[#E88DAF] transition-colors duration-200">FAQ</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[#FFFFFF] text-sm mb-6">Developers</h3>
            <ul className="space-y-4 text-sm text-white/[0.65] font-light">
              <li><Link href="#" className="hover:text-[#E88DAF] transition-colors duration-200">API</Link></li>
              <li><Link href="#" className="hover:text-[#E88DAF] transition-colors duration-200">SDK</Link></li>
              <li><Link href="#" className="hover:text-[#E88DAF] transition-colors duration-200">GitHub</Link></li>
              <li><Link href="#" className="hover:text-[#E88DAF] transition-colors duration-200">Integrations</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-[#FFFFFF] text-sm mb-6">Community</h3>
            <ul className="space-y-4 text-sm text-white/[0.65] font-light">
              <li><Link href="#" className="hover:text-[#E88DAF] transition-colors duration-200">Discord</Link></li>
              <li><Link href="#" className="hover:text-[#E88DAF] transition-colors duration-200">Twitter</Link></li>
              <li><Link href="#" className="hover:text-[#E88DAF] transition-colors duration-200">Forum</Link></li>
              <li><Link href="#" className="hover:text-[#E88DAF] transition-colors duration-200">Events</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/[0.06]">
          <p className="text-xs text-white/[0.65] font-light">© 2026 Credence. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
