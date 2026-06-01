import { useEffect, useState } from "react";
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

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [rows, setRows] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setError(error.message);
      setProducts([]);
      setRows([]);
    } else {
      const list = (data as DbProduct[]) ?? [];
      setRows(list);
      const mapped = list.map(mapDbToProduct);
      registerProducts(mapped);
      setProducts(mapped);
      setError(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const channel = supabase
      .channel("products-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { products, rows, loading, error, reload: load };
}
