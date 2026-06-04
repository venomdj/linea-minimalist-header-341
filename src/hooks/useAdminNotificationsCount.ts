import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAdminNotificationsCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { count: c } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("read", false);
      if (mounted) setCount(c ?? 0);
    };
    load();
    const channel = supabase
      .channel("notifications-count")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, load)
      .subscribe();
    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return count;
}
