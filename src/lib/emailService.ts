import { supabase } from "@/integrations/supabase/client";

/** Values MUST match the edge function's `EmailType` union exactly. */
export type EmailType =
  | "order_confirmation"
  | "order_notification_admin"
  | "status_processing"
  | "status_shipped"
  | "status_out_for_delivery"
  | "status_delivered"
  | "status_cancelled";

export interface EmailOrderPayload {
  orderId: string;
  emailType: EmailType;
  trackingNumber?: string;
  trackingUrl?: string;
}

async function invokeOnce(payload: EmailOrderPayload): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke("send-order-email", {
      body: payload,
    });
    // supabase-js wraps non-2xx into `error`; the edge fn also returns { success, error }
    const fnError = error || (data && data.success === false ? data.error : null);
    if (fnError) {
      console.error(
        `[emailService] send failed — type=${payload.emailType} order=${payload.orderId}`,
        fnError,
      );
      return false;
    }
    console.info(
      `[emailService] sent — type=${payload.emailType} order=${payload.orderId}`,
      data,
    );
    return true;
  } catch (err) {
    console.error("[emailService] unexpected error:", err);
    return false;
  }
}

/** Public single-send helper. */
export async function sendOrderEmail(payload: EmailOrderPayload): Promise<boolean> {
  return invokeOnce(payload);
}

/** Fire customer confirmation + admin notification in parallel. */
export async function sendNewOrderEmails(orderId: string): Promise<void> {
  const [customerOk, adminOk] = await Promise.all([
    invokeOnce({ orderId, emailType: "order_confirmation" }),
    invokeOnce({ orderId, emailType: "order_notification_admin" }),
  ]);
  if (!customerOk) console.warn(`[emailService] customer confirmation failed for ${orderId}`);
  if (!adminOk) console.warn(`[emailService] admin notification failed for ${orderId}`);
}

/** Map an order status string to the matching email type, or null if no email. */
export function statusToEmailType(status: string): EmailType | null {
  const map: Record<string, EmailType> = {
    processing: "status_processing",
    shipped: "status_shipped",
    out_for_delivery: "status_out_for_delivery",
    delivered: "status_delivered",
    cancelled: "status_cancelled",
  };
  return map[status?.toLowerCase()] ?? null;
}

/** Convenience: send a status-change email from an order status. */
export async function sendStatusEmail(
  orderId: string,
  status: string,
  extras?: { trackingNumber?: string; trackingUrl?: string },
): Promise<boolean> {
  const emailType = statusToEmailType(status);
  if (!emailType) {
    console.info(`[emailService] no email mapped for status="${status}"`);
    return false;
  }
  return invokeOnce({ orderId, emailType, ...extras });
}
