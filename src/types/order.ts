// src/types/order.ts — Production order types aligned with Supabase schema

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'packed'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled';

export interface LineItem {
  product_id: string;
  title: string;
  image_url: string | null;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;

  // Customer
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;

  // Shipping address
  shipping_address: string | null;
  shipping_address2: string | null;
  shipping_city: string | null;
  shipping_state: string | null;
  shipping_pincode: string | null;

  // Line items
  line_items: LineItem[];

  // Pricing
  subtotal: number;
  gst_amount: number;
  shipping_amount: number;
  total_amount: number;

  // Payment
  payment_method: string | null;
  payment_status: string | null;   // 'pending' | 'paid' | 'failed' | 'refunded'

  // Fulfilment
  status: OrderStatus;
  courier_name: string | null;
  tracking_number: string | null;
  estimated_delivery: string | null;
  notes: string | null;

  // Timestamps
  order_date: string;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderInsert = Omit<Order, 'id' | 'created_at' | 'updated_at' | 'confirmed_at' | 'shipped_at' | 'delivered_at'>;
export type OrderUpdate = Partial<Omit<Order, 'id' | 'created_at' | 'order_number'>>;

// ── Tracking timeline ──────────────────────────────────────
export const ORDER_STAGES: { status: OrderStatus; label: string; icon: string; description: string }[] = [
  { status: 'pending',         label: 'Order Placed',       icon: '📦', description: 'Your order has been received' },
  { status: 'confirmed',       label: 'Confirmed',          icon: '✅', description: 'Payment verified and order confirmed' },
  { status: 'processing',      label: 'Processing',         icon: '⚙️', description: 'Your cards are being authenticated' },
  { status: 'packed',          label: 'Packed',             icon: '📫', description: 'Securely packed and ready to ship' },
  { status: 'shipped',         label: 'Shipped',            icon: '🚚', description: 'Dispatched with insured shipping' },
  { status: 'out_for_delivery',label: 'Out for Delivery',   icon: '🏃', description: 'Your package is on its way to you' },
  { status: 'delivered',       label: 'Delivered',          icon: '🎉', description: 'Package delivered successfully' },
];

// Cancelled is a terminal state, not in the timeline
export const CANCELLED_STAGE = { status: 'cancelled' as OrderStatus, label: 'Cancelled', icon: '❌', description: 'Order was cancelled' };

export function getStageIndex(status: OrderStatus): number {
  if (status === 'cancelled') return -1;
  return ORDER_STAGES.findIndex(s => s.status === status);
}

export function getStatusColor(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    pending:          'text-yellow-400',
    confirmed:        'text-blue-400',
    processing:       'text-purple-400',
    packed:           'text-indigo-400',
    shipped:          'text-cyan-400',
    out_for_delivery: 'text-orange-400',
    delivered:        'text-green-400',
    cancelled:        'text-red-400',
  };
  return map[status] ?? 'text-zinc-400';
}

export function getStatusBg(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    pending:          'bg-yellow-400/10 border-yellow-400/30',
    confirmed:        'bg-blue-400/10 border-blue-400/30',
    processing:       'bg-purple-400/10 border-purple-400/30',
    packed:           'bg-indigo-400/10 border-indigo-400/30',
    shipped:          'bg-cyan-400/10 border-cyan-400/30',
    out_for_delivery: 'bg-orange-400/10 border-orange-400/30',
    delivered:        'bg-green-400/10 border-green-400/30',
    cancelled:        'bg-red-400/10 border-red-400/30',
  };
  return map[status] ?? 'bg-zinc-400/10 border-zinc-400/30';
}

// Legacy compat — keep TRACKING_STAGES export for AdminOrders
export const TRACKING_STAGES = ORDER_STAGES.map(s => ({ status: s.status, label: s.label, icon: s.icon }));
export type TrackingStatus = OrderStatus;
