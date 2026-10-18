'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useCartStore } from '@/lib/store';
import { useAuthStore } from '@/lib/authStore';
import { useOrderHistoryStore } from '@/lib/orderStore';
import { useAnimationStore } from '@/lib/animationStore';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCartToggle: () => void;
  onAuthToggle?: () => void;
  onOrdersToggle?: () => void;
}

export default function Header({
  searchQuery,
  onSearchChange,
  onCartToggle,
  onAuthToggle,
  onOrdersToggle,
}: HeaderProps) {
  const [isMounted, setIsMounted] = useState(false);
  const totalItems = useCartStore((s) => s.getTotalItems());
  const user = useAuthStore((s) => s.user);
  const ordersCount = useOrderHistoryStore((s) => s.orders.length);
  const isCartBumping = useAnimationStore((s) => s.isCartBumping);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const safeTotalItems = isMounted ? totalItems : 0;
  const safeUser = isMounted ? user : null;
  const safeOrdersCount = isMounted ? ordersCount : 0;

  return (
    <header className="sticky top-0 z-40 bg-cream/95 backdrop-blur-sm border-b border-cocoa/10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-14 md:h-16 gap-3">
          <Link href="/" className="font-playfair text-lg md:text-xl font-semibold text-cocoa shrink-0 hover:opacity-90">
            Dapur Kue Lebaran
          </Link>

          {/* Desktop search */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <SearchInput value={searchQuery} onChange={onSearchChange} />
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            {/* Pesanan Saya Button */}
            <button
              onClick={onOrdersToggle}
              aria-label="Lihat pesanan saya"
              className="relative flex items-center gap-1.5 h-11 px-3 rounded-button text-xs font-semibold text-cocoa/80 hover:text-cocoa hover:bg-cocoa/5 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <span className="hidden sm:inline">Pesanan</span>
              {safeOrdersCount > 0 && (
                <span className="min-w-[18px] h-4.5 flex items-center justify-center rounded-full bg-honey/20 text-honey text-[11px] font-bold px-1 border border-honey/30">
                  {safeOrdersCount}
                </span>
              )}
            </button>

            {/* User Auth Button */}
            <button
              onClick={onAuthToggle}
              aria-label={safeUser ? `Akun ${safeUser.name}` : 'Masuk akun pembeli'}
              className="flex items-center gap-1.5 h-11 px-3 rounded-button text-xs font-semibold text-cocoa/80 hover:text-cocoa hover:bg-cocoa/5 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="hidden sm:inline max-w-[110px] truncate">
                {safeUser ? safeUser.name.split(' ')[0] : 'Masuk'}
              </span>
            </button>

            {/* WhatsApp Contact Button */}
            <a
              href="https://wa.me/62811839280?text=Halo%2C%20saya%20ingin%20bertanya%20tentang%20kue%20Lebaran"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Hubungi via WhatsApp: 0811839280"
              className="hidden lg:flex items-center justify-center w-11 h-11 rounded-button text-palm hover:bg-palm/10 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" />
              </svg>
            </a>

            {/* Cart Button */}
            <motion.button
              id="header-cart-button"
              onClick={onCartToggle}
              animate={
                isCartBumping
                  ? {
                      scale: [1, 1.4, 0.9, 1.2, 1],
                      rotate: [0, -18, 18, -10, 10, 0],
                    }
                  : { scale: 1, rotate: 0 }
              }
              transition={{ duration: 0.45, ease: 'easeOut' }}
              aria-label={`Keranjang belanja, ${safeTotalItems} item`}
              className="relative flex items-center justify-center w-11 h-11 rounded-button text-cocoa hover:bg-cocoa/5 transition-colors"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
              </svg>
              {safeTotalItems > 0 && (
                <motion.span
                  key={safeTotalItems}
                  initial={{ scale: 0.5 }}
                  animate={{ scale: [0.5, 1.3, 1] }}
                  transition={{ duration: 0.3 }}
                  className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-honey text-cream text-xs font-semibold px-1 shadow-sm"
                >
                  {safeTotalItems > 99 ? '99+' : safeTotalItems}
                </motion.span>
              )}
            </motion.button>

          </div>
        </div>

        {/* Mobile search row */}
        <div className="md:hidden pb-3">
          <SearchInput value={searchQuery} onChange={onSearchChange} />
        </div>
      </div>
    </header>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative w-full">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-cocoa/40"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cari kue favorit..."
        aria-label="Cari kue"
        className="w-full h-11 pl-10 pr-4 bg-white border border-cocoa/15 rounded-button text-sm text-cocoa placeholder:text-cocoa/40 focus:outline-none focus:ring-2 focus:ring-honey focus:border-transparent transition-shadow"
      />
    </div>
  );
}
