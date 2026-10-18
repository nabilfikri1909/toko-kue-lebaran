'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Order, OrderStatus } from '@/lib/types';
import { formatRupiah } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import Oven3DScene from '@/components/3d/Oven3DScene';


interface OrderTrackingModalProps {
  order: Order | null;
  onClose: () => void;
}

export default function OrderTrackingModal({ order, onClose }: OrderTrackingModalProps) {
  const prefersReduced = useReducedMotion();
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(order?.order_status ?? 'pending');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    if (!order) return;
    setCurrentStatus(order.order_status);

    // Listen to Supabase Realtime channel if available
    if (isSupabaseConfigured) {
      const channel = supabase
        .channel(`order-status-${order.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${order.id}`,
          },
          (payload) => {
            if (payload.new && (payload.new as Order).order_status) {
              setCurrentStatus((payload.new as Order).order_status);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [order]);

  if (!order) return null;

  const copyOrderNumber = () => {
    navigator.clipboard.writeText(order.order_number);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const statusStep = (() => {
    switch (currentStatus) {
      case 'pending':
      case 'confirmed':
        return 1;
      case 'processing':
        return 2;
      case 'shipped':
      case 'delivered':
      case 'completed' as unknown:
        return 3;
      default:
        return 1;
    }
  })();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-cocoa/40 backdrop-blur-sm"
      />

      <motion.div
        initial={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={prefersReduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-lg bg-white rounded-modal shadow-2xl overflow-hidden max-h-[92vh] flex flex-col z-10"
      >
        <div className="px-6 py-4 border-b border-cocoa/10 flex items-center justify-between bg-cream/40">
          <div>
            <h2 className="font-playfair text-lg font-semibold text-cocoa">Pelacakan Pesanan Kue</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xs text-cocoa/60 font-mono font-medium">{order.order_number}</span>
              <button
                onClick={copyOrderNumber}
                className="text-[11px] text-honey hover:underline ml-1"
              >
                {isCopied ? 'Tersalin' : 'Salin'}
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup pelacakan"
            className="w-9 h-9 flex items-center justify-center rounded-button text-cocoa/60 hover:text-cocoa hover:bg-cocoa/5"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {/* Animated Mascot Stage */}
          <div className="bg-cream/60 rounded-card p-6 border border-cocoa/10 flex flex-col items-center text-center">
            <AnimatePresence mode="wait">
              {statusStep === 1 && (
                <motion.div
                  key="step1"
                  initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-honey/20 flex items-center justify-center text-3xl">
                    🍪📝
                  </div>
                  <div>
                    <h3 className="font-playfair font-semibold text-base text-cocoa">Pesanan Diterima Dapur</h3>
                    <p className="text-xs text-cocoa/70 mt-1 max-w-xs">
                      Si Nastar Ceria sedang mencatat detail toples pesananmu dan memeriksa ketersediaan bahan.
                    </p>
                  </div>
                </motion.div>
              )}

              {statusStep === 2 && (
                <motion.div
                  key="step2"
                  initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3 w-full"
                >
                  <Oven3DScene />
                  <div>
                    <h3 className="font-playfair font-semibold text-base text-cocoa">Sedang Dipanggang di Oven</h3>
                    <p className="text-xs text-cocoa/70 mt-1 max-w-xs mx-auto">
                      Aroma wangi mentega Wisman dan keju mulai tercium harum dari loyang oven dapur kami.
                    </p>
                  </div>
                </motion.div>
              )}


              {statusStep === 3 && (
                <motion.div
                  key="step3"
                  initial={prefersReduced ? { opacity: 0 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  <div className="w-20 h-20 mx-auto rounded-full bg-palm/20 flex items-center justify-center text-3xl">
                    🛵🎁
                  </div>
                  <div>
                    <h3 className="font-playfair font-semibold text-base text-cocoa">Kue Siap Dikirim / Diambil</h3>
                    <p className="text-xs text-cocoa/70 mt-1 max-w-xs">
                      Toples sudah tersegel rapi dan siap meluncur ke alamat tujuanmu.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stepper Dots */}
            <div className="flex items-center gap-2 mt-5">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    statusStep >= step ? 'w-8 bg-honey' : 'w-2 bg-cocoa/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* QRIS section if unpaid */}
          {order.payment_status === 'unpaid' && (
            <div className="border border-palm/20 rounded-card p-4 bg-palm/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-palm">Instruksi Pembayaran QRIS</span>
                <span className="text-xs font-bold text-cocoa font-playfair">{formatRupiah(order.total_price)}</span>
              </div>
              <div className="bg-white p-4 rounded-button flex flex-col items-center text-center border border-cocoa/10">
                {/* SVG QR Code Simulation */}
                <svg width="140" height="140" viewBox="0 0 100 100" className="p-1">
                  <rect width="100" height="100" fill="#fff" />
                  <path d="M10 10h30v30h-30zM50 10h10v10h-10zM70 10h20v20h-20zM20 20h10v10h-10zM80 20h10v10h-10zM10 50h10v10h-10zM30 50h20v10h-20zM60 50h10v20h-10zM80 50h10v10h-10zM10 70h30v20h-30zM20 80h10v10h-10zM50 70h20v20h-20zM80 70h10v20h-10z" fill="#2C1A12" />
                </svg>
                <p className="text-[11px] text-cocoa/70 mt-2">
                  Scan QR di atas melalui aplikasi Mobile Banking atau E-Wallet (GoPay, OVO, Dana, ShopeePay)
                </p>
              </div>
            </div>
          )}

          {/* Order Details Summary */}
          <div className="text-xs space-y-2 text-cocoa/80 border-t border-cocoa/10 pt-4">
            <div className="flex justify-between">
              <span className="text-cocoa/60">Penerima</span>
              <span className="font-semibold">{order.customer_name} ({order.customer_phone})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-cocoa/60">Alamat</span>
              <span className="font-medium text-right max-w-[240px] truncate">{order.customer_address}</span>
            </div>
            {order.greeting_card_note && (
              <div className="bg-cream/40 p-2.5 rounded-button text-[11px] italic text-cocoa/80 border border-cocoa/10">
                &ldquo;{order.greeting_card_note}&rdquo;
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-cream/30 border-t border-cocoa/10 text-center">
          <button
            onClick={onClose}
            className="w-full h-11 bg-cocoa text-cream text-xs font-semibold rounded-button hover:bg-cocoa/90 transition-colors"
          >
            Kembali ke Katalog
          </button>
        </div>
      </motion.div>
    </div>
  );
}
