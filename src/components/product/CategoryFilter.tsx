import { useRef, useEffect, useState } from "react";
import { useCategories } from "@/hooks/useCategories";

interface Props {
  active: string | null; // null = "All"
  onChange: (slug: string | null) => void;
  totalCount: number;
}

const CategoryFilter = ({ active, onChange, totalCount }: Props) => {
  const { categories, loading } = useCategories();
  const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  // Slide the underline indicator to the active button
  useEffect(() => {
    const btn = activeRef.current;
    const container = listRef.current;
    if (!btn || !container) return;

    const containerRect = container.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setIndicatorStyle({
      width: btnRect.width,
      transform: `translateX(${btnRect.left - containerRect.left + container.scrollLeft}px)`,
    });
  }, [active, categories]);

  if (loading && categories.length === 0) {
    return (
      <div className="w-full px-6 lg:px-12 mb-8">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-9 rounded-none bg-muted/40 animate-pulse"
              style={{ width: i === 0 ? 60 : 100 }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="w-full px-6 lg:px-12 mb-8">
      {/* Label */}
      <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">
        Browse by category
      </p>

      {/* Scrollable filter strip */}
      <div className="relative">
        <div
          ref={listRef}
          className="flex gap-0 overflow-x-auto scrollbar-none border-b border-border"
          style={{ scrollbarWidth: "none" }}
        >
          {/* "All" tab */}
          <button
            ref={active === null ? activeRef : undefined}
            onClick={() => onChange(null)}
            className={`
              relative flex items-center gap-2 px-4 py-2.5 font-mono text-xs tracking-widest uppercase
              whitespace-nowrap transition-colors duration-200 border-b-2 -mb-px shrink-0
              ${active === null
                ? "text-foreground border-foreground"
                : "text-muted-foreground border-transparent hover:text-foreground/70 hover:border-foreground/30"
              }
            `}
          >
            All
            <span
              className={`
                inline-flex items-center justify-center min-w-[20px] h-5 px-1.5
                text-[10px] font-mono rounded-sm transition-colors duration-200
                ${active === null
                  ? "bg-foreground text-background"
                  : "bg-muted/60 text-muted-foreground"
                }
              `}
            >
              {totalCount}
            </span>
          </button>

          {/* Category tabs */}
          {categories.map((cat) => (
            <button
              key={cat.id}
              ref={active === cat.slug ? activeRef : undefined}
              onClick={() => onChange(cat.slug)}
              className={`
                relative flex items-center gap-2 px-4 py-2.5 font-mono text-xs tracking-widest uppercase
                whitespace-nowrap transition-colors duration-200 border-b-2 -mb-px shrink-0
                ${active === cat.slug
                  ? "text-foreground border-foreground"
                  : "text-muted-foreground border-transparent hover:text-foreground/70 hover:border-foreground/30"
                }
              `}
            >
              {cat.name}
              <span
                className={`
                  inline-flex items-center justify-center min-w-[20px] h-5 px-1.5
                  text-[10px] font-mono rounded-sm transition-colors duration-200
                  ${active === cat.slug
                    ? "bg-foreground text-background"
                    : "bg-muted/60 text-muted-foreground"
                  }
                `}
              >
                {cat.productCount ?? 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Active category description (subtle, only when filtering) */}
      {active !== null && (() => {
        const cat = categories.find((c) => c.slug === active);
        return cat?.description ? (
          <p className="mt-3 text-xs text-muted-foreground/70 font-mono">
            {cat.description}
          </p>
        ) : null;
      })()}
    </section>
  );
};

export default CategoryFilter;
