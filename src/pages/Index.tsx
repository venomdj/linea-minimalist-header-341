import { useState } from "react";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import LargeHero from "../components/content/LargeHero";
import EditorialSection from "../components/content/EditorialSection";
import ProductCarousel from "../components/content/ProductCarousel";
import CategoryFilter from "../components/product/CategoryFilter";
import ProductGrid from "../components/category/ProductGrid";
import { useProducts } from "../hooks/useProducts";

const Index = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const { products, rows } = useProducts();

  // Total count for the "All" badge
  const totalCount = products.length;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1">
        <LargeHero />
        <ProductCarousel />

        {/* ── Category filter + filtered grid ─────────────────────────── */}
        <CategoryFilter
          active={activeCategory}
          onChange={setActiveCategory}
          totalCount={totalCount}
        />
        <ProductGrid activeCategory={activeCategory} />

        <EditorialSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
