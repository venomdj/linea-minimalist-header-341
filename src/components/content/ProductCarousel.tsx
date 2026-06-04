import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import ProductCard from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/useProducts";

const ProductCarousel = () => {
  const ref = useScrollReveal();
  const { products, loading } = useProducts();

  return (
    <section ref={ref} className="reveal w-full py-16 md:py-20 lg:py-28">
      <div className="px-4 sm:px-6 lg:px-12 flex items-end justify-between mb-8 md:mb-10 gap-4">
        <div className="min-w-0">
          <p className="eyebrow mb-2 md:mb-3 flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-verified animate-pulse" />
            Live Vault · Realtime sync
          </p>
          <h2 className="font-display text-2xl sm:text-3xl md:text-5xl tracking-tight text-foreground">
            The collection, in motion.
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2">
            {loading ? "Syncing vault…" : `${products.length} authenticated card${products.length === 1 ? "" : "s"} available now`}
          </p>
        </div>
        <Link
          to="/category/all"
          className="hidden md:inline-block text-sm text-muted-foreground hover:text-foreground transition-colors border-b border-border hover:border-foreground/40 pb-1 shrink-0"
        >
          See full market
        </Link>
      </div>

      {loading ? (
        <div className="px-4 sm:px-6 lg:px-12 flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="basis-[70%] sm:basis-[45%] md:basis-1/3 lg:basis-1/4 xl:basis-1/5 shrink-0">
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="h-4 w-2/3 mt-3" />
              <Skeleton className="h-3 w-1/3 mt-2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="mx-4 sm:mx-6 lg:mx-12 border border-dashed border-border p-10 md:p-16 text-center">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            No listings detected — the vault is being prepared.
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            New drops will appear here automatically.
          </p>
        </div>
      ) : (
        <Carousel opts={{ align: "start", loop: false, dragFree: true }} className="w-full">
          <div className="relative">
            <CarouselContent className="px-4 sm:px-6 lg:px-12 -ml-3">
              {products.map((p, i) => (
                <CarouselItem
                  key={String(p.id)}
                  className="pl-3 basis-[78%] sm:basis-[45%] md:basis-1/3 lg:basis-1/4 xl:basis-1/5 animate-fade-in"
                  style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                >
                  <ProductCard product={p} priority={i < 4} />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="hidden md:block">
              <CarouselPrevious className="left-4 lg:left-6 bg-background/60 backdrop-blur-md border-border text-foreground hover:bg-background hover:text-foreground" />
              <CarouselNext className="right-4 lg:right-6 bg-background/60 backdrop-blur-md border-border text-foreground hover:bg-background hover:text-foreground" />
            </div>
          </div>
        </Carousel>
      )}

      <div className="md:hidden px-4 mt-6 text-center">
        <Link
          to="/category/all"
          className="inline-block text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground border-b border-border pb-1"
        >
          See full market →
        </Link>
      </div>
    </section>
  );
};

export default ProductCarousel;
