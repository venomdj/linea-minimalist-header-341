import { useState } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import CategoryHeader from "../components/category/CategoryHeader";
import CategoryFilter from "../components/category/CategoryFilter";
import FilterSortBar from "../components/category/FilterSortBar";
import ProductGrid from "../components/category/ProductGrid";
import { useProducts } from "@/hooks/useProducts";

const Category = () => {
  const { category } = useParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { products } = useProducts();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-6">
        <CategoryHeader 
          category={category || 'All Products'} 
        />
        
        {/* New Category Filter Bar */}
        <section className="w-full px-6 lg:px-12 py-8 border-b border-border/40 mb-8">
          <div className="space-y-4">
            <p className="text-xs font-mono tracking-wider text-muted-foreground uppercase">Filter by Category</p>
            <CategoryFilter showCount={true} />
          </div>
        </section>
        
        <FilterSortBar 
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
          itemCount={products.length}
        />
        
        <ProductGrid />
      </main>
      
      <Footer />
    </div>
  );
};

export default Category;
