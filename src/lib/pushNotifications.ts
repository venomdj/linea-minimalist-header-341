// src/lib/pushNotifications.ts
// Handles: persisting player IDs to Supabase, sending push via OneSignal REST API

import { supabase } from "@/integrations/supabase/client";

const REST_API_KEY = import.meta.env.VITE_ONESIGNAL_REST_API_KEY as string;
const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID as string;
const ONESIGNAL_NOTIFICATIONS_URL = "https://onesignal.com/api/v1/notifications";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OrderPayload {
  id: string;
  customer_name?: string | null;
  total?: number | null;
  status?: string | null;
  created_at?: string | null;
}

// ─── Supabase helpers ─────────────────────────────────────────────────────────

/**
 * Upsert a OneSignal player_id into admin_push_subscriptions,
 * linked to the currently authenticated admin user.
 */
export async function savePlayerIdToSupabase(playerId: string): Promise<void> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    console.warn("[Push] Cannot save player_id: no authenticated user.");
    return;
  }

  const { error } = await supabase.from("admin_push_subscriptions").upsert(
    {
      user_id: user.id,
      player_id: playerId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,player_id" }
  );

  if (error) {
    console.error("[Push] Failed to save player_id:", error.message);
  } else {
    console.log("[Push] player_id saved:", playerId);
  }
}

/**
 * Fetch all registered admin player IDs from Supabase.
 */
export async function getAllAdminPlayerIds(): Promise<string[]> {
  const { data, error } = await supabase
    .from("admin_push_subscriptions")
    .select("player_id");

  if (error) {
    console.error("[Push] Failed to fetch player IDs:", error.message);
    return [];
  }

  return (data ?? []).map((row) => row.player_id as string);
}

// ─── OneSignal REST API ───────────────────────────────────────────────────────

/**
 * Send a push notification to all registered admin devices
 * whenever a new order is placed.
 */
export async function sendOrderNotification(order: OrderPayload): Promise<void> {
  const playerIds = await getAllAdminPlayerIds();

  if (playerIds.length === 0) {
    console.warn("[Push] No admin subscriptions found — skipping notification.");
    return;
  }

  // Build a human-readable notification body
  const shortId = order.id?.slice(0, 8) ?? "unknown";
  const customer = order.customer_name ? ` from ${order.customer_name}` : "";
  const total =
    order.total != null ? ` — $${Number(order.total).toFixed(2)}` : "";

  const notificationBody = {
    app_id: APP_ID,
    include_player_ids: playerIds,
    headings: { en: "🛒 New Order Received!" },
    contents: {
      en: `Order #${shortId}${customer}${total}`,
    },
    web_url: `${window.location.origin}/orders`,
    priority: 10,
    ttl: 3600, // expire after 1 hour if undelivered
    data: {
      order_id: order.id,
      customer_name: order.customer_name ?? null,
      total: order.total ?? null,
    },
  };

  try {
    const response = await fetch(ONESIGNAL_NOTIFICATIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${REST_API_KEY}`,
      },
      body: JSON.stringify(notificationBody),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("[Push] OneSignal API error:", response.status, text);
    } else {
      const json = await response.json();
      console.log("[Push] Notification sent:", json.id);
    }
  } catch (err) {
    console.error("[Push] Network error sending notification:", err);
  }
}
