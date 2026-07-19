import ProductCard from "@/components/product/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useEffect, useRef, useState } from "react";
import type { ActiveFilters } from "@/pages/Category";

interface Props {
  activeCategory?: string | null;
  activeFilters?: ActiveFilters;
}

// Normalise any string to a slug: "One Piece" → "one-piece", "pokemon" → "pokemon"
const toSlug = (s: string) => s.toLowerCase().trim().replace(/\s+/g, "-");

const PRICE_MAP: Record<string, [number, number]> = {
  "Under ₹10,000":          [0,      9999],
  "₹10,000 — ₹50,000":     [10000,  49999],
  "₹50,000 — ₹1,00,000":   [50000,  99999],
  "Over ₹1,00,000":         [100000, Infinity],
};

const ProductGrid = ({ activeCategory = null, activeFilters }: Props) => {
  const { products, rows, loading } = useProducts();

  const [visible, setVisible] = useState(true);
  const prevCatRef = useRef(activeCategory);

  useEffect(() => {
    if (prevCatRef.current === activeCategory) return;
    prevCatRef.current = activeCategory;
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 160);
    return () => clearTimeout(t);
  }, [activeCategory]);

  // Build a row-level map for category slug matching
  const rowMap = useMemo(() => {
    const m: Record<string, string | null> = {};
    for (const r of rows) m[String(r.id)] = r.category;
    return m;
  }, [rows]);

  const displayProducts = useMemo(() => {
    let list = products;

    // 1. Filter by URL category param (e.g. /category/pokemon, /category/one-piece)
    if (activeCategory && activeCategory !== "all") {
      list = list.filter((p) => {
        const dbCat = toSlug(rowMap[String(p.id)] ?? "");
        const urlCat = toSlug(activeCategory);
        return dbCat === urlCat || dbCat.includes(urlCat) || urlCat.includes(dbCat);
      });
    }

    // 2. Filter panel — categories (Pokémon / One Piece / Accessories)
    if (activeFilters?.categories?.length) {
      list = list.filter((p) => {
        const dbCat = toSlug(rowMap[String(p.id)] ?? "");
        return activeFilters.categories.some((c) => {
          const cs = toSlug(c);
          return dbCat === cs || dbCat.includes(cs) || cs.includes(dbCat);
        });
      });
    }

    // 3. Filter panel — grade
    if (activeFilters?.grades?.length) {
      list = list.filter((p) =>
        activeFilters.grades.some((g) => p.grade?.toLowerCase() === g.toLowerCase())
      );
    }

    // 4. Filter panel — price ranges
    if (activeFilters?.priceRanges?.length) {
      list = list.filter((p) =>
        activeFilters.priceRanges.some((r) => {
          const [min, max] = PRICE_MAP[r] ?? [0, Infinity];
          return p.price >= min && p.price <= max;
        })
      );
    }

    // 5. Filter panel — availability
    if (activeFilters?.availability?.length) {
      list = list.filter((p) => {
        const inStock = p.inStock ?? p.stock > 0;
        if (activeFilters.availability.includes("In Stock") && activeFilters.availability.includes("Out of Stock")) {
          return true; // both selected = show all
        }
        if (activeFilters.availability.includes("In Stock")) return inStock;
        if (activeFilters.availability.includes("Out of Stock")) return !inStock;
        return true;
      });
    }

    // 6. Sort
    const sort = activeFilters?.sortBy ?? "featured";
    if (sort === "price-low")  list = [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-high") list = [...list].sort((a, b) => b.price - a.price);
    if (sort === "newest")     list = [...list].sort((a, b) => String(b.id).localeCompare(String(a.id)));
    if (sort === "name")       list = [...list].sort((a, b) => a.name.localeCompare(b.name));

    // 7. Always push out-of-stock items to the bottom (stable within groups)
    const isInStock = (p: typeof list[number]) => (p.inStock ?? (p.stock ?? 0) > 0);
    list = [...list].sort((a, b) => Number(isInStock(b)) - Number(isInStock(a)));

    return list;
  }, [products, rows, activeCategory, activeFilters, rowMap]);

  return (
    <section className="w-full px-6 lg:px-12 mb-20">
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 lg:gap-x-6 lg:gap-y-16">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
        </div>
      ) : displayProducts.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-24 text-center transition-opacity duration-200"
          style={{ opacity: visible ? 1 : 0 }}
        >
          <p className="font-display text-2xl text-foreground tracking-tight mb-3">
            No products match these filters
          </p>
          <p className="text-sm text-muted-foreground max-w-md">
            Try adjusting or clearing your filters to see more results.
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 lg:gap-x-6 lg:gap-y-16 transition-opacity duration-200"
          style={{ opacity: visible ? 1 : 0 }}
        >
          {displayProducts.map((p) => (
            <ProductCard key={String(p.id)} product={p} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductGrid;
