import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
  /** Populated client-side by counting products */
  productCount?: number;
};

// ---------------------------------------------------------------------------
// Shared singleton cache — same pattern as useProducts so all instances
// share one fetch and one realtime channel.
// ---------------------------------------------------------------------------
let sharedCategories: Category[] = [];
let sharedLoading = true;
let sharedError: string | null = null;
const listeners = new Set<() => void>();
let channelCreated = false;

const notify = () => listeners.forEach((fn) => fn());

const load = async () => {
  sharedLoading = true;
  notify();

  // Fetch categories ordered by sort_order
  const { data: cats, error } = await supabase
    .from("categories")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    sharedError = error.message;
    sharedCategories = [];
  } else {
    // Fetch product counts per category slug
    const { data: productRows } = await supabase
      .from("products")
      .select("category");

    const countMap: Record<string, number> = {};
    for (const row of productRows ?? []) {
      if (row.category) {
        countMap[row.category] = (countMap[row.category] ?? 0) + 1;
      }
    }

    sharedCategories = (cats as Category[]).map((c) => ({
      ...c,
      productCount: countMap[c.slug] ?? 0,
    }));
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
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => load())
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
