// supabase/functions/telegram-order-notify/index.ts
// Triggered by Supabase Database Webhook on INSERT into public.orders
//
// Deploy:
//   supabase functions deploy telegram-order-notify --no-verify-jwt
//
// Required secrets:
//   supabase secrets set TELEGRAM_BOT_TOKEN=123456:ABC-xyz
//   supabase secrets set TELEGRAM_CHAT_ID=123456789

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Order {
  id: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
}

// Supabase sends this shape for database webhooks
interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: Order;
  old_record: Order | null;
}

// ─── Telegram sender ──────────────────────────────────────────────────────────

async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string
): Promise<{ ok: boolean; error?: string }> {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',          // lets us use <b>, <code> tags
      disable_web_page_preview: true,
    }),
  });

  const json = await response.json();

  if (!response.ok || !json.ok) {
    const error = json.description ?? `HTTP ${response.status}`;
    console.error('[Telegram] API error:', error, JSON.stringify(json));
    return { ok: false, error };
  }

  return { ok: true };
}

// ─── Message formatter ────────────────────────────────────────────────────────

function formatOrderMessage(order: Order): string {
  const orderId = order.id.slice(0, 8).toUpperCase();
  const amount = typeof order.total_amount === 'number'
    ? `₹${order.total_amount.toFixed(2)}`
    : String(order.total_amount);

  const statusEmoji: Record<string, string> = {
    pending:    '🕐',
    confirmed:  '✅',
    processing: '⚙️',
    shipped:    '🚚',
    delivered:  '📦',
    cancelled:  '❌',
  };

  const emoji = statusEmoji[order.status?.toLowerCase()] ?? '🛒';
  const time = new Date(order.created_at).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return [
    `${emoji} <b>New Order Received</b>`,
    ``,
    `<b>Order ID:</b> <code>#${orderId}</code>`,
    `<b>Customer:</b> ${escapeHtml(order.customer_name)}`,
    `<b>Amount:</b> ${amount}`,
    `<b>Status:</b> ${capitalize(order.status)}`,
    `<b>Time:</b> ${time}`,
  ].join('\n');
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  // Only accept POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Read env vars
  const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
  const chatId   = Deno.env.get('TELEGRAM_CHAT_ID');

  if (!botToken || !chatId) {
    console.error('[telegram-order-notify] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
    // Return 200 so Supabase doesn't keep retrying a misconfiguration
    return new Response(
      JSON.stringify({ error: 'Telegram credentials not configured.' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Parse webhook body
  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch (err) {
    console.error('[telegram-order-notify] Failed to parse request body:', err);
    return new Response('Bad request', { status: 400 });
  }

  // Only act on INSERT events for the orders table
  if (payload.type !== 'INSERT' || payload.table !== 'orders') {
    console.log(`[telegram-order-notify] Ignored: type=${payload.type} table=${payload.table}`);
    return new Response(JSON.stringify({ ignored: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const order = payload.record;
  if (!order?.id) {
    console.error('[telegram-order-notify] No record in payload:', JSON.stringify(payload));
    return new Response('No order record', { status: 400 });
  }

  console.log(`[telegram-order-notify] Processing order: ${order.id}`);

  // Send notification
  const message = formatOrderMessage(order);
  const result  = await sendTelegramMessage(botToken, chatId, message);

  if (!result.ok) {
    // Log the failure — visible in Supabase → Edge Functions → Logs
    console.error(
      `[telegram-order-notify] FAILED for order ${order.id}: ${result.error}`
    );
    // Return 200 so Supabase doesn't endlessly retry; log is enough
    return new Response(
      JSON.stringify({ success: false, orderId: order.id, error: result.error }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  console.log(`[telegram-order-notify] ✅ Notified for order ${order.id}`);
  return new Response(
    JSON.stringify({ success: true, orderId: order.id }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
});
