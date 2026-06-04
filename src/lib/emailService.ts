import { supabase } from "@/integrations/supabase/client";

export type OrderEmailType =
  | "order_confirmation"
  | "order_notification_admin"
  | "status_processing"
  | "status_shipped"
  | "status_out_for_delivery"
  | "status_delivered"
  | "status_cancelled";

export interface EmailOrderPayload {
  orderId: string;
  emailType: OrderEmailType;
  trackingNumber?: string;
  trackingUrl?: string;
}

/**
 * Calls the `send-order-email` Supabase Edge Function.
 * Returns true on success, false on failure (errors are logged, not thrown,
 * so a failed email never breaks the checkout flow).
 */
export async function sendOrderEmail(payload: EmailOrderPayload): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("send-order-email", {
      body: payload,
    });

    if (error) {
      console.error("[emailService] Edge function error:", error.message);
      return false;
    }

    if (data?.success === false) {
      console.error("[emailService] Email send failed:", data?.error);
      return false;
    }

    console.info(`[emailService] Email sent — type=${payload.emailType} order=${payload.orderId}`);
    return true;
  } catch (err) {
    console.error("[emailService] Unexpected error:", err);
    return false;
  }
}

/**
 * Fires both the customer confirmation and the admin notification emails
 * immediately after a new order is saved. Runs in parallel.
 */
export async function sendNewOrderEmails(orderId: string): Promise<void> {
  await Promise.allSettled([
    sendOrderEmail({ orderId, emailType: "order_confirmation" }),
    sendOrderEmail({ orderId, emailType: "order_notification_admin" }),
  ]);
}

/**
 * Maps an order status string to the corresponding email type.
 * Returns null for statuses that don't trigger an email (e.g. "Pending").
 */
export function statusToEmailType(status: string): OrderEmailType | null {
  const map: Record<string, OrderEmailType> = {
    Processing: "status_processing",
    Shipped: "status_shipped",
    "Out for Delivery": "status_out_for_delivery",
    Delivered: "status_delivered",
    Cancelled: "status_cancelled",
  };
  return map[status] ?? null;
}
