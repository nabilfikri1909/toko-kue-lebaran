'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useOrderHistoryStore } from '@/lib/orderStore';
import { useAuthStore } from '@/lib/authStore';
import { Order, OrderStatus } from '@/lib/types';
import { formatRupiah, formatWeight } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectOrder?: (order: Order) => void;
}

export default function MyOrdersModal({ isOpen, onClose, onSelectOrder }: MyOrdersModalProps) {
  const prefersReduced = useReducedMotion();
  const localOrders = useOrderHistoryStore((s) => s.orders);
  const updateOrderStatus = useOrderHistoryStore((s) => s.updateOrderStatus);
  const user = useAuthStore((s) => s.user);

  const [orders, setOrders] = useState<Order[]>(localOrders);

  // Sync with local store
  useEffect(() => {
    setOrders(localOrders);
  }, [localOrders]);

  // Query Supabase for updated orders if user is logged in
  useEffect(() => {
    if (!isOpen) return;

    if (isSupabaseConfigured && user) {
      const fetchUserOrders = async () => {
        try {
          const sanitizedContact = user.contact.replace(/[^a-zA-Z0-9@.+_-]/g, '');
          const { data } = await supabase
            .from('orders')
            .select('*, order_items(*)')
            .or(`customer_phone.eq.${sanitizedContact},customer_email.eq.${sanitizedContact}`)
            .order('created_at', { ascending: false });

          if (data && data.length > 0) {
            interface SupabaseOrderRow extends Order {
              order_items?: Order['items'];
            }
            const mappedSupabaseOrders = (data as unknown as SupabaseOrderRow[]).map((o) => ({
              ...o,
              order_note: o.greeting_card_note || o.order_note,
              items: (o.order_items && o.order_items.length > 0) ? o.order_items : [],
            }));

            const combinedMap = new Map<string, Order>();
            localOrders.forEach((lo) => combinedMap.set(lo.order_number, lo));
            mappedSupabaseOrders.forEach((so) => {
              const existing = combinedMap.get(so.order_number);
              combinedMap.set(so.order_number, {
                ...existing,
                ...so,
                items: (so.items && so.items.length > 0) ? so.items : (existing?.items || []),
              } as Order);
            });

            setOrders(
              Array.from(combinedMap.values()).sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
              )
            );
          }
        } catch {
          // Fallback to local orders
        }
      };

      fetchUserOrders();

      // Subscribe to real-time order updates
      const channel = supabase
        .channel('user-orders-realtime')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          (payload) => {
            const updated = payload.new as Order;
            if (updated) {
              updateOrderStatus(updated.order_number, updated.order_status);
              setOrders((prev) =>
                prev.map((o) => (o.order_number === updated.order_number ? { ...o, ...updated } : o))
              );
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isOpen, user, updateOrderStatus, localOrders]);

  const getStatusStep = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return 1;
      case 'processing':
        return 2;
      case 'shipped':
        return 3;
      case 'delivered':
      case 'completed' as unknown:
        return 4;
      default:
        return 1;
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
      case 'confirmed':
        return { label: 'Pesanan Diterima', color: 'bg-honey/15 text-honey border-honey/30' };
      case 'processing':
        return { label: 'Pesanan Sedang Dibuat', color: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'shipped':
        return { label: 'Pesanan Sedang Diantar', color: 'bg-palm/15 text-palm border-palm/30' };
      case 'delivered':
      case 'completed' as unknown:
        return { label: 'Pesanan Selesai', color: 'bg-green-100 text-green-800 border-green-300' };
      case 'cancelled':
        return { label: 'Dibatalkan', color: 'bg-red-100 text-red-800 border-red-300' };
      default:
        return { label: status, color: 'bg-cocoa/10 text-cocoa border-cocoa/20' };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            className="relative w-full max-w-2xl bg-white rounded-modal shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10"
          >
            <div className="px-6 py-4 border-b border-cocoa/10 flex items-center justify-between bg-cream/40">
              <div>
                <h2 className="font-playfair text-lg font-semibold text-cocoa">Pesanan Saya</h2>
                <p className="text-xs text-cocoa/60 mt-0.5">
                  {user ? `Akun: ${user.name} (${user.contact})` : 'Riwayat pesanan di perangkat ini'}
                </p>
              </div>
              <button
                onClick={onClose}
                aria-label="Tutup daftar pesanan"
                className="w-9 h-9 flex items-center justify-center rounded-button text-cocoa/60 hover:text-cocoa hover:bg-cocoa/5"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto p-6 space-y-4">
              {orders.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-cream flex items-center justify-center text-3xl mx-auto">
                    📦
                  </div>
                  <h3 className="font-playfair font-semibold text-base text-cocoa">Belum Ada Pesanan</h3>
                  <p className="text-xs text-cocoa/60 max-w-xs mx-auto">
                    Kue kering Lebaran yang Anda checkout akan langsung muncul di sini beserta progres pembuatannya di dapur.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-2 px-6 h-10 bg-honey text-cream text-xs font-semibold rounded-button hover:bg-honey/90 transition-colors"
                  >
                    Pilih Kue Sekarang
                  </button>
                </div>
              ) : (
                orders.map((order) => {
                  const badge = getStatusBadge(order.order_status);
                  const currentStep = getStatusStep(order.order_status);

                  return (
                    <article
                      key={order.order_number}
                      className="border border-cocoa/12 rounded-card p-4 bg-cream/30 space-y-3 hover:border-cocoa/25 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cocoa/10 pb-3">
                        <div>
                          <span className="font-mono text-xs font-bold text-cocoa">{order.order_number}</span>
                          <p className="text-[11px] text-cocoa/50 mt-0.5">
                            {new Date(order.created_at).toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>

                      {/* Visual Process Status Stepper */}
                      <div className="py-2">
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className={`p-2 rounded-button text-xs transition-colors ${
                            currentStep >= 1 ? 'bg-honey/15 text-cocoa font-semibold' : 'bg-white/60 text-cocoa/40'
                          }`}>
                            <span className="block text-base mb-1">📝</span>
                            <span>1. Pesanan Diterima</span>
                          </div>
                          <div className={`p-2 rounded-button text-xs transition-colors ${
                            currentStep >= 2 ? 'bg-amber-100 text-amber-900 font-semibold' : 'bg-white/60 text-cocoa/40'
                          }`}>
                            <span className="block text-base mb-1">🔥</span>
                            <span>2. Sedang Dibuat</span>
                          </div>
                          <div className={`p-2 rounded-button text-xs transition-colors ${
                            currentStep >= 3 ? 'bg-palm/20 text-palm font-semibold' : 'bg-white/60 text-cocoa/40'
                          }`}>
                            <span className="block text-base mb-1">🛵</span>
                            <span>3. Sedang Diantar</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-cocoa/10 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div
                            className="bg-honey h-full transition-all duration-500 rounded-full"
                            style={{
                              width: currentStep === 1 ? '33%' : currentStep === 2 ? '66%' : '100%',
                            }}
                          />
                        </div>
                      </div>

                      {/* Note Pesanan & Details */}
                      <div className="bg-white/80 p-3 rounded-button border border-cocoa/8 text-xs space-y-1.5">
                        {order.order_note && (
                          <div className="flex gap-2">
                            <span className="font-semibold text-cocoa shrink-0">Note Pesanan:</span>
                            <span className="text-cocoa/80 italic">{order.order_note}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-cocoa/70">
                          <span>Penerima: {order.customer_name}</span>
                          <span>Berat: {formatWeight(order.total_weight_grams)}</span>
                        </div>
                        <div className="flex justify-between items-baseline pt-1 border-t border-cocoa/8">
                          <span className="font-medium text-cocoa">Total Bayar:</span>
                          <span className="font-playfair text-sm font-bold text-honey">
                            {formatRupiah(order.total_price)}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => {
                            onClose();
                            onSelectOrder?.(order);
                          }}
                          className="text-xs font-semibold text-honey hover:text-honey/80 transition-colors inline-flex items-center gap-1"
                        >
                          <span>Buka Detail Pelacakan Maskot</span>
                          <span>→</span>
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
