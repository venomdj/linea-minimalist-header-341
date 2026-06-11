import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import ProductCard from "@/components/product/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";

const ProductGrid = () => {
  const ref = useScrollReveal();
  const { category: categorySlug } = useParams();
  const { products, loading: productsLoading } = useProducts();
  const { categories, loading: categoriesLoading } = useCategories();

  // Find category ID by slug
  const selectedCategory = useMemo(
    () => categories.find((c) => c.slug === categorySlug),
    [categories, categorySlug]
  );

  // Filter products by category
  const filteredProducts = useMemo(() => {
    if (!categorySlug) {
      // No category selected, show all products
      return products;
    }

    if (!selectedCategory) {
      // Category slug doesn't match any category
      return [];
    }

    // Filter by category_id (will match when we add category relationships)
    return products.filter((p) => {
      // For backward compatibility with string-based categories,
      // we'll match both the new category_id and the old category string field
      if ('category_id' in p && p.category_id === selectedCategory.id) {
        return true;
      }
      // Fallback to matching by name in the category field for existing products
      if ('category' in p && typeof p.category === 'string') {
        return p.category.toLowerCase() === selectedCategory.name.toLowerCase();
      }
      return false;
    });
  }, [products, categorySlug, selectedCategory]);

  const isLoading = productsLoading || categoriesLoading;

  return (
    <section ref={ref} className="reveal w-full px-6 lg:px-12 mb-20">
      {isLoading && filteredProducts.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 lg:gap-x-6 lg:gap-y-16">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="font-display text-2xl text-foreground tracking-tight mb-3">
            No products in this category
          </p>
          <p className="text-sm text-muted-foreground max-w-md">
            {categorySlug
              ? "Try browsing other categories or check back soon for new additions."
              : "New authenticated collectibles will appear here once they are added by the team."}
          </p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          <p className="text-sm text-muted-foreground font-light">
            Showing {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 lg:gap-x-6 lg:gap-y-16 animate-in fade-in-50 duration-300">
            {filteredProducts.map((p) => (
              <ProductCard key={String(p.id)} product={p} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ProductGrid;
