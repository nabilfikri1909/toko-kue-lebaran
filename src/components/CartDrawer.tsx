'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useCartStore } from '@/lib/store';
import { useAuthStore } from '@/lib/authStore';
import { formatRupiah, formatWeight } from '@/lib/utils';
import { ProductVariant } from '@/lib/types';


interface CartDrawerProps {
  onProceedToCheckout?: () => void;
}

export default function CartDrawer({ onProceedToCheckout }: CartDrawerProps) {
  const prefersReduced = useReducedMotion();
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const items = useCartStore((s) => s.items);
  const orderNote = useCartStore((s) => s.orderNote);
  const setOrderNote = useCartStore((s) => s.setOrderNote);
  const removeItem = useCartStore((s) => s.removeItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const getTotalPrice = useCartStore((s) => s.getTotalPrice);
  const getTotalWeight = useCartStore((s) => s.getTotalWeight);
  const getTotalItems = useCartStore((s) => s.getTotalItems);

  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);

  const drawerRef = useRef<HTMLDivElement>(null);


  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) closeCart();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, closeCart]);

  // Trap focus inside drawer
  useEffect(() => {
    if (!isOpen) return;
    const el = drawerRef.current;
    if (!el) return;

    const focusable = el.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) focusable[0].focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', trap);
    return () => document.removeEventListener('keydown', trap);
  }, [isOpen, items.length]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const slideVariants = prefersReduced
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        hidden: { x: '100%' },
        visible: { x: 0 },
        exit: { x: '100%' },
      };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-cocoa/40"
            onClick={closeCart}
            aria-hidden="true"
          />

          <motion.div
            ref={drawerRef}
            role="dialog"
            aria-label="Keranjang belanja"
            aria-modal="true"
            variants={slideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white flex flex-col shadow-xl"
          >
            <div className="flex items-center justify-between px-5 h-16 border-b border-cocoa/10 shrink-0">
              <h2 className="font-playfair font-semibold text-lg">Keranjang Belanja</h2>
              <button
                onClick={closeCart}
                aria-label="Tutup keranjang"
                className="flex items-center justify-center w-11 h-11 rounded-button text-cocoa hover:bg-cocoa/5 transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-cocoa/20 mb-4" aria-hidden="true">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                </svg>
                <p className="text-cocoa/60 text-sm leading-relaxed">
                  Belum ada kue di keranjang. Yuk pilih kue favorit Lebaran kamu!
                </p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {items.map((item) => (
                    <CartItemCard
                      key={item.variant.id}
                      item={item}
                      onRemove={() => removeItem(item.variant.id)}
                      onUpdateQuantity={(q) => updateQuantity(item.variant.id, q)}
                    />
                  ))}
                </div>

                <div className="border-t border-cocoa/10 px-5 py-4 space-y-3 shrink-0 bg-cream/30">
                  {/* Note Pesanan Section */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-cocoa flex items-center justify-between">
                      <span>Note Pesanan</span>
                      <span className="text-[11px] text-cocoa/50 font-normal">Opsional</span>
                    </label>
                    <textarea
                      rows={2}
                      value={orderNote}
                      onChange={(e) => setOrderNote(e.target.value)}
                      placeholder="Tulis note pesanan (misal: minta pita warna emas, toples disegel ekstra rapi, ucapan selamat, dll.)..."
                      className="w-full text-xs p-2.5 bg-white border border-cocoa/15 rounded-button text-cocoa placeholder:text-cocoa/40 focus:ring-2 focus:ring-honey focus:border-transparent outline-none resize-none transition-shadow"
                    />
                  </div>

                  <div className="flex justify-between text-sm text-cocoa/60 pt-1">
                    <span>{getTotalItems()} item</span>
                    <span>Perkiraan berat: {formatWeight(getTotalWeight())}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                    <span className="text-sm font-medium">Total</span>
                    <span className="font-playfair font-semibold text-xl">
                      {formatRupiah(getTotalPrice())}
                    </span>
                  </div>
                  {!user ? (
                    <div className="space-y-2">
                      <div className="p-2.5 rounded-card bg-honey/10 border border-honey/20 text-[11px] text-cocoa leading-relaxed flex items-start gap-2">
                        <span className="text-honey text-sm">🔒</span>
                        <span>
                          <strong>Wajib Masuk:</strong> Anda perlu masuk dengan akun Google atau WhatsApp sebelum checkout agar pesanan tercatat di akun Anda.
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          closeCart();
                          openAuthModal();
                        }}
                        className="w-full h-12 bg-honey text-cream font-semibold text-sm rounded-button hover:bg-honey/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
                      >
                        <span>Masuk Akun untuk Memesan</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12h14" />
                          <path d="M12 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        closeCart();
                        onProceedToCheckout?.();
                      }}
                      className="w-full h-12 bg-honey text-cream font-semibold text-sm rounded-button hover:bg-honey/90 transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      <span>Lanjut ke Pembayaran</span>
                      <span className="text-xs opacity-80">({user.name.split(' ')[0]})</span>
                    </button>
                  )}

                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function CartItemCard({
  item,
  onRemove,
  onUpdateQuantity,
}: {
  item: { product: { name: string }; variant: ProductVariant; quantity: number };
  onRemove: () => void;
  onUpdateQuantity: (q: number) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleRemoveClick = useCallback(() => {
    if (confirmDelete) {
      onRemove();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 2000);
    }
  }, [confirmDelete, onRemove]);

  return (
    <div className="flex gap-3 p-3 rounded-card border border-cocoa/8 bg-cream/50">
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-sm font-semibold truncate">{item.product.name}</p>
        <p className="text-xs text-cocoa/50">Toples {item.variant.label}</p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onUpdateQuantity(Math.max(1, item.quantity - 1))}
            disabled={item.quantity <= 1}
            aria-label="Kurangi"
            className="flex items-center justify-center w-8 h-8 rounded-button border border-cocoa/15 text-cocoa hover:bg-cocoa/5 disabled:opacity-30 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <span className="text-sm font-semibold tabular-nums w-6 text-center">{item.quantity}</span>
          <button
            onClick={() => onUpdateQuantity(Math.min(99, item.quantity + 1))}
            disabled={item.quantity >= 99}
            aria-label="Tambah"
            className="flex items-center justify-center w-8 h-8 rounded-button border border-cocoa/15 text-cocoa hover:bg-cocoa/5 disabled:opacity-30 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-col items-end justify-between shrink-0">
        <button
          onClick={handleRemoveClick}
          aria-label={confirmDelete ? 'Konfirmasi hapus' : 'Hapus item'}
          className={`text-xs px-2 py-1 rounded-button transition-colors ${
            confirmDelete
              ? 'text-red-600 bg-red-50 font-medium'
              : 'text-cocoa/40 hover:text-cocoa/70'
          }`}
        >
          {confirmDelete ? 'Yakin hapus?' : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
          )}
        </button>
        <p className="text-sm font-semibold">{formatRupiah(item.variant.price * item.quantity)}</p>
      </div>
    </div>
  );
}
