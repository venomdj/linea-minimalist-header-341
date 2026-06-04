import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { BadgeCheck, Shield, TrendingUp, Heart, ShoppingBag } from "lucide-react";
import { formatPrice, rarityClass, type Product } from "@/data/products";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";

interface Props { product: Product; }

const ProductInfo = ({ product }: Props) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"buy" | "bid">("buy");
  const { add } = useCart();

  const trend = product.lastSale ? product.price - product.lastSale : 0;
  const trendPct = product.lastSale ? (trend / product.lastSale) * 100 : 0;
  const outOfStock = product.inStock === false;

  const handleBuy = () => {
    if (outOfStock) return;
    if (tab === "bid") { toast.info("Bidding coming soon"); return; }
    add(product, 1);
    toast.success(`${product.name} added to bag`);
    navigate("/checkout");
  };

  const handleAddToCart = () => {
    if (outOfStock) return;
    if (tab === "bid") { toast.info("Bidding coming soon"); return; }
    add(product, 1);
    toast.success(`${product.name} added to bag`);
  };

  return (
    <div className="space-y-8">
      <div className="hidden lg:block">
        <Breadcrumb>
          <BreadcrumbList className="text-muted-foreground">
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/" className="text-xs font-mono tracking-wider hover:text-foreground">HOME</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbLink asChild><Link to="/category/all" className="text-xs font-mono tracking-wider hover:text-foreground">MARKET</Link></BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage className="text-xs font-mono tracking-wider text-foreground uppercase">{product.name}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center px-2 py-1 text-[10px] tracking-[0.18em] uppercase font-mono border ${rarityClass[product.rarity]}`}>
            {product.rarity}
          </span>
          <span className="px-2 py-1 text-[10px] tracking-[0.18em] uppercase font-mono border border-border text-foreground/80">{product.grade}</span>
          {product.verified && (
            <span className="flex items-center gap-1 px-2 py-1 text-[10px] tracking-[0.18em] uppercase font-mono border border-verified/30 text-verified">
              <BadgeCheck size={11} /> Verified
            </span>
          )}
          {outOfStock && (
            <span className="flex items-center gap-1 px-2 py-1 text-[10px] tracking-[0.18em] uppercase font-mono border border-destructive/40 text-destructive bg-destructive/5">
              Out of Stock
            </span>
          )}
        </div>
        <p className="eyebrow">{product.series}</p>
        <h1 className="font-display text-4xl md:text-5xl tracking-tight text-foreground leading-tight">
          {product.name}
        </h1>
        <p className="text-sm text-muted-foreground">{product.set} · {product.edition}</p>
        <p className="text-[11px] font-mono tracking-wider text-muted-foreground/80 uppercase">Inclusive of all taxes</p>
      </div>

      <div className="border border-border bg-surface-1 p-6 space-y-5">
        {/* Tabs — hide bid tab when OOS since no bidding either */}
        <div className="flex border-b border-border">
          {(["buy", "bid"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-[11px] tracking-[0.18em] uppercase font-mono transition-colors ${
                tab === t ? "text-foreground border-b-2 border-foreground -mb-px" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "buy" ? "Buy Now" : "Place Bid"}
            </button>
          ))}
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <p className="eyebrow mb-1">{tab === "buy" ? "Lowest Ask" : "Highest Bid"}</p>
            <p className={`font-display text-4xl tabular-nums tracking-tight ${outOfStock ? "text-muted-foreground line-through" : "text-foreground"}`}>
              {formatPrice(tab === "buy" ? product.price : Math.round(product.price * 0.92))}
            </p>
          </div>
          {product.lastSale && (
            <div className="text-right">
              <p className="eyebrow mb-1">Last Sale</p>
              <p className="text-base text-foreground tabular-nums font-mono">{formatPrice(product.lastSale)}</p>
              <p className={`text-xs font-mono tabular-nums mt-0.5 ${trend >= 0 ? "text-verified" : "text-destructive"}`}>
                <TrendingUp size={10} className="inline -mt-0.5" /> {trend >= 0 ? "+" : ""}{trendPct.toFixed(1)}%
              </p>
            </div>
          )}
        </div>

        {outOfStock ? (
          /* ── Out of Stock state ── */
          <div className="space-y-3">
            <div className="w-full h-12 flex items-center justify-center border border-border/50 bg-muted/30 text-muted-foreground text-xs tracking-[0.22em] font-mono uppercase select-none">
              Currently Unavailable
            </div>
            <p className="text-[11px] text-muted-foreground font-mono text-center tracking-wide">
              This item is out of stock. Check back later or browse similar listings.
            </p>
          </div>
        ) : (
          /* ── In Stock state ── */
          <div className="space-y-2">
            <div className="flex gap-2">
              <Button onClick={handleBuy} className="flex-1 h-12 bg-foreground text-background hover:bg-foreground/90 rounded-none font-medium tracking-wider text-xs">
                {tab === "buy" ? `BUY NOW · ${formatPrice(product.price)}` : "PLACE A BID"}
              </Button>
              <Button variant="outline" size="icon" className="h-12 w-12 rounded-none border-border hover:border-foreground/40 bg-transparent">
                <Heart size={16} strokeWidth={1.5} />
              </Button>
            </div>
            {tab === "buy" && (
              <Button
                onClick={handleAddToCart}
                variant="outline"
                className="w-full h-12 rounded-none border-border hover:border-foreground/40 bg-transparent text-xs tracking-[0.18em] font-medium"
              >
                <ShoppingBag size={14} strokeWidth={1.5} /> ADD TO CART
              </Button>
            )}
          </div>
        )}

        <div className="flex items-center gap-3 text-[11px] font-mono tracking-wider text-muted-foreground pt-2 border-t border-border/50">
          <Shield size={12} className="text-verified" />
          ESCROW PROTECTED · INSURED SHIPPING · 7-DAY AUTHENTICATION GUARANTEE
        </div>
      </div>

      <div className="grid grid-cols-3 gap-px bg-border">
        {[
          { l: "Population", v: product.population?.toString() ?? "—" },
          { l: "Edition", v: product.edition },
          { l: "Grade", v: product.grade },
        ].map((s) => (
          <div key={s.l} className="bg-background p-4">
            <p className="eyebrow mb-1.5">{s.l}</p>
            <p className="text-sm text-foreground font-mono">{s.v}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductInfo;
