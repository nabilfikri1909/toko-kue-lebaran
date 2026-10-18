import { create } from 'zustand';

export interface FlyingCookie {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  icon?: string;
}

interface AnimationState {
  flyingCookies: FlyingCookie[];
  isCartBumping: boolean;
  spawnFlyingCookie: (startX: number, startY: number, icon?: string) => void;
  removeFlyingCookie: (id: string) => void;
  triggerCartBump: () => void;
}

export const useAnimationStore = create<AnimationState>((set) => ({
  flyingCookies: [],
  isCartBumping: false,

  spawnFlyingCookie: (startX, startY, icon = '🍪') => {
    const id = `cookie-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const cartEl = document.getElementById('header-cart-button');

    let endX = window.innerWidth - 40;
    let endY = 28;

    if (cartEl) {
      const rect = cartEl.getBoundingClientRect();
      endX = rect.left + rect.width / 2;
      endY = rect.top + rect.height / 2;
    }

    const newCookie: FlyingCookie = { id, startX, startY, endX, endY, icon };

    set((state) => ({
      flyingCookies: [...state.flyingCookies, newCookie],
    }));

    // Trigger cart bump when cookie lands (~600ms)
    setTimeout(() => {
      set({ isCartBumping: true });
      setTimeout(() => set({ isCartBumping: false }), 450);
    }, 550);
  },

  removeFlyingCookie: (id) =>
    set((state) => ({
      flyingCookies: state.flyingCookies.filter((c) => c.id !== id),
    })),

  triggerCartBump: () => {
    set({ isCartBumping: true });
    setTimeout(() => set({ isCartBumping: false }), 450);
  },
}));
