// src/hooks/useAdminNotifications.ts
// Drop this hook into your admin layout component.
// It initialises OneSignal on mount and listens for new orders via Supabase Realtime.

import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { initOneSignal } from "@/lib/onesignal";
import { savePlayerIdToSupabase, sendOrderNotification, OrderPayload } from "@/lib/pushNotifications";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * useAdminNotifications
 *
 * 1. Waits for a logged-in admin session
 * 2. Initialises OneSignal SDK and requests push permission
 * 3. Saves the player_id to Supabase
 * 4. Opens a Supabase Realtime channel on the `orders` table (INSERT)
 * 5. Sends a push notification via OneSignal REST API on each new order
 *
 * Usage: call once in your admin root/layout component.
 */
export function useAdminNotifications() {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Prevent double-init in React Strict Mode
    if (initializedRef.current) return;
    initializedRef.current = true;

    async function setup() {
      // 1. Get current admin user
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        console.log("[AdminNotifications] No authenticated user — skipping setup.");
        return;
      }

      // 2. Initialise OneSignal
      try {
        const playerId = await initOneSignal(user.id);
        if (playerId) {
          await savePlayerIdToSupabase(playerId);
        } else {
          console.warn("[AdminNotifications] OneSignal returned no player_id (permission denied or not supported).");
        }
      } catch (err) {
        console.warn("[AdminNotifications] OneSignal init failed:", err);
        // Non-fatal: Realtime listener still runs so orders are logged
      }

      // 3. Subscribe to orders INSERT via Supabase Realtime
      const channel = supabase
        .channel("admin-new-orders")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "orders",
          },
          async (payload) => {
            console.log("[AdminNotifications] New order detected:", payload.new);
            await sendOrderNotification(payload.new as OrderPayload);
          }
        )
        .subscribe((status) => {
          console.log("[AdminNotifications] Realtime channel status:", status);
        });

      channelRef.current = channel;
    }

    setup();

    return () => {
      // Clean up Realtime subscription on unmount
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      initializedRef.current = false;
    };
  }, []);
}
