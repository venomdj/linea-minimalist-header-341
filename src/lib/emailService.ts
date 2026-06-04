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

export async function sendOrderEmail(payload: EmailOrderPayload): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const res = await fetch(`${supabaseUrl}/functions/v1/send-order-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        "apikey": import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok || data?.success === false) {
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

export async function sendNewOrderEmails(orderId: string): Promise<void> {
  await Promise.allSettled([
    sendOrderEmail({ orderId, emailType: "order_confirmation" }),
    sendOrderEmail({ orderId, emailType: "order_notification_admin" }),
  ]);
}

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
