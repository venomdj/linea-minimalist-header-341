import { supabase } from "@/integrations/supabase/client";

export type OrderEmailEvent =
  | "order_confirmed"
  | "order_processing"
  | "order_shipped"
  | "order_out_for_delivery"
  | "order_delivered"
  | "order_cancelled";

export interface EmailOrderPayload {
  order_id: string;
  event: OrderEmailEvent;
  tracking_number?: string;
  tracking_url?: string;
  cancellation_reason?: string;
}

export async function sendOrderEmail(payload: EmailOrderPayload): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("send-order-email", {
      body: payload,
    });
    if (error || data?.error) {
      console.error("[emailService] send failed:", error ?? data?.error);
      return false;
    }
    console.info(`[emailService] sent — event=${payload.event} order=${payload.order_id}`);
    return true;
  } catch (err) {
    console.error("[emailService] unexpected error:", err);
    return false;
  }
}

/** Sends customer confirmation + admin new-order notice (the edge function handles both). */
export async function sendNewOrderEmails(orderId: string): Promise<void> {
  await sendOrderEmail({ order_id: orderId, event: "order_confirmed" });
}

export function statusToEmailEvent(status: string): OrderEmailEvent | null {
  const map: Record<string, OrderEmailEvent> = {
    processing: "order_processing",
    shipped: "order_shipped",
    out_for_delivery: "order_out_for_delivery",
    delivered: "order_delivered",
    cancelled: "order_cancelled",
  };
  return map[status?.toLowerCase()] ?? null;
}
