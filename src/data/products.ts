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
}

// Indian numbering system, e.g. ₹1,45,000
const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export const formatPrice = (n: number) => inrFormatter.format(n);

export const products: Product[] = [
  { id: 1, slug: "obsidian-vanguard-01", name: "Obsidian Vanguard", series: "Æther Order", set: "Series 01 — First Print", edition: "1st Edition", grade: "PSA 10", rarity: "Grail", price: 145000, lastSale: 138500, image: card01, hoverImage: hero01, verified: true, isNew: true, population: 12 },
  { id: 2, slug: "lumen-archivist-02", name: "Lumen Archivist", series: "Silent Chronicle", set: "Vol. II — Holofoil", edition: "Promo", grade: "PSA 10", rarity: "Legendary", price: 68000, lastSale: 64500, image: card02, hoverImage: hero02, verified: true, population: 47 },
  { id: 3, slug: "crimson-monolith-03", name: "Crimson Monolith", series: "Eclipse Saga", set: "Series 03", edition: "1st Edition", grade: "PSA 9", rarity: "Epic", price: 31500, lastSale: 33000, image: card03, hoverImage: hero03, verified: true, isNew: true, population: 184 },
  { id: 4, slug: "halcyon-relic-04", name: "Halcyon Relic", series: "Hollow Vow", set: "Tournament Promo", edition: "Limited", grade: "BGS 9.5", rarity: "Legendary", price: 49000, image: card04, hoverImage: handling, verified: true, population: 63 },
  { id: 5, slug: "ivory-revenant-05", name: "Ivory Revenant", series: "Æther Order", set: "Series 01", edition: "1st Edition", grade: "PSA 10", rarity: "Epic", price: 19800, lastSale: 18600, image: card02, hoverImage: card04, verified: true, population: 220 },
  { id: 6, slug: "nocturne-blade-06", name: "Nocturne Blade", series: "Silent Chronicle", set: "Vol. I", edition: "Unlimited", grade: "PSA 10", rarity: "Rare", price: 7800, lastSale: 8400, image: card03, hoverImage: card01, verified: true, population: 412 },
  { id: 7, slug: "solace-emissary-07", name: "Solace Emissary", series: "Lantern Codex", set: "Series 02", edition: "1st Edition", grade: "PSA 9", rarity: "Epic", price: 25500, image: card01, hoverImage: card02, verified: true, isNew: true, population: 156 },
  { id: 8, slug: "vesper-warden-08", name: "Vesper Warden", series: "Eclipse Saga", set: "Series 02", edition: "Unlimited", grade: "PSA 10", rarity: "Rare", price: 11600, lastSale: 11000, image: card04, hoverImage: card03, verified: true, population: 308 },
  { id: 9, slug: "auric-herald-09", name: "Auric Herald", series: "Hollow Vow", set: "Promo", edition: "Limited", grade: "PSA 10", rarity: "Legendary", price: 43200, image: hero01, hoverImage: hero02, verified: true, population: 88 },
  { id: 10, slug: "shadow-cartographer-10", name: "Shadow Cartographer", series: "Lantern Codex", set: "Series 01 — Foil", edition: "1st Edition", grade: "PSA 10", rarity: "Epic", price: 22000, lastSale: 21100, image: hero03, hoverImage: card01, verified: true, population: 198 },
  { id: 11, slug: "wraithlight-oracle-11", name: "Wraithlight Oracle", series: "Silent Chronicle", set: "Vol. III", edition: "1st Edition", grade: "PSA 9", rarity: "Rare", price: 5750, image: card02, hoverImage: card03, verified: true, population: 540 },
  { id: 12, slug: "celestine-pact-12", name: "Celestine Pact", series: "Æther Order", set: "Series 02", edition: "Unlimited", grade: "PSA 10", rarity: "Common", price: 5400, lastSale: 5750, image: card03, hoverImage: card04, verified: false, population: 1240 },
];

// Runtime registry so DB-fetched products can be resolved by getProduct(id)
const runtimeProducts = new Map<string, Product>();
export const registerProducts = (list: Product[]) => {
  for (const p of list) runtimeProducts.set(String(p.id), p);
};

export const getProduct = (id: number | string) => {
  const key = String(id);
  const fromRuntime = runtimeProducts.get(key);
  if (fromRuntime) return fromRuntime;
  if (typeof id === "string" && !/^\d+$/.test(id)) {
    return products.find((p) => String(p.id) === id) ?? products[0];
  }
  const n = typeof id === "string" ? parseInt(id, 10) : id;
  return products.find((p) => p.id === n) ?? products[0];
};

export const rarityClass: Record<Rarity, string> = {
  Common: "text-rarity-common border-rarity-common/30",
  Rare: "text-rarity-rare border-rarity-rare/40",
  Epic: "text-rarity-epic border-rarity-epic/40",
  Legendary: "text-rarity-legendary border-rarity-legendary/50",
  Grail: "text-rarity-grail border-rarity-grail/60",
};
