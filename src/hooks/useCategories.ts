import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon_name: string | null;
  color_hex: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// Shared fetch cache so multiple hook instances don't each fire a separate query
let sharedCategories: Category[] = [];
let sharedLoading = true;
let sharedError: string | null = null;
const listeners = new Set<() => void>();
let channelCreated = false;

const notify = () => listeners.forEach((fn) => fn());

const load = async () => {
  sharedLoading = true;
  notify();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) {
    sharedError = error.message;
    sharedCategories = [];
  } else {
    sharedCategories = (data as Category[]) ?? [];
    sharedError = null;
  }
  sharedLoading = false;
  notify();
};

const ensureChannel = () => {
  if (channelCreated) return;
  channelCreated = true;
  supabase
    .channel("categories-realtime-shared")
    .on("postgres_changes", { event: "*", schema: "public", table: "categories" }, () => load())
    .subscribe();
};

export function useCategories() {
  const [, rerender] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const trigger = () => {
      if (mountedRef.current) rerender((n) => n + 1);
    };
    listeners.add(trigger);

    // Kick off initial load only once across all instances
    if (sharedLoading && sharedCategories.length === 0 && sharedError === null) {
      load();
    }
    ensureChannel();

    return () => {
      mountedRef.current = false;
      listeners.delete(trigger);
    };
  }, []);

  return {
    categories: sharedCategories,
    loading: sharedLoading,
    error: sharedError,
    reload: load,
  };
}
