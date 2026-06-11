import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryFilterProps {
  onCategoryChange?: (categorySlug: string | null) => void;
  showCount?: boolean;
  isResponsive?: boolean;
}

const CategoryFilter = ({ onCategoryChange, showCount = true, isResponsive = true }: CategoryFilterProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { categories, loading } = useCategories();
  const [activeCategory, setActiveCategory] = useState<string | null>(
    searchParams.get("category") || null
  );

  const handleCategoryClick = (slug: string | null) => {
    setActiveCategory(slug);
    onCategoryChange?.(slug);

    if (slug) {
      navigate(`/category/${slug}`, { replace: false });
    } else {
      navigate("/", { replace: false });
    }
  };

  useEffect(() => {
    const categoryParam = searchParams.get("category");
    setActiveCategory(categoryParam);
  }, [searchParams]);

  if (loading) {
    return (
      <div className={`flex gap-2 ${isResponsive ? "flex-wrap" : ""}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-32 rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${isResponsive ? "flex-wrap" : ""} gap-2 md:gap-3`}>
      {/* All Products button */}
      <Button
        onClick={() => handleCategoryClick(null)}
        variant={activeCategory === null ? "default" : "outline"}
        className={`rounded-none transition-all ${
          activeCategory === null
            ? "border-foreground bg-foreground text-background"
            : "border-border hover:border-foreground"
        }`}
      >
        <span className="text-xs md:text-sm font-mono tracking-wider uppercase">All</span>
      </Button>

      {/* Category buttons */}
      {categories.map((category) => (
        <Button
          key={category.id}
          onClick={() => handleCategoryClick(category.slug)}
          variant={activeCategory === category.slug ? "default" : "outline"}
          className={`rounded-none transition-all ${
            activeCategory === category.slug
              ? "border-foreground bg-foreground text-background"
              : "border-border hover:border-foreground"
          }`}
          title={category.description || undefined}
        >
          <span className="text-xs md:text-sm font-mono tracking-wider uppercase">
            {category.name}
          </span>
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;
