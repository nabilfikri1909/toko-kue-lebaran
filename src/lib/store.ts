import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem, Product, ProductVariant } from '@/lib/types';

interface CartState {
  items: CartItem[];
  orderNote: string;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  setOrderNote: (note: string) => void;
  addItem: (product: Product, variant: ProductVariant, quantity: number) => void;
  removeItem: (variantId: string) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  changeVariant: (oldVariantId: string, newVariant: ProductVariant) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getTotalWeight: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      orderNote: '',
      isOpen: false,

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      setOrderNote: (orderNote) => set({ orderNote }),

      addItem: (product, variant, quantity) => {
        set((state) => {
          const idx = state.items.findIndex((i) => i.variant.id === variant.id);
          if (idx >= 0) {
            const updated = [...state.items];
            updated[idx] = {
              ...updated[idx],
              quantity: Math.min(updated[idx].quantity + quantity, 99),
            };
            return { items: updated };
          }
          return { items: [...state.items, { product, variant, quantity }] };
        });
      },

      removeItem: (variantId) => {
        set((s) => ({ items: s.items.filter((i) => i.variant.id !== variantId) }));
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity < 1 || quantity > 99) return;
        set((s) => ({
          items: s.items.map((i) =>
            i.variant.id === variantId ? { ...i, quantity } : i
          ),
        }));
      },

      changeVariant: (oldVariantId, newVariant) => {
        set((state) => {
          const existing = state.items.find((i) => i.variant.id === newVariant.id);
          const old = state.items.find((i) => i.variant.id === oldVariantId);
          if (!old) return state;

          if (existing) {
            return {
              items: state.items
                .filter((i) => i.variant.id !== oldVariantId)
                .map((i) =>
                  i.variant.id === newVariant.id
                    ? { ...i, quantity: Math.min(i.quantity + old.quantity, 99) }
                    : i
                ),
            };
          }

          return {
            items: state.items.map((i) =>
              i.variant.id === oldVariantId ? { ...i, variant: newVariant } : i
            ),
          };
        });
      },

      clearCart: () => set({ items: [], orderNote: '' }),

      getTotalItems: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
      getTotalPrice: () =>
        get().items.reduce((sum, i) => sum + i.variant.price * i.quantity, 0),
      getTotalWeight: () =>
        get().items.reduce((sum, i) => sum + i.variant.weight_grams * i.quantity, 0),
    }),
    {
      name: 'toko-kue-cart',
      partialize: (state) => ({ items: state.items, orderNote: state.orderNote }),
    }
  )
);
