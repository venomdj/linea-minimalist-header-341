import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AnnouncementType = "info" | "warning" | "success" | "error";
export type DisplayMode = "modal" | "banner" | "both";

export type Announcement = {
  id: string;
  title: string;
  message: string;
  type: AnnouncementType;
  cta_label: string | null;
  cta_link: string | null;
  starts_at: string | null;
  ends_at: string | null;
  priority: number;
  display_mode: DisplayMode;
  enabled: boolean;
  created_at: string;
  updated_at: string;
};

const isLive = (a: Announcement) => {
  const now = Date.now();
  if (!a.enabled) return false;
  if (a.starts_at && new Date(a.starts_at).getTime() > now) return false;
  if (a.ends_at && new Date(a.ends_at).getTime() < now) return false;
  return true;
};

/** Public-facing: the single highest-priority live announcement, realtime synced. */
export const useActiveAnnouncement = () => {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .eq("enabled", true)
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });

    const live = ((data ?? []) as unknown as Announcement[]).filter(isLive);
    setAnnouncement(live[0] ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    const channel = supabase
      .channel("announcements-public")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => load())
      .subscribe();

    // Re-evaluate scheduling windows periodically
    const interval = setInterval(load, 60_000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [load]);

  return { announcement, loading, reload: load };
};

/** Admin: every announcement regardless of state. */
export const useAllAnnouncements = () => {
  const [rows, setRows] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    setRows((data ?? []) as unknown as Announcement[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { rows, loading, reload };
};
