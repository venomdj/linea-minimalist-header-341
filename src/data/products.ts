// Product images are managed via the admin dashboard and Supabase Storage.

export type Rarity = "Common" | "Rare" | "Epic" | "Legendary" | "Grail";

export interface Product {
  id: string | number;
  slug: string;
  name: string;
  series: string;
  set: string;
  edition: string;
  grade: string;
  rarity: Rarity;
  price: number;
  lastSale?: number;
  image: string;
  hoverImage?: string;
  verified: boolean;
  isNew?: boolean;
  population?: number;
  /** Current stock quantity from DB */
  stock?: number;
  /** Whether the item is available to purchase */
  inStock?: boolean;
}

// Indian numbering system, e.g. ₹1,45,000
const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatPrice = (n: number) => inrFormatter.format(n);

export const products: Product[] = [];

// Runtime registry so DB-fetched products can be resolved by getProduct(id)
const runtimeProducts = new Map<string, Product>();
export const registerProducts = (list: Product[]) => {
  for (const p of list) runtimeProducts.set(String(p.id), p);
};

export const getProduct = (id: number | string): Product | undefined => {
  const key = String(id);
  const fromRuntime = runtimeProducts.get(key);
  if (fromRuntime) return fromRuntime;
  if (typeof id === "string" && !/^\d+$/.test(id)) {
    return products.find((p) => String(p.id) === id);
  }
  const n = typeof id === "string" ? parseInt(id, 10) : id;
  return products.find((p) => p.id === n);
};

export const rarityClass: Record<Rarity, string> = {
  Common: "text-rarity-common border-rarity-common/30",
  Rare: "text-rarity-rare border-rarity-rare/40",
  Epic: "text-rarity-epic border-rarity-epic/40",
  Legendary: "text-rarity-legendary border-rarity-legendary/50",
  Grail: "text-rarity-grail border-rarity-grail/60",
};
