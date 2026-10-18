import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Order, OrderStatus } from '@/lib/types';

interface OrderHistoryState {
  orders: Order[];
  isOrdersModalOpen: boolean;
  openOrdersModal: () => void;
  closeOrdersModal: () => void;
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderNumber: string, status: OrderStatus) => void;
  setOrders: (orders: Order[]) => void;
}

export const useOrderHistoryStore = create<OrderHistoryState>()(
  persist(
    (set) => ({
      orders: [],
      isOrdersModalOpen: false,

      openOrdersModal: () => set({ isOrdersModalOpen: true }),
      closeOrdersModal: () => set({ isOrdersModalOpen: false }),

      addOrder: (order) =>
        set((state) => ({
          orders: [order, ...state.orders.filter((o) => o.order_number !== order.order_number)],
        })),

      updateOrderStatus: (orderNumber, status) =>
        set((state) => ({
          orders: state.orders.map((o) =>
            o.order_number === orderNumber
              ? { ...o, order_status: status, updated_at: new Date().toISOString() }
              : o
          ),
        })),

      setOrders: (orders) => set({ orders }),
    }),
    {
      name: 'toko-kue-user-orders',
      partialize: (state) => ({ orders: state.orders }),
    }
  )
);
