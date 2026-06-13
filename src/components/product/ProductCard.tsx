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
  const outOfStock = product.inStock === false;

  return (
    <Link
      to={`/product/${product.id}`}
      className={`group block hover-lift ${outOfStock ? "pointer-events-auto" : ""}`}
      aria-label={outOfStock ? `${product.name} — Out of Stock` : product.name}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-surface-1 shine">
        {/* Primary image */}
        <img
          src={product.image}
          alt={product.name}
          loading={priority ? "eager" : "lazy"}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-[450ms] ease-expo-out ${product.hoverImage && !outOfStock ? "group-hover:scale-105 group-hover:opacity-0" : "group-hover:scale-105"} ${outOfStock ? "opacity-50 grayscale" : ""}`}
        />
        {/* Hover image */}
        {product.hoverImage && !outOfStock && (
          <img
            src={product.hoverImage}
            alt=""
            aria-hidden
            loading="eager"
            className="absolute inset-0 w-full h-full object-cover scale-105 opacity-0 transition-opacity duration-[450ms] ease-expo-out group-hover:scale-100 group-hover:opacity-100"
          />
        )}

        {/* Gradient veil */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-background/0 to-background/0 pointer-events-none" />

        {/* Out of Stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px]">
            <span className="px-4 py-2 text-[11px] tracking-[0.22em] uppercase font-mono border border-foreground/40 text-foreground bg-background/80 backdrop-blur-sm">
              Out of Stock
            </span>
          </div>
        )}

        {/* Top-left meta chips */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          <span className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] tracking-[0.18em] uppercase font-mono border bg-background/40 backdrop-blur-md ${rarityClass[product.rarity]}`}>
            {product.rarity}
          </span>
          {product.isNew && !outOfStock && (
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
            <h3 className={`font-display text-base tracking-tight truncate mt-0.5 transition-colors ${outOfStock ? "text-muted-foreground" : "text-foreground group-hover:text-foreground/90"}`}>
              {product.name}
            </h3>
          </div>
          <div className="text-right shrink-0">
            <p className={`font-display text-base tabular-nums ${outOfStock ? "text-muted-foreground line-through" : "text-foreground"}`}>
              {formatPrice(product.price)}
            </p>
            {product.lastSale && !outOfStock && (
              <p className={`text-[10px] tabular-nums font-mono ${trend >= 0 ? "text-verified" : "text-destructive"}`}>
                {trend >= 0 ? "↑" : "↓"} {Math.abs(trendPct).toFixed(1)}%
              </p>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground/80 truncate">{product.set}</p>
        {outOfStock && (
          <p className="text-[10px] font-mono tracking-widest uppercase text-muted-foreground">
            Out of Stock
          </p>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
