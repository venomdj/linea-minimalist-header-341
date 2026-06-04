import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Env ─────────────────────────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "orders@mythicalvault.in";
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") ?? "admin@mythicalvault.in";
const STORE_NAME = "Mythical Vault";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ─── Types ────────────────────────────────────────────────────────────────────
type EmailEvent =
  | "order_confirmed"
  | "order_processing"
  | "order_shipped"
  | "order_out_for_delivery"
  | "order_delivered"
  | "order_cancelled";

interface EmailRequest {
  order_id: string;
  event: EmailEvent;
  tracking_number?: string;
  tracking_url?: string;
  cancellation_reason?: string;
}

// ─── Resend sender ────────────────────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string): Promise<{ id?: string; error?: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: `${STORE_NAME} <${FROM_EMAIL}>`, to, subject, html }),
  });
  const json = await res.json();
  if (!res.ok) return { error: JSON.stringify(json) };
  return { id: json.id };
}

// ─── Idempotency key ──────────────────────────────────────────────────────────
function idempotencyKey(order_id: string, event: EmailEvent, recipient: "customer" | "admin") {
  return `${order_id}::${event}::${recipient}`;
}

async function alreadySent(key: string): Promise<boolean> {
  const { data } = await supabase
    .from("email_log")
    .select("id")
    .eq("idempotency_key", key)
    .eq("status", "sent")
    .maybeSingle();
  return !!data;
}

async function logEmail(opts: {
  order_id: string;
  event: EmailEvent;
  recipient: string;
  recipient_type: "customer" | "admin";
  subject: string;
  idempotency_key: string;
  status: "sent" | "failed";
  resend_id?: string;
  error?: string;
}) {
  await supabase.from("email_log").insert(opts);
}

// ─── Shared template shell ────────────────────────────────────────────────────
function shell(content: string, preheader = "") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="color-scheme" content="light"/>
<title>${STORE_NAME}</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background:#f5f4f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;-webkit-text-size-adjust:100%;">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;</div>` : ""}
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#f5f4f0;padding:32px 0;">
  <tr><td align="center">
    <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;">

      <!-- HEADER -->
      <tr><td style="background:#0f0f0f;padding:28px 40px;border-radius:12px 12px 0 0;" align="center">
        <span style="font-family:'Georgia',serif;font-size:22px;font-weight:700;color:#e8d5b0;letter-spacing:3px;text-transform:uppercase;">⚔ ${STORE_NAME}</span>
        <p style="margin:6px 0 0;color:#888;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Mythological Collectibles &amp; Replicas</p>
      </td></tr>

      <!-- BODY -->
      <tr><td style="background:#ffffff;padding:40px;border-left:1px solid #e8e8e4;border-right:1px solid #e8e8e4;">
        ${content}
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:#0f0f0f;padding:24px 40px;border-radius:0 0 12px 12px;" align="center">
        <p style="margin:0;color:#666;font-size:11px;line-height:1.7;">
          © ${new Date().getFullYear()} ${STORE_NAME} · All rights reserved<br/>
          <span style="color:#888;">Questions? Reply to this email or contact us at ${FROM_EMAIL}</span>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function formatPrice(n: number) {
  return "₹" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function divider() {
  return `<hr style="border:none;border-top:1px solid #eee;margin:24px 0;"/>`;
}

function badge(text: string, color: string, bg: string) {
  return `<span style="display:inline-block;padding:4px 12px;border-radius:20px;background:${bg};color:${color};font-size:12px;font-weight:600;letter-spacing:0.5px;">${text}</span>`;
}

function statusBadge(status: string) {
  const map: Record<string, [string, string]> = {
    pending:          ["#92400e", "#fef3c7"],
    processing:       ["#1e40af", "#dbeafe"],
    shipped:          ["#6b21a8", "#f3e8ff"],
    out_for_delivery: ["#065f46", "#d1fae5"],
    delivered:        ["#166534", "#dcfce7"],
    cancelled:        ["#991b1b", "#fee2e2"],
  };
  const [color, bg] = map[status.toLowerCase()] ?? ["#374151", "#f3f4f6"];
  return badge(status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), color, bg);
}

function infoRow(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 0;color:#666;font-size:13px;width:40%;vertical-align:top;">${label}</td>
    <td style="padding:8px 0;color:#1a1a1a;font-size:13px;font-weight:500;vertical-align:top;">${value}</td>
  </tr>`;
}

function buildItemsTable(items: any[]) {
  const rows = items.map(i => `
    <tr style="border-bottom:1px solid #f0f0f0;">
      <td style="padding:14px 0;">
        <div style="font-size:14px;font-weight:600;color:#1a1a1a;">${i.product_name}</div>
        ${i.variant ? `<div style="font-size:12px;color:#888;margin-top:2px;">${i.variant}</div>` : ""}
      </td>
      <td style="padding:14px 12px;text-align:center;color:#555;font-size:13px;">×${i.quantity}</td>
      <td style="padding:14px 0;text-align:right;font-size:13px;color:#1a1a1a;font-weight:500;">${formatPrice(i.unit_price * i.quantity)}</td>
    </tr>`).join("");

  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:16px 0;">
    <thead>
      <tr style="border-bottom:2px solid #eee;">
        <th style="padding:8px 0;text-align:left;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Item</th>
        <th style="padding:8px 12px;text-align:center;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Qty</th>
        <th style="padding:8px 0;text-align:right;font-size:11px;color:#999;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Total</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function buildPricingSummary(order: any) {
  const subtotal = order.subtotal ?? (order.total_amount - (order.shipping_cost ?? 0));
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin-top:8px;">
      <tr>
        <td style="padding:4px 0;color:#555;font-size:13px;">Subtotal</td>
        <td style="padding:4px 0;text-align:right;color:#555;font-size:13px;">${formatPrice(subtotal)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#555;font-size:13px;">Shipping (${order.shipping_method ?? "Standard"})</td>
        <td style="padding:4px 0;text-align:right;color:#555;font-size:13px;">${order.shipping_cost > 0 ? formatPrice(order.shipping_cost) : "Free"}</td>
      </tr>
      ${order.discount_amount > 0 ? `<tr>
        <td style="padding:4px 0;color:#16a34a;font-size:13px;">Discount</td>
        <td style="padding:4px 0;text-align:right;color:#16a34a;font-size:13px;">−${formatPrice(order.discount_amount)}</td>
      </tr>` : ""}
      <tr>
        <td colspan="2"><hr style="border:none;border-top:1px solid #eee;margin:10px 0;"/></td>
      </tr>
      <tr>
        <td style="padding:4px 0;font-size:15px;font-weight:700;color:#0f0f0f;">Total Paid</td>
        <td style="padding:4px 0;text-align:right;font-size:15px;font-weight:700;color:#0f0f0f;">${formatPrice(order.total_amount)}</td>
      </tr>
    </table>`;
}

function buildAddressBlock(order: any) {
  const parts = [
    order.address_line1,
    order.address_line2,
    order.city,
    order.state,
    order.pincode,
  ].filter(Boolean);
  return parts.join(", ");
}

// ─── STATUS TIMELINE ──────────────────────────────────────────────────────────
function buildTimeline(activeEvent: EmailEvent) {
  const steps: { event: EmailEvent; label: string; icon: string }[] = [
    { event: "order_confirmed",       label: "Confirmed",        icon: "✓" },
    { event: "order_processing",      label: "Processing",       icon: "⚙" },
    { event: "order_shipped",         label: "Shipped",          icon: "📦" },
    { event: "order_out_for_delivery",label: "Out for Delivery", icon: "🚚" },
    { event: "order_delivered",       label: "Delivered",        icon: "🎉" },
  ];

  if (activeEvent === "order_cancelled") {
    return `<div style="text-align:center;padding:16px;background:#fee2e2;border-radius:8px;color:#991b1b;font-weight:600;font-size:14px;">✕ Order Cancelled</div>`;
  }

  const activeIdx = steps.findIndex(s => s.event === activeEvent);

  const dots = steps.map((s, i) => {
    const done = i <= activeIdx;
    const active = i === activeIdx;
    return `<td align="center" style="width:20%;padding:0 4px;">
      <div style="width:32px;height:32px;border-radius:50%;background:${done ? "#0f0f0f" : "#e5e5e5"};color:${done ? "#e8d5b0" : "#999"};font-size:14px;line-height:32px;text-align:center;margin:0 auto;${active ? "box-shadow:0 0 0 4px #e8d5b040;" : ""}">${s.icon}</div>
      <div style="font-size:10px;color:${done ? "#0f0f0f" : "#aaa"};margin-top:6px;font-weight:${active ? "700" : "400"};">${s.label}</div>
    </td>`;
  }).join(`<td style="padding-bottom:16px;"><div style="height:2px;background:#e5e5e5;"></div></td>`);

  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:24px 0;">
    <tr>${dots}</tr>
  </table>`;
}

// ─── TEMPLATES ───────────────────────────────────────────────────────────────

function customerConfirmationEmail(order: any): { subject: string; html: string } {
  const subject = `Your order #${order.order_number} is confirmed! 🎉`;
  const html = shell(`
    <h1 style="margin:0 0 4px;font-size:24px;font-weight:700;color:#0f0f0f;">Order Confirmed!</h1>
    <p style="margin:0 0 24px;color:#666;font-size:14px;">Thank you, ${order.full_name}. We've received your order and will begin processing it shortly.</p>

    ${buildTimeline("order_confirmed")}
    ${divider()}

    <h3 style="margin:0 0 16px;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#999;font-weight:600;">Order Summary</h3>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${infoRow("Order ID", `<span style="font-family:monospace;background:#f5f5f5;padding:2px 8px;border-radius:4px;">#${order.order_number}</span>`)}
      ${infoRow("Order Date", new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }))}
      ${infoRow("Payment Status", statusBadge(order.payment_status ?? "pending"))}
      ${infoRow("Payment Method", order.payment_method ?? "UPI")}
    </table>

    ${divider()}
    <h3 style="margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#999;font-weight:600;">Items Ordered</h3>
    ${buildItemsTable(order.order_items)}
    ${buildPricingSummary(order)}

    ${divider()}
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="width:50%;padding-right:12px;vertical-align:top;">
          <h4 style="margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#999;">Shipping To</h4>
          <p style="margin:0;font-size:13px;color:#333;line-height:1.6;">
            <strong>${order.full_name}</strong><br/>
            ${buildAddressBlock(order)}<br/>
            📞 ${order.phone}
          </p>
        </td>
        <td style="width:50%;padding-left:12px;vertical-align:top;">
          <h4 style="margin:0 0 10px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#999;">Shipping Method</h4>
          <p style="margin:0;font-size:13px;color:#333;line-height:1.6;">
            ${order.shipping_method ?? "Standard · Insured"}<br/>
            <span style="color:#888;">Estimated ${order.shipping_method?.toLowerCase().includes("express") ? "2–4" : "5–7"} business days</span>
          </p>
        </td>
      </tr>
    </table>

    ${divider()}
    <div style="background:#f9f8f5;border-radius:8px;padding:20px;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;color:#666;">You'll receive another email when your order ships.</p>
      <p style="margin:0;font-size:12px;color:#aaa;">Keep this email for your records. Order ID: #${order.order_number}</p>
    </div>
  `, `Order #${order.order_number} confirmed · ${formatPrice(order.total_amount)}`);

  return { subject, html };
}

function customerStatusEmail(order: any, event: EmailEvent, extra: { tracking_number?: string; tracking_url?: string; cancellation_reason?: string }): { subject: string; html: string } {
  const config: Record<EmailEvent, { subject: string; headline: string; body: string; color: string }> = {
    order_confirmed: {
      subject: `Order #${order.order_number} confirmed`,
      headline: "Order Confirmed!",
      body: "Your order has been confirmed and will be processed soon.",
      color: "#0f0f0f",
    },
    order_processing: {
      subject: `We're preparing your order #${order.order_number} ⚙️`,
      headline: "Your Order is Being Prepared",
      body: "Our team is carefully picking, packing and inspecting your items.",
      color: "#1e40af",
    },
    order_shipped: {
      subject: `Your order #${order.order_number} has shipped! 📦`,
      headline: "Your Order Has Shipped!",
      body: "Your mythical treasures are on their way to you.",
      color: "#6b21a8",
    },
    order_out_for_delivery: {
      subject: `Your order #${order.order_number} is out for delivery 🚚`,
      headline: "Out for Delivery Today!",
      body: "Your order is with the delivery agent and should reach you today.",
      color: "#065f46",
    },
    order_delivered: {
      subject: `Your order #${order.order_number} has been delivered 🎉`,
      headline: "Order Delivered!",
      body: "Your order has been successfully delivered. We hope you love your purchase!",
      color: "#166534",
    },
    order_cancelled: {
      subject: `Your order #${order.order_number} has been cancelled`,
      headline: "Order Cancelled",
      body: extra.cancellation_reason
        ? `Your order has been cancelled. Reason: ${extra.cancellation_reason}`
        : "Your order has been cancelled. If you paid online, a refund will be processed within 5–7 business days.",
      color: "#991b1b",
    },
  };

  const { subject, headline, body, color } = config[event];

  const trackingBlock = extra.tracking_number
    ? `${divider()}<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;">
        <h4 style="margin:0 0 8px;font-size:13px;color:#166534;text-transform:uppercase;letter-spacing:1px;">Tracking Information</h4>
        <p style="margin:0 0 6px;font-size:14px;color:#333;">Tracking Number: <strong style="font-family:monospace;">${extra.tracking_number}</strong></p>
        ${extra.tracking_url ? `<a href="${extra.tracking_url}" style="display:inline-block;margin-top:10px;padding:10px 20px;background:#0f0f0f;color:#e8d5b0;text-decoration:none;border-radius:6px;font-size:13px;font-weight:600;">Track Your Package →</a>` : ""}
       </div>`
    : "";

  const html = shell(`
    <div style="display:inline-block;width:48px;height:48px;border-radius:50%;background:${color}18;text-align:center;line-height:48px;font-size:24px;margin-bottom:16px;">
      ${{ order_confirmed: "✓", order_processing: "⚙", order_shipped: "📦", order_out_for_delivery: "🚚", order_delivered: "🎉", order_cancelled: "✕" }[event]}
    </div>
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0f0f0f;">${headline}</h1>
    <p style="margin:0 0 4px;color:#555;font-size:14px;">Hi ${order.full_name},</p>
    <p style="margin:0 0 24px;color:#555;font-size:14px;">${body}</p>

    ${event !== "order_cancelled" ? buildTimeline(event) : ""}
    ${trackingBlock}
    ${divider()}

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${infoRow("Order ID", `<span style="font-family:monospace;background:#f5f5f5;padding:2px 8px;border-radius:4px;">#${order.order_number}</span>`)}
      ${infoRow("Status", statusBadge(event.replace("order_", "").replace(/_/g, " ")))}
      ${infoRow("Total", `<strong>${formatPrice(order.total_amount)}</strong>`)}
    </table>

    ${event === "order_delivered" ? `${divider()}<div style="background:#f9f8f5;border-radius:8px;padding:20px;text-align:center;">
      <p style="margin:0 0 8px;font-size:15px;font-weight:600;color:#0f0f0f;">⭐ Enjoying your purchase?</p>
      <p style="margin:0;font-size:13px;color:#666;">We'd love to hear your feedback. Your review helps other collectors make informed decisions.</p>
    </div>` : ""}
  `, `${headline} — Order #${order.order_number}`);

  return { subject, html };
}

function adminNewOrderEmail(order: any): { subject: string; html: string } {
  const subject = `🛒 New Order #${order.order_number} — ${formatPrice(order.total_amount)}`;
  const html = shell(`
    <div style="background:#0f0f0f;color:#e8d5b0;padding:16px 20px;border-radius:8px;margin-bottom:24px;">
      <span style="font-size:13px;text-transform:uppercase;letter-spacing:1px;">New Order Received</span>
      <span style="float:right;font-size:18px;font-weight:700;">${formatPrice(order.total_amount)}</span>
    </div>

    <h3 style="margin:0 0 16px;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#999;font-weight:600;">Customer Details</h3>
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      ${infoRow("Name", order.full_name)}
      ${infoRow("Email", order.email)}
      ${infoRow("Phone", order.phone)}
      ${infoRow("Order ID", `#${order.order_number}`)}
      ${infoRow("Date", new Date(order.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }))}
      ${infoRow("Payment", statusBadge(order.payment_status ?? "pending"))}
    </table>

    ${divider()}
    <h3 style="margin:0 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;color:#999;font-weight:600;">Items Ordered</h3>
    ${buildItemsTable(order.order_items)}
    ${buildPricingSummary(order)}

    ${divider()}
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td style="width:50%;vertical-align:top;padding-right:12px;">
          <h4 style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#999;">Ship To</h4>
          <p style="margin:0;font-size:13px;color:#333;line-height:1.7;">
            ${order.full_name}<br/>
            ${buildAddressBlock(order)}<br/>
            📞 ${order.phone}
          </p>
        </td>
        <td style="width:50%;vertical-align:top;padding-left:12px;">
          <h4 style="margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#999;">Shipping Method</h4>
          <p style="margin:0;font-size:13px;color:#333;">${order.shipping_method ?? "Standard"}</p>
        </td>
      </tr>
    </table>

    ${divider()}
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;text-align:center;">
      <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">⚡ Action required: Update order status in the admin dashboard after processing.</p>
    </div>
  `, `New order from ${order.full_name}`);

  return { subject, html };
}

// ─── Main handler ─────────────────────────────────────────────────────────────
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    const body = (await req.json()) as EmailRequest;
    const { order_id, event, tracking_number, tracking_url, cancellation_reason } = body;

    if (!order_id || !event) {
      return json(400, { error: "Missing order_id or event" });
    }


    // ── Fetch order (mapped from MV schema) ──────────────────────────────────
    const { data: raw, error: orderErr } = await supabase
      .from("orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderErr || !raw) {
      return new Response(JSON.stringify({ error: `Order not found: ${orderErr?.message}` }), { status: 404 });
    }

    const lineItems = Array.isArray(raw.line_items) ? raw.line_items : [];
    const order: any = {
      ...raw,
      full_name: raw.customer_name,
      email: raw.customer_email,
      phone: raw.customer_phone,
      address_line1: raw.shipping_address,
      address_line2: raw.shipping_address2,
      shipping_cost: Number(raw.shipping_amount ?? 0),
      shipping_method: raw.shipping_method ?? "Standard",
      discount_amount: Number(raw.discount_amount ?? 0),
      subtotal: Number(raw.subtotal ?? 0),
      total_amount: Number(raw.total_amount ?? 0),
      city: raw.shipping_city,
      state: raw.shipping_state,
      pincode: raw.shipping_pincode,
      order_items: lineItems.map((i: any) => ({
        product_name: i.title ?? i.product_name ?? "Item",
        quantity: Number(i.quantity ?? 1),
        unit_price: Number(i.price ?? i.unit_price ?? 0),
        variant: i.variant ?? null,
      })),
    };


    const results: Record<string, unknown> = {};

    // ── Customer email ───────────────────────────────────────────────────────
    {
      const customerKey = idempotencyKey(order_id, event, "customer");
      if (await alreadySent(customerKey)) {
        results.customer = { skipped: true, reason: "already_sent" };
      } else {
        let emailContent: { subject: string; html: string };
        if (event === "order_confirmed") {
          emailContent = customerConfirmationEmail(order);
        } else {
          emailContent = customerStatusEmail(order, event, { tracking_number, tracking_url, cancellation_reason });
        }

        const { id: resendId, error: sendErr } = await sendEmail(order.email, emailContent.subject, emailContent.html);
        const status = sendErr ? "failed" : "sent";

        await logEmail({
          order_id,
          event,
          recipient: order.email,
          recipient_type: "customer",
          subject: emailContent.subject,
          idempotency_key: customerKey,
          status,
          resend_id: resendId,
          error: sendErr,
        });

        results.customer = sendErr ? { error: sendErr } : { sent: true, resend_id: resendId };
      }
    }

    // ── Admin email (only on new order) ──────────────────────────────────────
    if (event === "order_confirmed") {
      const adminKey = idempotencyKey(order_id, event, "admin");
      if (await alreadySent(adminKey)) {
        results.admin = { skipped: true, reason: "already_sent" };
      } else {
        const emailContent = adminNewOrderEmail(order);
        const { id: resendId, error: sendErr } = await sendEmail(ADMIN_EMAIL, emailContent.subject, emailContent.html);
        const status = sendErr ? "failed" : "sent";

        await logEmail({
          order_id,
          event,
          recipient: ADMIN_EMAIL,
          recipient_type: "admin",
          subject: emailContent.subject,
          idempotency_key: adminKey,
          status,
          resend_id: resendId,
          error: sendErr,
        });

        results.admin = sendErr ? { error: sendErr } : { sent: true, resend_id: resendId };
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[send-order-email] Fatal:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
