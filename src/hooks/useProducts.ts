import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { registerProducts, type Product, type Rarity } from "@/data/products";

const RARITIES: Rarity[] = ["Common", "Rare", "Epic", "Legendary", "Grail"];
const FALLBACK_IMG = "/placeholder.svg";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export type DbProduct = {
  id: string;
  title: string;
  price: number | string;
  description: string | null;
  image_url: string | null;
  category: string | null;
  stock: number;
  featured: boolean;
  series: string | null;
  set_name: string | null;
  edition: string | null;
  grade: string | null;
  rarity: string | null;
  last_sale: number | string | null;
  verified: boolean;
  is_new: boolean;
  population: number | null;
  created_at: string;
  updated_at: string;
};

export const mapDbToProduct = (p: DbProduct): Product => {
  const rarity = (RARITIES.includes((p.rarity ?? "") as Rarity) ? p.rarity : "Rare") as Rarity;
  return {
    id: p.id,
    slug: slugify(p.title),
    name: p.title,
    series: p.series ?? p.category ?? "MYTHICAL VAULT",
    set: p.set_name ?? p.category ?? "—",
    edition: p.edition ?? "1st Edition",
    grade: p.grade ?? "PSA 10",
    rarity,
    price: Number(p.price ?? 0),
    lastSale: p.last_sale != null ? Number(p.last_sale) : undefined,
    image: p.image_url || FALLBACK_IMG,
    hoverImage: undefined,
    verified: p.verified,
    isNew: p.is_new,
    population: p.population ?? undefined,
  };
};

// Shared fetch cache so multiple hook instances don't each fire a separate query
let sharedProducts: Product[] = [];
let sharedRows: DbProduct[] = [];
let sharedLoading = true;
let sharedError: string | null = null;
const listeners = new Set<() => void>();
let channelCreated = false;

const notify = () => listeners.forEach((fn) => fn());

const load = async () => {
  sharedLoading = true;
  notify();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    sharedError = error.message;
    sharedProducts = [];
    sharedRows = [];
  } else {
    const list = (data as DbProduct[]) ?? [];
    sharedRows = list;
    const mapped = list.map(mapDbToProduct);
    registerProducts(mapped);
    sharedProducts = mapped;
    sharedError = null;
  }
  sharedLoading = false;
  notify();
};

const ensureChannel = () => {
  if (channelCreated) return;
  channelCreated = true;
  supabase
    .channel("products-realtime-shared")
    .on("postgres_changes", { event: "*", schema: "public", table: "products" }, () => load())
    .subscribe();
};

export function useProducts() {
  const [, rerender] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const trigger = () => { if (mountedRef.current) rerender((n) => n + 1); };
    listeners.add(trigger);

    // Kick off initial load only once across all instances
    if (sharedLoading && sharedProducts.length === 0 && sharedError === null) {
      load();
    }
    ensureChannel();

    return () => {
      mountedRef.current = false;
      listeners.delete(trigger);
    };
  }, []);

  return {
    products: sharedProducts,
    rows: sharedRows,
    loading: sharedLoading,
    error: sharedError,
    reload: load,
  };
}
