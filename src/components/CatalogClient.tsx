'use client';

import { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { ProductWithVariants, Order, ProductVariant } from '@/lib/types';
import Header from '@/components/Header';
import StoreInfo from '@/components/StoreInfo';
import CategoryFilter from '@/components/CategoryFilter';
import CookieCard from '@/components/CookieCard';
import CartDrawer from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';
import OrderTrackingModal from '@/components/OrderTrackingModal';
import AuthModal from '@/components/AuthModal';
import MyOrdersModal from '@/components/MyOrdersModal';
import FlyingCookieOverlay from '@/components/FlyingCookieOverlay';
import { useCartStore } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface CatalogClientProps {
  products: ProductWithVariants[];
  isLiveDb?: boolean;
}

export default function CatalogClient({ products: initialProducts, isLiveDb = false }: CatalogClientProps) {
  const [products, setProducts] = useState<ProductWithVariants[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  // Modals state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  const toggleCart = useCartStore((s) => s.toggleCart);

  // Sync products state with props
  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Real-time stock subscription from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const channel = supabase
      .channel('catalog-realtime-stock')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'product_variants' },
        (payload) => {
          const updatedVariant = payload.new as ProductVariant;
          if (!updatedVariant) return;

          setProducts((currentProducts) =>
            currentProducts.map((p) => {
              if (p.id !== updatedVariant.product_id) return p;
              return {
                ...p,
                product_variants: p.product_variants.map((v) =>
                  v.id === updatedVariant.id ? { ...v, stock: updatedVariant.stock } : v
                ),
              };
            })
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = useMemo(() => {
    let result = products;

    if (selectedCategory !== 'Semua') {
      result = result.filter((p) => {
        const cat = selectedCategory.toLowerCase();
        const name = p.name.toLowerCase();
        const desc = (p.description ?? '').toLowerCase();
        const badge = (p.texture_badge ?? '').toLowerCase();

        if (cat === 'kue klasik') {
          return (
            name.includes('nastar') ||
            name.includes('putri salju') ||
            name.includes('lidah kucing') ||
            badge.includes('lembut') ||
            badge.includes('lumer') ||
            badge.includes('crispy')
          );
        }
        if (cat === 'kue gurih') {
          return name.includes('kastengel') || name.includes('sagu') || badge.includes('renyah');
        }
        if (cat === 'kue cokelat') {
          return name.includes('cokelat') || desc.includes('cokelat') || badge.includes('crunchy');
        }
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description ?? '').toLowerCase().includes(q) ||
          (p.texture_badge ?? '').toLowerCase().includes(q)
      );
    }

    return result;
  }, [products, selectedCategory, searchQuery]);

  return (
    <>
      {/* Global Flying Cookie Parabolic Animation Portal */}
      <FlyingCookieOverlay />

      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCartToggle={toggleCart}
        onAuthToggle={() => setIsAuthOpen(true)}
        onOrdersToggle={() => setIsOrdersOpen(true)}
      />
      <StoreInfo />

      {!isLiveDb && (
        <div className="bg-honey/10 border-b border-honey/20 py-2 px-4 text-center text-xs text-cocoa">
          <span className="font-semibold text-honey">Mode Demo:</span> Menampilkan data awal. Hubungkan Supabase di{' '}
          <code className="bg-white/70 px-1 py-0.5 rounded font-mono text-[11px]">.env.local</code> untuk sinkronisasi pesanan & stok langsung.
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Festive Editorial Hero Banner */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-gradient-to-br from-cream via-white to-amber-50/70 p-6 sm:p-8 rounded-3xl border border-honey/20 shadow-sm relative overflow-hidden">
          <div className="lg:col-span-7 space-y-4 z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-honey/15 text-honey text-xs font-bold tracking-wider uppercase">
              <span>🌙 Edisi Spesial Idulfitri 1447 H</span>
            </div>
            <h1 className="font-playfair text-3xl sm:text-4xl lg:text-5xl font-bold text-cocoa leading-[1.18]">
              Kehangatan Kue Lebaran <span className="text-honey italic">Artisanal</span> di Setiap Toples
            </h1>
            <p className="text-cocoa/75 text-sm sm:text-base leading-relaxed max-w-xl">
              Dibuat dengan butter Wisman murni, keju Edam tua pilihan, dan resep warisan keluarga. Rasakan tekstur renyah dan lumer yang memanjakan momen silaturahmi hari raya Anda.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#katalog-kue"
                className="h-11 px-6 bg-honey hover:bg-honey/90 text-cream font-semibold rounded-button text-sm transition-all shadow-md inline-flex items-center gap-2"
              >
                <span>Pilih Kue Sekarang</span>
                <span>↓</span>
              </a>
              <div className="flex items-center gap-2 text-xs text-cocoa/70 bg-white/80 px-3.5 py-2 rounded-button border border-cocoa/10 shadow-sm">
                <span className="text-palm font-bold">✓</span>
                <span>Bebas Pengawet</span>
                <span className="text-cocoa/30">•</span>
                <span className="text-palm font-bold">✓</span>
                <span>Butter Wisman Murni</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border-2 border-honey/20">
              <Image
                src="https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=800&q=80"
                alt="Toples Kue Kering Lebaran Spesial Wisman"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover hover:scale-105 transition-transform duration-700"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-cocoa/60 via-transparent to-transparent flex items-end p-4">
                <div className="text-white">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-300">Resep Warisan</span>
                  <p className="font-playfair text-lg font-bold">Dipanggang Segar Setiap Hari</p>
                </div>
              </div>
            </div>

            {/* Floating Toples Badge */}
            <div className="absolute -bottom-3 -left-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-honey/30 shadow-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-honey/15 flex items-center justify-center text-xl">
                🍪
              </div>
              <div className="text-xs">
                <p className="font-bold text-cocoa">Pilihan 3 Ukuran Toples</p>
                <p className="text-cocoa/60">250g • 350g • 500g</p>
              </div>
            </div>
          </div>
        </section>

        {/* Catalog Section */}
        <section id="katalog-kue" className="space-y-6 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h2 className="font-playfair text-2xl font-bold text-cocoa">Katalog Toples Kue Pilihan</h2>
              <p className="text-xs text-cocoa/60 mt-1">
                Pilih ukuran toples (250g, 350g, 500g) dan klik Masukkan ke Toples untuk memesan
              </p>
            </div>
          </div>

          <CategoryFilter
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />

          {filtered.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-card border border-cocoa/10">
              <p className="text-cocoa/50 text-sm">
                {searchQuery
                  ? `Tidak ada kue yang cocok dengan "${searchQuery}".`
                  : 'Tidak ada kue di kategori ini.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((product) => (
                <CookieCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        {/* Footer & Store Contact Info */}
        <footer className="mt-16 pt-10 pb-8 border-t border-cocoa/10 text-cocoa/80">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <h3 className="font-playfair text-lg font-bold text-cocoa">Dapur Kue Lebaran</h3>
              <p className="text-xs text-cocoa/70 leading-relaxed">
                Kue kering artisanal resep warisan keluarga dengan butter Wisman asli dan keju Edam tua. Dipanggang fresh sesuai urutan antrian.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-semibold text-cocoa">Lokasi Dapur & Toko</h4>
              <p className="text-cocoa/70">Depok, Jawa Barat</p>
              <a
                href="https://maps.app.goo.gl/bh5CTmGDvAKyjH3Y6"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-palm font-semibold hover:underline"
              >
                <span>📍</span> Buka Google Maps (Depok) ↗
              </a>
            </div>

            <div className="space-y-2 text-xs">
              <h4 className="font-semibold text-cocoa">Layanan & Bantuan</h4>
              <p className="text-cocoa/70">Buka Setiap Hari: 08.00 - 17.00 WIB</p>
              <a
                href="https://wa.me/62811839280?text=Halo%20Dapur%20Kue%20Lebaran%2C%20saya%20ingin%20bertanya"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-palm font-semibold hover:underline"
              >
                <span>💬</span> WhatsApp: 0811839280 ↗
              </a>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-cocoa/5 text-center text-[11px] text-cocoa/50">
            © 2026 Dapur Kue Lebaran. Semua hak dilindungi.
          </div>
        </footer>
      </main>

      {/* Cart Drawer with Note Pesanan */}
      <CartDrawer onProceedToCheckout={() => setIsCheckoutOpen(true)} />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onOrderSuccess={(order) => {
          setActiveOrder(order);
          setIsOrdersOpen(false);
        }}
      />

      {/* Realtime Order Tracking Hub */}
      <OrderTrackingModal
        order={activeOrder}
        onClose={() => setActiveOrder(null)}
      />

      {/* Authentication Modal (Google & WhatsApp / Email OTP) */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onOpenOrders={() => {
          setIsAuthOpen(false);
          setIsOrdersOpen(true);
        }}
      />

      {/* My Orders Modal (Status Proses Pesanan Setiap Akun) */}
      <MyOrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        onSelectOrder={(order) => setActiveOrder(order)}
      />
    </>
  );
}
