import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import ProductCard from "@/components/product/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";

const ProductGrid = () => {
  const ref = useScrollReveal();
  const { products, loading } = useProducts();

  return (
    <section ref={ref} className="reveal w-full px-6 lg:px-12 mb-20">
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 lg:gap-x-6 lg:gap-y-16">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="font-display text-2xl text-foreground tracking-tight mb-3">
            The vault is empty
          </p>
          <p className="text-sm text-muted-foreground max-w-md">
            New authenticated collectibles will appear here once they are added by the team.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 lg:gap-x-6 lg:gap-y-16">
          {products.map((p) => (
            <ProductCard key={String(p.id)} product={p} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ProductGrid;
