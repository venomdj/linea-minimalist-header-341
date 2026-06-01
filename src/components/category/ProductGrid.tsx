import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import ProductCard from "@/components/product/ProductCard";
import Pagination from "./Pagination";
import { products as seedProducts } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";

const ProductGrid = () => {
  const ref = useScrollReveal();
  const { products, loading } = useProducts();

  const list = products.length > 0 ? products : seedProducts;

  return (
    <section ref={ref} className="reveal w-full px-6 lg:px-12 mb-20">
      {loading && products.length === 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 lg:gap-x-6 lg:gap-y-16">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[3/4]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 lg:gap-x-6 lg:gap-y-16">
          {list.map((p) => (
            <ProductCard key={String(p.id)} product={p} />
          ))}
        </div>
      )}
      <Pagination />
    </section>
  );
};

export default ProductGrid;
