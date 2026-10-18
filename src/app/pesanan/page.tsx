'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import StoreInfo from '@/components/StoreInfo';
import MyOrdersModal from '@/components/MyOrdersModal';
import OrderTrackingModal from '@/components/OrderTrackingModal';
import { Order } from '@/lib/types';

export default function PesananPage() {
  const router = useRouter();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  return (
    <>
      <Header
        searchQuery=""
        onSearchChange={() => {}}
        onCartToggle={() => router.push('/')}
      />
      <StoreInfo />

      <main className="max-w-2xl mx-auto px-4 py-8">
        <MyOrdersModal
          isOpen={true}
          onClose={() => router.push('/')}
          onSelectOrder={(order) => setSelectedOrder(order)}
        />
      </main>

      <OrderTrackingModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
      />
    </>
  );
}
