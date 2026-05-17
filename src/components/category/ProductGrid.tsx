import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import ProductCard from "@/components/product/ProductCard";
import Pagination from "./Pagination";
import { products } from "@/data/products";

const ProductGrid = () => {
  const ref = useScrollReveal();
  // Repeat to fill grid
  const grid = [...products, ...products].slice(0, 20);
  return (
    <section ref={ref} className="reveal w-full px-6 lg:px-12 mb-20">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-12 lg:gap-x-6 lg:gap-y-16">
        {grid.map((p, i) => (
          <ProductCard key={`${p.id}-${i}`} product={p} />
        ))}
      </div>
      <Pagination />
    </section>
  );
};

export default ProductGrid;
