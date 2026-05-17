import { Link } from "react-router-dom";
import { BadgeCheck } from "lucide-react";
import { Product, formatPrice, rarityClass } from "@/data/products";

interface Props {
  product: Product;
  priority?: boolean;
}

const ProductCard = ({ product, priority }: Props) => {
  const trend = product.lastSale ? product.price - product.lastSale : 0;
  const trendPct = product.lastSale ? ((trend / product.lastSale) * 100) : 0;

  return (
    <Link
      to={`/product/${product.id}`}
      className="group block hover-lift"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-1 shine">
        {/* Primary image */}
        <img
          src={product.image}
          alt={product.name}
          loading={priority ? "eager" : "lazy"}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-[1200ms] ease-expo-out group-hover:scale-105 group-hover:opacity-0"
        />
        {/* Hover image */}
        {product.hoverImage && (
          <img
            src={product.hoverImage}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover scale-105 opacity-0 transition-all duration-[1200ms] ease-expo-out group-hover:scale-100 group-hover:opacity-100"
          />
        )}

        {/* Gradient veil */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/0 to-background/0 pointer-events-none" />

        {/* Top-left meta chips */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] tracking-[0.18em] uppercase font-mono border bg-background/40 backdrop-blur-md ${rarityClass[product.rarity]}`}>
            {product.rarity}
          </span>
          {product.isNew && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-[10px] tracking-[0.18em] uppercase font-mono border border-foreground/30 text-foreground bg-background/40 backdrop-blur-md">
              <span className="w-1 h-1 bg-foreground rounded-full pulse-dot" /> New Listing
            </span>
          )}
        </div>

        {/* Top-right grade */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          <span className="px-2 py-1 text-[10px] tracking-[0.18em] uppercase font-mono border border-foreground/15 text-foreground/90 bg-background/40 backdrop-blur-md">
            {product.grade}
          </span>
          {product.verified && (
            <span className="flex items-center gap-1 px-2 py-1 text-[10px] tracking-[0.18em] uppercase font-mono text-verified bg-background/40 backdrop-blur-md border border-verified/30">
              <BadgeCheck size={11} strokeWidth={2} /> Verified
            </span>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="pt-4 space-y-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow truncate">{product.series}</p>
            <h3 className="font-display text-base text-foreground tracking-tight truncate mt-0.5 group-hover:text-foreground/90 transition-colors">
              {product.name}
            </h3>
          </div>
          <div className="text-right shrink-0">
            <p className="font-display text-base text-foreground tabular-nums">{formatPrice(product.price)}</p>
            {product.lastSale && (
              <p className={`text-[10px] tabular-nums font-mono ${trend >= 0 ? "text-verified" : "text-destructive"}`}>
                {trend >= 0 ? "↑" : "↓"} {Math.abs(trendPct).toFixed(1)}%
              </p>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground/80 truncate">{product.set}</p>
      </div>
    </Link>
  );
};

export default ProductCard;
