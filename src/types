// src/types/order.ts

export type TrackingStatus =
  | 'order_placed'
  | 'payment_confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered';

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  order_date: string;
  tracking_status: TrackingStatus;
  tracking_message: string | null;
  courier_name: string | null;
  tracking_number: string | null;
  estimated_delivery: string | null;
  created_at: string;
  updated_at: string;
}

export type OrderInsert = Omit<Order, 'id' | 'created_at' | 'updated_at'>;

export type OrderUpdate = Partial<
  Pick<
    Order,
    | 'tracking_status'
    | 'tracking_message'
    | 'courier_name'
    | 'tracking_number'
    | 'estimated_delivery'
    | 'customer_name'
    | 'customer_email'
    | 'product_name'
    | 'product_image'
    | 'quantity'
    | 'order_date'
  >
>;

export const TRACKING_STAGES: { status: TrackingStatus; label: string; icon: string }[] = [
  { status: 'order_placed',       label: 'Order Placed',        icon: '📦' },
  { status: 'payment_confirmed',  label: 'Payment Confirmed',   icon: '💳' },
  { status: 'processing',         label: 'Processing',          icon: '⚙️' },
  { status: 'shipped',            label: 'Shipped',             icon: '🚚' },
  { status: 'out_for_delivery',   label: 'Out for Delivery',    icon: '🏃' },
  { status: 'delivered',          label: 'Delivered',           icon: '✅' },
];

export function getStageIndex(status: TrackingStatus): number {
  return TRACKING_STAGES.findIndex(s => s.status === status);
}
