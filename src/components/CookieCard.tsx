'use client';

import { useState, useCallback, useReducer, useRef } from 'react';
import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import { ProductWithVariants, ProductVariant } from '@/lib/types';
import { useCartStore } from '@/lib/store';
import { useAnimationStore } from '@/lib/animationStore';
import { formatRupiah } from '@/lib/utils';

interface CookieCardProps {
  product: ProductWithVariants;
}

const JAR_SIZES = ['250g', '350g', '500g'] as const;

const DEFAULT_COOKIE_IMAGES: Record<string, string> = {
  nastar: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?auto=format&fit=crop&w=800&q=80',
  kastengel: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80',
  salju: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  sagu: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=800&q=80',
  cokelat: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80',
  lidah: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80',
};

function resolveCookieImage(product: ProductWithVariants): string {
  if (product.image_url && product.image_url.startsWith('http')) {
    return product.image_url;
  }
  const slug = product.slug.toLowerCase();
  for (const [key, url] of Object.entries(DEFAULT_COOKIE_IMAGES)) {
    if (slug.includes(key)) return url;
  }
  return 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80';
}

export default function CookieCard({ product }: CookieCardProps) {
  const prefersReduced = useReducedMotion();
  const addItem = useCartStore((s) => s.addItem);
  const spawnFlyingCookie = useAnimationStore((s) => s.spawnFlyingCookie);

  const [selectedSize, setSelectedSize] = useState<string>(
    product.product_variants[0]?.label ?? '250g'
  );
  const [quantity, setQuantity] = useState(1);
  const [showFeedback, setShowFeedback] = useState(false);
  const [animKey, bump] = useReducer((x: number) => x + 1, 0);

  // 3D Card Hover Perspective State
  const cardRef = useRef<HTMLElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (prefersReduced || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -5;
    const rotY = ((x - centerX) / centerX) * 5;
    setTilt({ x: rotX, y: rotY });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const selectedVariant = product.product_variants.find((v) => v.label === selectedSize);
  const isOutOfStock = !selectedVariant || selectedVariant.stock === 0;

  const handleAdd = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!selectedVariant || isOutOfStock) return;

      // 1. Calculate flying cookie trajectory starting point
      const btnRect = e.currentTarget.getBoundingClientRect();
      const startX = btnRect.left + btnRect.width / 2;
      const startY = btnRect.top + btnRect.height / 2;

      // Choose festive cookie icon
      const slug = product.slug.toLowerCase();
      let icon = '🍪';
      if (slug.includes('nastar')) icon = '🍍';
      else if (slug.includes('kastengel')) icon = '🧀';
      else if (slug.includes('salju')) icon = '❄️';
      else if (slug.includes('cokelat')) icon = '🍫';

      // Spawn projectile cookie flying to cart
      spawnFlyingCookie(startX, startY, icon);

      // 2. Add to cart store
      addItem(product, selectedVariant, quantity);
      setShowFeedback(true);
      bump();
      setTimeout(() => setShowFeedback(false), 1500);
    },
    [selectedVariant, isOutOfStock, addItem, product, quantity, spawnFlyingCookie]
  );

  return (
    <article
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: prefersReduced
          ? 'none'
          : `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: 'transform 0.15s ease-out',
      }}
      className="border border-cocoa/10 rounded-card overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow group flex flex-col justify-between"
    >
      <div>
        <div className="relative aspect-square overflow-hidden bg-cream/40">
          <Image
            src={resolveCookieImage(product)}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {product.texture_badge && (
            <span className="absolute bottom-3 left-3 z-10 px-2.5 py-1 rounded-full bg-cocoa/80 text-cream backdrop-blur-sm text-[11px] font-medium shadow-sm">
              ✨ {product.texture_badge}
            </span>
          )}
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-playfair font-semibold text-base leading-tight text-cocoa">
              {product.name}
            </h3>
            {product.rating != null && product.rating > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#D48B38" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                <span className="text-xs text-cocoa/60 font-medium">
                  {product.rating.toFixed(1)} / 5.0
                </span>
              </div>
            )}
          </div>

          <SizeSelector
            variants={product.product_variants}
            selected={selectedSize}
            onSelect={(size) => {
              setSelectedSize(size);
              setQuantity(1);
            }}
          />

          {selectedVariant && (
            <div className="flex items-center justify-between pt-1">
              <p className="font-semibold text-base text-cocoa">
                {formatRupiah(selectedVariant.price)}
              </p>
              {isOutOfStock ? (
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200">
                  Stok Habis
                </span>
              ) : selectedVariant.stock <= 5 ? (
                <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  Sisa {selectedVariant.stock} toples
                </span>
              ) : (
                <span className="text-[11px] text-cocoa/60 font-medium">
                  Stok: {selectedVariant.stock}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="p-4 pt-0 space-y-2.5">
        <QuantityControl
          value={quantity}
          onChange={setQuantity}
          disabled={isOutOfStock}
        />

        <div className="relative">
          <motion.button
            key={animKey}
            onClick={handleAdd}
            disabled={isOutOfStock}
            whileTap={{ scale: 0.96 }}
            animate={prefersReduced ? {} : { scaleY: [0.95, 1] }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="w-full h-11 bg-honey text-cream font-semibold text-sm rounded-button transition-colors hover:bg-honey/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center gap-2"
          >
            {isOutOfStock ? (
              <span>Stok Habis</span>
            ) : (
              <>
                <span>Masukkan ke Toples</span>
                <span className="text-xs opacity-90">↗</span>
              </>
            )}
          </motion.button>

          {showFeedback && (
            <motion.span
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-palm whitespace-nowrap bg-white px-2.5 py-0.5 rounded-full shadow-md border border-palm/20"
            >
              ✓ Masuk ke Keranjang!
            </motion.span>
          )}
        </div>
      </div>
    </article>
  );
}

function SizeSelector({
  variants,
  selected,
  onSelect,
}: {
  variants: ProductVariant[];
  selected: string;
  onSelect: (size: string) => void;
}) {
  return (
    <div className="space-y-1">
      <span className="text-[11px] font-semibold text-cocoa/60 uppercase tracking-wider block">
        Ukuran Toples
      </span>
      <div className="grid grid-cols-3 gap-1.5">
        {JAR_SIZES.map((size) => {
          const v = variants.find((item) => item.label === size);
          const isSelected = selected === size;
          const isAvailable = v && v.stock > 0;

          return (
            <button
              key={size}
              type="button"
              onClick={() => onSelect(size)}
              disabled={!v}
              className={`h-9 rounded-button text-xs font-medium border transition-all flex items-center justify-center relative ${
                isSelected
                  ? 'border-honey bg-honey/15 text-honey font-semibold shadow-sm'
                  : 'border-cocoa/15 bg-white text-cocoa/70 hover:border-cocoa/30'
              } ${!isAvailable ? 'opacity-50' : ''}`}
            >
              <span>{size}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuantityControl({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (val: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between border border-cocoa/15 rounded-button h-9 px-2 bg-cream/30">
      <span className="text-xs text-cocoa/70 font-medium">Jumlah Toples</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={disabled || value <= 1}
          className="w-6 h-6 rounded flex items-center justify-center text-cocoa/70 hover:bg-cocoa/10 disabled:opacity-30 text-sm font-bold"
        >
          -
        </button>
        <span className="text-xs font-semibold w-5 text-center text-cocoa">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={disabled}
          className="w-6 h-6 rounded flex items-center justify-center text-cocoa/70 hover:bg-cocoa/10 disabled:opacity-30 text-sm font-bold"
        >
          +
        </button>
      </div>
    </div>
  );
}
