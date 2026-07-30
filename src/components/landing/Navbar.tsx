"use client"
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Button } from '../ui/button';
import { Activity, X, Copy, RefreshCw, LogOut } from 'lucide-react';
import { useWallet } from '../../context/WalletContext';
import { WalletSelectorModal } from '../wallet/WalletSelectorModal';

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Markets", href: "/markets" },
  { label: "Earn", href: "/earn" },
  { label: "Borrow", href: "/borrow" },
];

const Navbar = () => {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isWalletMenuOpen, setIsWalletMenuOpen] = useState(false);
  const [isWalletSelectorOpen, setIsWalletSelectorOpen] = useState(false);
  const walletMenuRef = useRef<HTMLDivElement>(null);

  const {
    connected,
    connecting,
    shortAddress,
    network,
    disconnect,
    refreshBalances,
    address,
    walletName,
  } = useWallet();

  useEffect(() => {
    if (!isWalletMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (walletMenuRef.current && !walletMenuRef.current.contains(event.target as Node)) {
        setIsWalletMenuOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsWalletMenuOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isWalletMenuOpen]);

  const handleWalletButtonClick = () => {
    if (connected) {
      setIsWalletMenuOpen((open) => !open);
    } else {
      setIsWalletSelectorOpen(true);
    }
  };

  const handleCopyAddress = () => {
    if (address) navigator.clipboard.writeText(address);
  };

  return (
    <nav aria-label="Main Navigation" className="fixed top-0 left-0 right-0 z-50 bg-[#050505] h-[88px]">
      {/* 3-column Grid Layout for Desktop, 2-column for Mobile */}
      <div className="h-full px-6 md:px-8 lg:px-[48px] grid grid-cols-2 md:grid-cols-[1.9fr_auto_1fr] items-center">
        
        {/* Left Column - Branding */}
        <div className="flex items-center justify-start">
          <Link href="/" className="flex items-center gap-[12px] cursor-pointer transition-opacity duration-200 hover:opacity-90">
            <div className="relative h-[42px]">
              {/* Hidden image strictly for sizing the container width automatically */}
              <Image 
                src="/images/cred_logo.png" 
                alt="Credence Logo" 
                width={100} 
                height={42} 
                className="h-[42px] w-auto opacity-0"
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
            <span className="font-sans font-semibold text-[22px] text-[#FFFFFF]">
              Credence
            </span>
          </Link>
        </div>

        {/* Center Column - Navigation */}
        <div className="hidden md:flex items-center justify-center gap-[24px] lg:gap-[48px]">
          {NAV_ITEMS.map(({ label, href }) => {
            const isActive = pathname === href || pathname?.startsWith(`${href}/`);

            return (
              <Link
                key={label}
                href={href}
                className={`group relative text-sm font-medium py-1.5 transition-colors duration-[250ms] ease-out rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E88DAF] focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505] ${
                  isActive ? "text-[#E88DAF]" : "text-white/75 hover:text-[#E88DAF]"
                }`}
              >
                {label}
                {/* Animated Underline (2px center-out) */}
                <span
                  className={`absolute bottom-0 left-1/2 h-[2px] bg-[#E88DAF] rounded-full -translate-x-1/2 transition-all duration-[250ms] ease-out ${
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  }`}
                />
              </Link>
            );
          })}
        </div>

        {/* Right Column - Actions */}
        <div className="flex items-center justify-end gap-3 md:gap-[20px]">
          {/* Stellar Testnet Pill */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] text-white/[0.88] text-xs font-medium cursor-default">
            <span className={`w-2 h-2 rounded-full ${connected && network !== 'TESTNET' ? 'bg-yellow-500' : 'bg-[#E88DAF]'}`} />
            {connected && network !== 'TESTNET' ? 'Wrong Network' : 'Stellar Testnet'}
          </div>

          {/* Connect Wallet Button / Account Menu */}
          <div className="relative" ref={walletMenuRef}>
            <button
              type="button"
              onClick={handleWalletButtonClick}
              disabled={connecting}
              aria-haspopup={connected ? "menu" : undefined}
              aria-expanded={connected ? isWalletMenuOpen : undefined}
              aria-label={connected ? `Wallet menu for ${shortAddress}` : "Connect Wallet"}
              className="rounded-full min-h-[44px] px-5 md:px-7 py-2.5 md:py-3 bg-[#E88DAF] text-[#050505] font-medium text-[14px] md:text-[16px] transition-all duration-[250ms] ease-out hover:bg-[#F3A6C3] hover:-translate-y-[1px] active:bg-[#DD7EA5] active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#050505]"
            >
              {connecting ? "Connecting..." : connected ? shortAddress : "Connect Wallet"}
            </button>

            {connected && isWalletMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 mt-3 w-64 rounded-2xl bg-[#0A0A0A] border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-2 z-50"
              >
                <div className="px-3 py-2.5 border-b border-white/[0.06] mb-1">
                  <p className="text-[11px] uppercase tracking-wide text-[#B7B7B7] mb-1">
                    Connected via {walletName ?? "Wallet"}
                  </p>
                  <p className="font-mono text-sm text-white/[0.88]">{shortAddress}</p>
                </div>
                <div className="px-3 py-2 flex items-center gap-2 text-xs text-[#B7B7B7]">
                  <span className={`w-1.5 h-1.5 rounded-full ${network === 'TESTNET' ? 'bg-[#E88DAF]' : 'bg-yellow-500'}`} />
                  {network === 'TESTNET' ? 'Stellar Testnet' : `Network: ${network ?? 'Unknown'}`}
                </div>

                <button
                  role="menuitem"
                  type="button"
                  onClick={handleCopyAddress}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/[0.88] hover:bg-white/[0.06] transition-colors duration-[200ms]"
                >
                  <Copy className="w-4 h-4" />
                  Copy Address
                </button>

                <button
                  role="menuitem"
                  type="button"
                  onClick={refreshBalances}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-white/[0.88] hover:bg-white/[0.06] transition-colors duration-[200ms]"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Balance
                </button>

                <button
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    disconnect();
                    setIsWalletMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-white/[0.06] transition-colors duration-[200ms]"
                >
                  <LogOut className="w-4 h-4" />
                  Disconnect
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center justify-end ml-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-11 h-11"
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen((open) => !open)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6 text-white" /> : <Activity className="w-6 h-6 text-white" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu panel */}
      {isMobileMenuOpen && (
        <div className="md:hidden px-6 pt-4 pb-2 flex flex-col gap-4 border-t border-white/[0.06] bg-[#050505]">
          {NAV_ITEMS.map(({ label, href }) => {
            const isActive = pathname === href || pathname?.startsWith(`${href}/`);

            return (
              <Link
                key={label}
                href={href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`text-sm font-medium py-2 transition-colors duration-[250ms] ease-out rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E88DAF] ${
                  isActive ? "text-[#E88DAF]" : "text-white/75 hover:text-[#E88DAF]"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}

      <WalletSelectorModal open={isWalletSelectorOpen} onClose={() => setIsWalletSelectorOpen(false)} />
    </nav>
  );
};

export default Navbar;
