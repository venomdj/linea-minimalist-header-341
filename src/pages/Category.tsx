import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import CategoryHeader from "../components/category/CategoryHeader";
import FilterSortBar from "../components/category/FilterSortBar";
import ProductGrid from "../components/category/ProductGrid";
import { useProducts } from "@/hooks/useProducts";

export interface ActiveFilters {
  categories: string[];
  priceRanges: string[];
  grades: string[];
  sortBy: string;
}

const EMPTY_FILTERS: ActiveFilters = { categories: [], priceRanges: [], grades: [], sortBy: "featured" };

const Category = () => {
  const { category } = useParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(EMPTY_FILTERS);
  const prevCat = useRef(category);
  const { products } = useProducts();

  // Reset filters whenever the category route changes
  useEffect(() => {
    if (prevCat.current !== category) {
      prevCat.current = category;
      setActiveFilters(EMPTY_FILTERS);
    }
  }, [category]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-6">
        <CategoryHeader category={category || "all"} />

        <FilterSortBar
          filtersOpen={filtersOpen}
          setFiltersOpen={setFiltersOpen}
          itemCount={products.length}
          activeFilters={activeFilters}
          setActiveFilters={setActiveFilters}
        />

        <ProductGrid
          activeCategory={category || null}
          activeFilters={activeFilters}
        />
      </main>

      <Footer />
    </div>
  );
};

export default Category;
