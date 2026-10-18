export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded';
export type DeliveryType = 'DELIVERY' | 'PICKUP';
export type PaymentMethod = 'QRIS' | 'COD';

export interface ProductVariant {
  id: string;
  product_id: string;
  label: string;
  weight_grams: number;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  rating: number | null;
  texture_badge: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductWithVariants extends Product {
  product_variants: ProductVariant[];
}

export interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string | null;
  customer_address: string;
  order_note?: string | null;
  greeting_card_note: string | null;
  total_price: number;
  total_weight_grams: number;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_variant_id: string;
  product_name: string;
  variant_label: string;
  quantity: number;
  unit_price: number;
}

export interface UserProfile {
  id: string;
  contact: string;
  type: 'phone' | 'email' | 'google';
  name: string;
  avatar_url?: string;
  address?: string;
  created_at: string;
}

