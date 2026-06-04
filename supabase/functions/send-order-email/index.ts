import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


// ─── Types ────────────────────────────────────────────────────────────────────

type EmailType =
  | "order_confirmation"
  | "order_notification_admin"
  | "status_processing"
  | "status_shipped"
  | "status_out_for_delivery"
  | "status_delivered"
  | "status_cancelled";

interface RequestBody {
  orderId: string;
  emailType: EmailType;
  trackingNumber?: string;
  trackingUrl?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Simple retry wrapper — attempts up to `maxAttempts` times with exponential back-off */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 500,
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < maxAttempts - 1) {
        await new Promise((r) => setTimeout(r, baseDelayMs * 2 ** i));
      }
    }
  }
  throw lastErr;
}

// ─── Brand colours ────────────────────────────────────────────────────────────
const BRAND = {
  bg: "#0a0a0f",
  surface: "#12121a",
  border: "#2a2a3a",
  accent: "#9b6dff",
  accentDark: "#7c4dff",
  text: "#e8e8f0",
  muted: "#888899",
  danger: "#ff4d6d",
  success: "#4dffb4",
};

// ─── Email templates ──────────────────────────────────────────────────────────

function baseLayout(content: string, preheader: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>Mythical Vault</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
  <style>
    body,html{margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
    table{border-collapse:collapse;}
    a{color:${BRAND.accent};text-decoration:none;}
    @media(max-width:600px){.container{width:100%!important;padding:0 16px!important;} .item-row td{display:block!important;width:100%!important;} .price-cell{text-align:left!important;padding-top:4px!important;}}
  </style>
</head>
<body style="background:${BRAND.bg};margin:0;padding:0;">
  <span style="display:none;font-size:1px;color:${BRAND.bg};max-height:0;max-width:0;overflow:hidden;">${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table class="container" role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:${BRAND.surface};border:1px solid ${BRAND.border};border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND.accentDark},${BRAND.accent});padding:32px 40px;text-align:center;">
              <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">⚔️ Mythical Vault</h1>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,.75);letter-spacing:2px;text-transform:uppercase;">Legendary Collectibles</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid ${BRAND.border};text-align:center;">
              <p style="margin:0;font-size:12px;color:${BRAND.muted};">© ${new Date().getFullYear()} Mythical Vault · All rights reserved</p>
              <p style="margin:6px 0 0;font-size:12px;color:${BRAND.muted};">Questions? Reply to this email or contact our support team.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function heading(text: string) {
  return `<h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${BRAND.text};">${text}</h2>`;
}

function subtext(text: string) {
  return `<p style="margin:0 0 24px;font-size:14px;color:${BRAND.muted};">${text}</p>`;
}

function divider() {
  return `<hr style="border:none;border-top:1px solid ${BRAND.border};margin:24px 0;" />`;
}

function badge(text: string, color = BRAND.accent) {
  return `<span style="display:inline-block;padding:4px 12px;background:${color}22;border:1px solid ${color}55;border-radius:20px;font-size:12px;font-weight:600;color:${color};letter-spacing:.5px;">${text}</span>`;
}

function infoRow(label: string, value: string) {
  return `<tr>
    <td style="padding:6px 0;font-size:13px;color:${BRAND.muted};width:40%;">${label}</td>
    <td style="padding:6px 0;font-size:13px;color:${BRAND.text};font-weight:500;">${value}</td>
  </tr>`;
}

function ctaButton(text: string, url: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td style="background:linear-gradient(135deg,${BRAND.accentDark},${BRAND.accent});border-radius:8px;">
        <a href="${url}" style="display:inline-block;padding:14px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:.3px;">${text}</a>
      </td>
    </tr>
  </table>`;
}

interface OrderData {
  id: string;
  order_number?: string;
  created_at: string;
  status: string;
  total_amount: number;
  subtotal?: number;
  shipping_cost?: number;
  shipping_amount?: number;
  gst_amount?: number;
  payment_status?: string;
  payment_method?: string;
  shipping_method?: string;
  courier_name?: string;
  tracking_number?: string;
  tracking_url?: string;
  notes?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address?: string;
  shipping_address2?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pincode?: string;
  line_items?: Array<{
    name?: string;
    quantity: number;
    price: number;
    image_url?: string;
  }>;
}

function renderOrderItems(items: OrderData["line_items"] = []) {
  if (!items || !items.length) return "";
  const rows = items
    .map(
      (item) => `
      <tr class="item-row">
        <td style="padding:10px 0;border-bottom:1px solid ${BRAND.border};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:14px;color:${BRAND.text};font-weight:500;">${item.name ?? "Product"}</td>
              <td class="price-cell" align="right" style="font-size:14px;color:${BRAND.text};white-space:nowrap;">
                ${item.quantity} × $${Number(item.price).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td colspan="2" style="font-size:12px;color:${BRAND.muted};padding-top:2px;">Subtotal: $${(item.quantity * Number(item.price)).toFixed(2)}</td>
            </tr>
          </table>
        </td>
      </tr>`,
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">${rows}</table>`;
}

function renderShippingAddress(order: OrderData) {
  const parts = [
    order.customer_name,
    order.shipping_address,
    order.shipping_address2,
    [order.shipping_city, order.shipping_state, order.shipping_pincode].filter(Boolean).join(", "),
    order.customer_phone ? `📞 ${order.customer_phone}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join("<br/>") : "—";
}

function buildOrderConfirmation(order: OrderData): { subject: string; html: string } {
  const name = order.customer_name?.split(" ")[0] ?? "Adventurer";
  const orderId = `#${(order.order_number ?? order.id.slice(0, 8)).toUpperCase()}`;
  const content = `
    ${heading(`Order Confirmed, ${name}! 🎉`)}
    ${subtext("Your order has been received and is being prepared for fulfillment.")}
    ${badge("Order Confirmed", BRAND.success)}
    ${divider()}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("Order ID", orderId)}
      ${infoRow("Order Date", new Date(order.created_at).toLocaleDateString("en-US", { dateStyle: "long" }))}
      ${infoRow("Payment Status", order.payment_status ?? "Paid")}
      ${infoRow("Payment Method", order.payment_method ?? "—")}
      ${infoRow("Shipping Method", order.shipping_method ?? "Standard")}
    </table>
    ${divider()}
    <h3 style="margin:0 0 8px;font-size:15px;font-weight:600;color:${BRAND.text};">Items Ordered</h3>
    ${renderOrderItems(order.line_items)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
      ${order.subtotal != null ? infoRow("Subtotal", `$${Number(order.subtotal).toFixed(2)}`) : ""}
      ${order.shipping_cost != null ? infoRow("Shipping", `$${Number(order.shipping_cost).toFixed(2)}`) : (order.shipping_amount != null ? infoRow("Shipping", `$${Number(order.shipping_amount).toFixed(2)}`) : "")}
      ${order.gst_amount != null ? infoRow("GST", `$${Number(order.gst_amount).toFixed(2)}`) : ""}
      <tr>
        <td style="padding:8px 0 4px;font-size:15px;font-weight:700;color:${BRAND.accent};">Total</td>
        <td style="padding:8px 0 4px;font-size:15px;font-weight:700;color:${BRAND.accent};">$${Number(order.total_amount).toFixed(2)}</td>
      </tr>
    </table>
    ${divider()}
    <h3 style="margin:0 0 8px;font-size:15px;font-weight:600;color:${BRAND.text};">Shipping To</h3>
    <p style="margin:0;font-size:13px;color:${BRAND.muted};line-height:1.8;">${renderShippingAddress(order)}</p>
    ${divider()}
    <p style="margin:0;font-size:13px;color:${BRAND.muted};">You'll receive another email when your order ships. Thank you for choosing Mythical Vault!</p>
  `;
  return {
    subject: `Order Confirmed ${orderId} — Mythical Vault`,
    html: baseLayout(content, `Your order ${orderId} is confirmed!`),
  };
}

// ── Admin: new order notification ─────────────────────────────────────────────
function buildAdminNotification(order: OrderData): { subject: string; html: string } {
  const orderId = `#${(order.order_number ?? order.id.slice(0, 8)).toUpperCase()}`;
  const content = `
    ${heading("🛒 New Order Received")}
    ${subtext("A customer just placed an order on Mythical Vault.")}
    ${badge("Action Required", BRAND.accent)}
    ${divider()}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("Order ID", orderId)}
      ${infoRow("Full ID", order.id)}
      ${infoRow("Customer", order.customer_name ?? "—")}
      ${infoRow("Email", order.customer_email ?? "—")}
      ${infoRow("Phone", order.customer_phone ?? "—")}
      ${infoRow("Date", new Date(order.created_at).toLocaleString())}
      ${infoRow("Payment Status", order.payment_status ?? "—")}
      ${infoRow("Payment Method", order.payment_method ?? "—")}
      ${infoRow("Shipping Method", order.shipping_method ?? "Standard")}
      ${infoRow("Order Total", `$${Number(order.total_amount).toFixed(2)}`)}
    </table>
    ${divider()}
    <h3 style="margin:0 0 8px;font-size:15px;font-weight:600;color:${BRAND.text};">Items</h3>
    ${renderOrderItems(order.line_items)}
    ${divider()}
    <h3 style="margin:0 0 8px;font-size:15px;font-weight:600;color:${BRAND.text};">Shipping Address</h3>
    <p style="margin:0;font-size:13px;color:${BRAND.muted};line-height:1.8;">${renderShippingAddress(order)}</p>
    ${order.notes ? `${divider()}<h3 style="margin:0 0 8px;font-size:15px;font-weight:600;color:${BRAND.text};">Customer Notes</h3><p style="margin:0;font-size:13px;color:${BRAND.muted};">${order.notes}</p>` : ""}
  `;
  return {
    subject: `New Order ${orderId} — $${Number(order.total_amount).toFixed(2)} from ${order.customer_name ?? "Customer"}`,
    html: baseLayout(content, `New order from ${order.customer_name ?? "a customer"}`),
  };
}

// ── Customer: status update emails ───────────────────────────────────────────
function buildStatusEmail(
  order: OrderData,
  emailType: EmailType,
): { subject: string; html: string } {
  const name = order.customer_name?.split(" ")[0] ?? "Adventurer";
  const orderId = `#${(order.order_number ?? order.id.slice(0, 8)).toUpperCase()}`;

  const statusConfig: Record<
    string,
    { icon: string; title: string; body: string; badgeColor: string; subject: string }
  > = {
    status_processing: {
      icon: "⚙️",
      title: `Your Order Is Being Processed`,
      body: `Great news! Order ${orderId} has moved to <strong>Processing</strong>. Our team is preparing your legendary items for shipment.`,
      badgeColor: "#f59e0b",
      subject: `Processing: Order ${orderId} — Mythical Vault`,
    },
    status_shipped: {
      icon: "📦",
      title: `Your Order Has Shipped!`,
      body: `Order ${orderId} is on its way! ${order.tracking_number ? `Your tracking number is <strong>${order.tracking_number}</strong>.` : ""}`,
      badgeColor: BRAND.accent,
      subject: `Shipped: Order ${orderId} — Mythical Vault`,
    },
    status_out_for_delivery: {
      icon: "🚚",
      title: `Out for Delivery Today!`,
      body: `Order ${orderId} is out for delivery and should arrive today. Make sure someone is available to receive your package!`,
      badgeColor: "#06b6d4",
      subject: `Out for Delivery: Order ${orderId} — Mythical Vault`,
    },
    status_delivered: {
      icon: "✅",
      title: `Order Delivered!`,
      body: `Order ${orderId} has been delivered. We hope you love your new legendary collectibles! If you have any issues, please contact our support team.`,
      badgeColor: BRAND.success,
      subject: `Delivered: Order ${orderId} — Mythical Vault`,
    },
    status_cancelled: {
      icon: "❌",
      title: `Order Cancelled`,
      body: `We're sorry to inform you that order ${orderId} has been cancelled. If you did not request this cancellation or need assistance, please contact us immediately.`,
      badgeColor: BRAND.danger,
      subject: `Order Cancelled: ${orderId} — Mythical Vault`,
    },
  };

  const cfg = statusConfig[emailType];
  const trackingSection =
    emailType === "status_shipped" && order.tracking_url
      ? ctaButton("Track Your Package →", order.tracking_url)
      : "";

  const content = `
    ${heading(`${cfg.icon} ${cfg.title}`)}
    ${subtext(`Hi ${name}, here's an update on your order.`)}
    ${badge(emailType.replace("status_", "").replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()), cfg.badgeColor)}
    ${divider()}
    <p style="margin:0 0 16px;font-size:14px;color:${BRAND.muted};line-height:1.7;">${cfg.body}</p>
    ${trackingSection}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${infoRow("Order ID", orderId)}
      ${infoRow("Order Date", new Date(order.created_at).toLocaleDateString("en-US", { dateStyle: "long" }))}
      ${infoRow("Total", `$${Number(order.total_amount).toFixed(2)}`)}
      ${order.tracking_number ? infoRow("Tracking #", order.tracking_number) : ""}
    </table>
    ${divider()}
    <p style="margin:0;font-size:13px;color:${BRAND.muted};">Thank you for shopping at Mythical Vault.</p>
  `;
  return {
    subject: cfg.subject,
    html: baseLayout(content, cfg.body.replace(/<[^>]+>/g, "")),
  };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "admin@mythicalvault.com";
  const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "orders@mythicalvault.com";
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY not set");
    return jsonResponse({ success: false, error: "Email provider not configured" }, 500);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ success: false, error: "Invalid JSON body" }, 400);
  }

  const { orderId, emailType, trackingNumber, trackingUrl } = body;
  if (!orderId || !emailType) {
    return jsonResponse({ success: false, error: "orderId and emailType are required" }, 400);
  }

  // ── Idempotency check ────────────────────────────────────────────────────────
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: existing } = await supabase
    .from("email_log")
    .select("id")
    .eq("order_id", orderId)
    .eq("email_type", emailType)
    .eq("status", "sent")
    .maybeSingle();

  if (existing) {
    console.info(`[send-order-email] Duplicate suppressed: ${emailType} for ${orderId}`);
    return jsonResponse({ success: true, duplicate: true });
  }

  // ── Fetch order ──────────────────────────────────────────────────────────────
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(`
      id, order_number, created_at, status, total_amount, subtotal,
      shipping_cost, shipping_amount, gst_amount,
      payment_status, payment_method, shipping_method,
      courier_name, tracking_number, tracking_url, notes,
      customer_name, customer_email, customer_phone,
      shipping_address, shipping_address2, shipping_city,
      shipping_state, shipping_pincode, line_items
    `)
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return jsonResponse({ success: false, error: `Order not found: ${orderId}` }, 404);
  }

  // Merge tracking info passed from admin dashboard
  const enrichedOrder: OrderData = {
    ...order,
    tracking_number: trackingNumber ?? order.tracking_number,
    tracking_url: trackingUrl ?? order.tracking_url,
  };

  // ── Build email ──────────────────────────────────────────────────────────────
  let subject: string;
  let html: string;
  let toEmail: string;

  if (emailType === "order_notification_admin") {
    ({ subject, html } = buildAdminNotification(enrichedOrder));
    toEmail = ADMIN_EMAIL;
  } else if (emailType === "order_confirmation") {
    ({ subject, html } = buildOrderConfirmation(enrichedOrder));
    toEmail = order.customer_email ?? "";
  } else {
    ({ subject, html } = buildStatusEmail(enrichedOrder, emailType));
    toEmail = order.customer_email ?? "";
  }

  if (!toEmail) {
    return jsonResponse({ success: false, error: "No recipient email address" }, 400);
  }

  // ── Send via Resend ──────────────────────────────────────────────────────────
  let resendData: unknown;
  try {
    resendData = await withRetry(async () => {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Mythical Vault <${FROM_EMAIL}>`,
          to: [toEmail],
          subject,
          html,
        }),
      });
      if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Resend ${res.status}: ${errBody}`);
      }
      return res.json();
    });
  } catch (sendErr) {
    // Log failure
    await supabase.from("email_log").insert({
      order_id: orderId,
      email_type: emailType,
      recipient: toEmail,
      status: "failed",
      error: String(sendErr),
    });
    return jsonResponse({ success: false, error: String(sendErr) }, 502);
  }

  // ── Log success ──────────────────────────────────────────────────────────────
  await supabase.from("email_log").insert({
    order_id: orderId,
    email_type: emailType,
    recipient: toEmail,
    status: "sent",
    provider_id: (resendData as { id?: string })?.id ?? null,
  });

  return jsonResponse({ success: true, emailType, recipient: toEmail });
});
