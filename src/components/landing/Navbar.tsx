"use client"
import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import { Activity, X } from 'lucide-react';

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Markets", href: "/markets" },
  { label: "Earn", href: "/earn" },
  { label: "Borrow", href: "/borrow" },
];

const Navbar = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#050505] border-b border-white/[0.06] py-6">
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center cursor-pointer transition-opacity duration-200 hover:opacity-90">
          <div className="relative h-[46px]">
            {/* Hidden image strictly for sizing the container width automatically */}
            <Image 
              src="/images/cred_logo.png" 
              alt="Credence Logo" 
              width={100} 
              height={46} 
              className="h-[46px] w-auto opacity-0"
              priority
            />
            {/* The actual colored mask that fills the container bounds perfectly */}
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
        </Link>

        {/* Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map(({ label, href }) => {
            const isActive = pathname === href || pathname?.startsWith(`${href}/`);

            return (
              <Link
                key={label}
                href={href}
                className={`group relative text-sm font-medium py-1.5 transition-colors duration-[250ms] ease-out ${
                  isActive ? "text-[#E88DAF]" : "text-[#B7B7B7] hover:text-[#E88DAF]"
                }`}
              >
                {label}
                {/* Animated Underline */}
                <span
                  className={`absolute bottom-0 left-1/2 h-[2px] bg-[#E88DAF] rounded-full -translate-x-1/2 transition-all duration-[250ms] ease-out ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="hidden md:flex items-center gap-5">
          {/* Stellar Testnet Pill */}
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-[12px] text-white/[0.88] text-xs font-medium transition-colors duration-[250ms] ease-out hover:bg-white/[0.10] hover:border-[#E88DAF]/25 cursor-default">
            <span className="w-2 h-2 rounded-full bg-[#E88DAF]" />
            Stellar Testnet
          </div>
          
          {/* Connect Wallet Button */}
          <button className="rounded-full px-7 py-3 bg-[#E88DAF] text-[#050505] font-medium text-[16px] shadow-[0_10px_30px_rgba(232,141,175,0.22)] transition-all duration-[250ms] ease-out hover:bg-[#F3A6C3] hover:-translate-y-[1px] active:bg-[#DD7EA5] active:translate-y-0 active:shadow-sm">
            Connect Wallet
          </button>
        </div>

        {/* Mobile menu button (Simplified) */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-6 pt-4 pb-2 flex flex-col gap-4 border-t border-white/[0.06] mt-6">
          {NAV_ITEMS.map(({ label, href }) => {
            const isActive = pathname === href || pathname?.startsWith(`${href}/`);

            return (
              <Link
                key={label}
                href={href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-sm font-medium py-1.5 transition-colors duration-[250ms] ease-out ${
                  isActive ? "text-[#E88DAF]" : "text-[#B7B7B7] hover:text-[#E88DAF]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
