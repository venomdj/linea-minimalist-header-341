// src/hooks/useAdminNotifications.ts
// Initialises OneSignal and saves the player_id to Supabase.
// Push notifications on new orders are now handled by the DB trigger (send_onesignal_push_on_order).

import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { initOneSignal } from "@/lib/onesignal";
import { savePlayerIdToSupabase } from "@/lib/pushNotifications";
import type { RealtimeChannel } from "@supabase/supabase-js";

export function useAdminNotifications() {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    async function setup() {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return;

      // Init OneSignal + save player_id so the DB trigger knows where to send pushes
      try {
        const playerId = await initOneSignal(user.id);
        if (playerId) {
          await savePlayerIdToSupabase(playerId);
          console.log("[AdminNotifications] player_id registered:", playerId);
        } else {
          console.warn("[AdminNotifications] No player_id — permission denied or ad blocker.");
        }
      } catch (err) {
        console.warn("[AdminNotifications] OneSignal init failed:", err);
      }

      // Keep Realtime subscription for UI updates (e.g. order count badge)
      // Push notifications are handled server-side by the DB trigger — no sendOrderNotification call here
      const channel = supabase
        .channel("admin-new-orders")
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "orders" },
          (payload) => {
            console.log("[AdminNotifications] New order detected:", payload.new);
            // UI-only updates can go here (toast, badge count, etc.)
          }
        )
        .subscribe((status) => {
          console.log("[AdminNotifications] Realtime status:", status);
        });

      channelRef.current = channel;
    }

    setup();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      initializedRef.current = false;
    };
  }, []);
}
