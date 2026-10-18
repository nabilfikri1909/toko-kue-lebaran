'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useCartStore } from '@/lib/store';
import { useAuthStore } from '@/lib/authStore';
import { useOrderHistoryStore } from '@/lib/orderStore';
import { formatRupiah, formatWeight } from '@/lib/utils';
import { Order } from '@/lib/types';

const checkoutSchema = z.object({
  customer_name: z.string().min(3, 'Nama lengkap minimal 3 karakter'),
  customer_phone: z
    .string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,10}$/, 'Nomor WhatsApp tidak valid (contoh: 08123456789)'),
  delivery_type: z.enum(['DELIVERY', 'PICKUP']),
  customer_address: z.string().optional(),
  order_note: z.string().max(250, 'Maksimal 250 karakter').optional(),
  payment_method: z.enum(['QRIS', 'COD']),
}).refine(
  (data) => {
    if (data.delivery_type === 'DELIVERY') {
      return Boolean(data.customer_address && data.customer_address.trim().length >= 8);
    }
    return true;
  },
  {
    message: 'Alamat pengiriman lengkap wajib diisi minimal 8 karakter',
    path: ['customer_address'],
  }
);

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (order: Order) => void;
}

export default function CheckoutModal({ isOpen, onClose, onOrderSuccess }: CheckoutModalProps) {
  const prefersReduced = useReducedMotion();
  const items = useCartStore((s) => s.items);
  const cartOrderNote = useCartStore((s) => s.orderNote);
  const getTotalPrice = useCartStore((s) => s.getTotalPrice);
  const getTotalWeight = useCartStore((s) => s.getTotalWeight);
  const clearCart = useCartStore((s) => s.clearCart);

  const user = useAuthStore((s) => s.user);
  const addOrderToHistory = useOrderHistoryStore((s) => s.addOrder);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    delivery_type: 'DELIVERY' as 'DELIVERY' | 'PICKUP',
    customer_address: '',
    order_note: '',
    payment_method: 'QRIS' as 'QRIS' | 'COD',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill from user profile and cart orderNote
  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        customer_name: prev.customer_name || user?.name || '',
        customer_phone: prev.customer_phone || (user?.type === 'phone' ? user.contact : ''),
        order_note: prev.order_note || cartOrderNote || '',
      }));
    }
  }, [isOpen, user, cartOrderNote]);

  const sanitizePhone = (raw: string) => {
    let cleaned = raw.replace(/[^0-9+]/g, '');
    if (cleaned.startsWith('+62')) cleaned = '0' + cleaned.slice(3);
    else if (cleaned.startsWith('62')) cleaned = '0' + cleaned.slice(2);
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const normalizedFormData = {
      ...formData,
      customer_phone: sanitizePhone(formData.customer_phone),
    };

    const result = checkoutSchema.safeParse(normalizedFormData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: normalizedFormData.customer_name,
          customer_phone: normalizedFormData.customer_phone,
          customer_email: user?.type === 'email' ? user.contact : null,
          delivery_type: normalizedFormData.delivery_type,
          customer_address:
            normalizedFormData.delivery_type === 'DELIVERY'
              ? normalizedFormData.customer_address
              : 'Ambil di Toko Fisik (Depok: https://maps.app.goo.gl/bh5CTmGDvAKyjH3Y6)',
          order_note: normalizedFormData.order_note || null,
          payment_method: normalizedFormData.payment_method,
          items: items.map((i) => ({
            variant_id: i.variant.id,
            quantity: i.quantity,
          })),
        }),
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        setErrors({ general: resData.error || 'Gagal memproses pesanan' });
        setIsSubmitting(false);
        return;
      }

      const createdOrder: Order = resData.data;
      addOrderToHistory(createdOrder);
      clearCart();
      setIsSubmitting(false);
      onClose();
      onOrderSuccess(createdOrder);
    } catch {
      setErrors({ general: 'Terjadi kendala jaringan saat memproses pesanan.' });
      setIsSubmitting(false);
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
            className="relative w-full max-w-lg bg-white rounded-modal shadow-2xl overflow-hidden max-h-[90vh] flex flex-col z-10"
          >
            <div className="px-6 py-4 border-b border-cocoa/10 flex items-center justify-between bg-cream/30">
              <div>
                <h2 className="font-playfair text-lg font-semibold text-cocoa">Konfirmasi Pemesanan</h2>
                <p className="text-xs text-cocoa/60 mt-0.5">Lengkapi data untuk pengantaran kue Lebaran Anda</p>
              </div>
              <button
                onClick={onClose}
                aria-label="Tutup form pemesanan"
                className="w-9 h-9 flex items-center justify-center rounded-button text-cocoa/60 hover:text-cocoa hover:bg-cocoa/5"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4">
              {user && (
                <div className="p-3 bg-cream/70 border border-cocoa/15 rounded-card flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    {user.avatar_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full border border-honey object-cover" />
                    ) : (

                      <div className="w-8 h-8 rounded-full bg-honey/20 text-honey flex items-center justify-center font-bold">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-cocoa">{user.name}</p>
                      <p className="text-[11px] text-cocoa/60">
                        {user.contact} ({user.type === 'google' ? 'Google' : 'Akun Terverifikasi'})
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-palm bg-palm/10 px-2 py-0.5 rounded-full">
                    Terverifikasi
                  </span>
                </div>
              )}

              {errors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-card text-xs text-red-700 font-medium">
                  ⚠️ {errors.general}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-cocoa mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  placeholder="Contoh: Fatimah Azzahra"
                  className="w-full h-11 px-3.5 bg-cream/40 border border-cocoa/20 rounded-button text-sm text-cocoa placeholder:text-cocoa/40 focus:ring-2 focus:ring-honey focus:border-transparent outline-none"
                />
                {errors.customer_name && <p className="text-red-600 text-xs mt-1">{errors.customer_name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-cocoa mb-1">Nomor WhatsApp Aktif</label>
                <input
                  type="tel"
                  required
                  value={formData.customer_phone}
                  onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                  placeholder="Contoh: 08123456789"
                  className="w-full h-11 px-3.5 bg-cream/40 border border-cocoa/20 rounded-button text-sm text-cocoa placeholder:text-cocoa/40 focus:ring-2 focus:ring-honey focus:border-transparent outline-none"
                />
                {errors.customer_phone && <p className="text-red-600 text-xs mt-1">{errors.customer_phone}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-cocoa mb-1">Metode Pengambilan</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, delivery_type: 'DELIVERY' })}
                    className={`h-11 text-xs font-medium rounded-button border transition-colors ${
                      formData.delivery_type === 'DELIVERY'
                        ? 'bg-honey text-cream border-honey font-semibold'
                        : 'bg-white border-cocoa/20 text-cocoa/80 hover:bg-cream'
                    }`}
                  >
                    Kirim ke Rumah
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, delivery_type: 'PICKUP' })}
                    className={`h-11 text-xs font-medium rounded-button border transition-colors ${
                      formData.delivery_type === 'PICKUP'
                        ? 'bg-honey text-cream border-honey font-semibold'
                        : 'bg-white border-cocoa/20 text-cocoa/80 hover:bg-cream'
                    }`}
                  >
                    Ambil di Toko
                  </button>
                </div>
              </div>

              {formData.delivery_type === 'PICKUP' && (
                <div className="p-3 bg-cream/70 border border-honey/40 rounded-card text-xs text-cocoa">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-palm flex items-center gap-1.5">
                        <span>📍</span> Lokasi Dapur Toko: Depok
                      </p>
                      <p className="text-cocoa/70 mt-1">
                        Kue dapat diambil langsung di dapur kami di Depok. Hubungi WhatsApp <strong>0811839280</strong> saat tiba.
                      </p>
                    </div>
                    <a
                      href="https://maps.app.goo.gl/bh5CTmGDvAKyjH3Y6"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-2.5 py-1.5 bg-honey text-cream text-[11px] font-semibold rounded-button hover:bg-honey/90 transition-colors"
                    >
                      Buka Maps ↗
                    </a>
                  </div>
                </div>
              )}

              {formData.delivery_type === 'DELIVERY' && (
                <div>
                  <label className="block text-xs font-semibold text-cocoa mb-1">Alamat Pengiriman & Patokan</label>
                  <textarea
                    rows={2}
                    value={formData.customer_address}
                    onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
                    placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, dan patokan"
                    className="w-full p-3 bg-cream/40 border border-cocoa/20 rounded-button text-sm text-cocoa placeholder:text-cocoa/40 focus:ring-2 focus:ring-honey focus:border-transparent outline-none resize-none"
                  />
                  {errors.customer_address && <p className="text-red-600 text-xs mt-1">{errors.customer_address}</p>}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-cocoa mb-1 flex items-center justify-between">
                  <span>Note Pesanan</span>
                  <span className="text-cocoa/40 font-normal">Opsional</span>
                </label>
                <input
                  type="text"
                  value={formData.order_note}
                  onChange={(e) => setFormData({ ...formData, order_note: e.target.value })}
                  placeholder="Catatan pesanan atau tulisan kartu ucapan Idulfitri..."
                  className="w-full h-11 px-3.5 bg-cream/40 border border-cocoa/20 rounded-button text-sm text-cocoa placeholder:text-cocoa/40 focus:ring-2 focus:ring-honey focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-cocoa mb-1">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_method: 'QRIS' })}
                    className={`h-11 text-xs font-medium rounded-button border transition-colors flex items-center justify-center gap-1.5 ${
                      formData.payment_method === 'QRIS'
                        ? 'bg-palm text-cream border-palm font-semibold'
                        : 'bg-white border-cocoa/20 text-cocoa/80 hover:bg-cream'
                    }`}
                  >
                    <span>QRIS Dinamis</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, payment_method: 'COD' })}
                    className={`h-11 text-xs font-medium rounded-button border transition-colors ${
                      formData.payment_method === 'COD'
                        ? 'bg-palm text-cream border-palm font-semibold'
                        : 'bg-white border-cocoa/20 text-cocoa/80 hover:bg-cream'
                    }`}
                  >
                    Bayar di Tempat (COD)
                  </button>
                </div>
              </div>

              <div className="bg-cream/70 rounded-card p-3 space-y-1.5 text-xs text-cocoa/70 border border-cocoa/10">
                <div className="flex justify-between">
                  <span>Total Berat</span>
                  <span className="font-medium text-cocoa">{formatWeight(getTotalWeight())}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-cocoa pt-1 border-t border-cocoa/10">
                  <span>Total Pembayaran</span>
                  <span className="text-honey font-playfair text-base">{formatRupiah(getTotalPrice())}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-honey hover:bg-honey/90 text-cream font-semibold rounded-button text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin text-lg">🍪</span>
                    <span>Menyiapkan Pesanan...</span>
                  </span>
                ) : (
                  <span>Kirim Pesanan Sekarang</span>
                )}
              </button>

            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
