import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import ProductCard from "@/components/product/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useEffect, useRef, useState } from "react";

interface Props {
  /** null = show all products */
  activeCategory?: string | null;
}

const ProductGrid = ({ activeCategory = null }: Props) => {
  const ref = useScrollReveal();
  const { products, loading } = useProducts();

  // Animate content swap when category changes
  const [visible, setVisible] = useState(true);
  const prevCatRef = useRef(activeCategory);

  useEffect(() => {
    if (prevCatRef.current === activeCategory) return;
    prevCatRef.current = activeCategory;
    // Fade out, swap, fade in
    setVisible(false);
    const t = setTimeout(() => setVisible(true), 160);
    return () => clearTimeout(t);
  }, [activeCategory]);

  const filtered = useMemo(() => {
    if (!activeCategory) return products;
    return products.filter((p) => {
      // p.series is mapped from category in mapDbToProduct — check both
      // We also carry category info via the raw series field fallback.
      // The cleanest approach: re-check against the DbProduct via the
      // products array which has series set to category slug when no
      // explicit series is provided.
      //
      // Since mapDbToProduct sets series = p.series ?? p.category ?? "MYTHICAL VAULT",
      // and products.category stores the slug, we use a custom attribute.
      // We piggyback on the `set` field which falls back to category slug too.
      //
      // Best: use the id-keyed raw row from useProducts(). The hook exposes
      // `rows` (DbProducts) alongside `products` (mapped). We match by id.
      return true; // Overridden below with row-level check
    });
  }, [products, activeCategory]);

  // Use rows for accurate category matching
  const { rows } = useProducts();
  const rowMap = useMemo(() => {
    const m: Record<string, string | null> = {};
    for (const r of rows) m[String(r.id)] = r.category;
    return m;
  }, [rows]);

  const displayProducts = useMemo(() => {
    if (!activeCategory) return products;
    return products.filter((p) => rowMap[String(p.id)] === activeCategory);
  }, [products, rows, activeCategory, rowMap]);

  return (
    <section ref={ref} className="reveal w-full px-6 lg:px-12 mb-20">
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
            {activeCategory ? "No products in this category" : "The vault is empty"}
          </p>
          <p className="text-sm text-muted-foreground max-w-md">
            {activeCategory
              ? "Check back soon — new authenticated collectibles are added regularly."
              : "New authenticated collectibles will appear here once they are added by the team."}
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
