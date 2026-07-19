import { useRef, useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselDots,
  type CarouselApi,
} from "@/components/ui/carousel";
import ProductCard from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/skeleton";
import { useProducts } from "@/hooks/useProducts";

const ProductCarousel = () => {
  const ref = useScrollReveal();
  const { products: allProducts, loading } = useProducts();
  // Hide out-of-stock items from the carousel — they update automatically
  // via the useProducts realtime subscription when stock changes.
  const products = useMemo(
    () => allProducts.filter((p) => (p.inStock ?? (p.stock ?? 0) > 0)),
    [allProducts]
  );
  const hasAnimated = useRef(false);
  const [api, setApi] = useState<CarouselApi>();

  // Autoplay plugin — pauses on hover/drag, auto-resumes afterward.
  // stopOnInteraction MUST be false: with `true`, the plugin kills autoplay
  // permanently on any drag/click/keyboard-nav, and there's no reliable way
  // to revive it from outside (keyboard nav fires no pointer event at all,
  // and drags that release outside the carousel's DOM bounds never trigger
  // a bubbling pointerup either). `false` lets the plugin manage its own
  // pause/resume, which is what we actually want.
  //
  // stopOnFocusIn defaults to TRUE in embla-carousel-autoplay. If anything
  // on the page (router focus-management, a skip-link, etc.) programmatically
  // focuses an element inside the carousel right after mount, autoplay
  // freezes before its first tick and only resumes on focusout — i.e. it
  // looks dead until the user clicks/tabs away. Disabling it means autoplay
  // doesn't wait on focus state at all.
  const autoplayRef = useRef<ReturnType<typeof Autoplay>>();
  if (!autoplayRef.current) {
    autoplayRef.current = Autoplay({
      delay: 1600,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      stopOnFocusIn: false,
    });
  }
  const autoplay = autoplayRef;

  // Failsafe: explicitly kick off autoplay as soon as the Embla API is ready,
  // instead of relying solely on the plugin's internal playOnInit. Guards
  // against any other init-order/timing issue silently preventing the
  // first auto-scroll.
  useEffect(() => {
    if (!api) return;
    autoplay.current?.play();
  }, [api]);

  // Stable reference so Embla never sees a "changed" options object on re-render
  const carouselOpts = useMemo(
    () => ({
      align: "center" as const,
      loop: true,
      dragFree: false,
      duration: 28,
      skipSnaps: false,
    }),
    []
  );

  return (
    <section ref={ref} className="reveal w-full py-16 md:py-20 lg:py-28">
      {/* Header */}
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
            {loading
              ? "Syncing vault…"
              : `${products.length} authenticated card${products.length === 1 ? "" : "s"} available now`}
          </p>
        </div>
        <Link
          to="/category/all"
          className="hidden md:inline-block text-sm text-muted-foreground hover:text-foreground transition-colors border-b border-border hover:border-foreground/40 pb-1 shrink-0"
        >
          See full market
        </Link>
      </div>

      {/* Loading skeletons */}
      {loading ? (
        <div className="px-4 sm:px-6 lg:px-12 flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="basis-[70%] sm:basis-[45%] md:basis-1/3 lg:basis-1/4 xl:basis-1/5 shrink-0"
            >
              <Skeleton className="aspect-[3/4] w-full" />
              <Skeleton className="h-4 w-2/3 mt-3" />
              <Skeleton className="h-3 w-1/3 mt-2" />
            </div>
          ))}
        </div>

      /* Empty state */
      ) : products.length === 0 ? (
        <div className="mx-4 sm:mx-6 lg:mx-12 border border-dashed border-border p-10 md:p-16 text-center">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            No listings detected — the vault is being prepared.
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            New drops will appear here automatically.
          </p>
        </div>

      /* Carousel */
      ) : (
        <>
          <Carousel
            setApi={setApi}
            opts={carouselOpts}
            plugins={[autoplay.current]}
            className="w-full"
            aria-label="Featured products"
          >
            <div className="relative">
              {/* Left fade edge */}
              <div className="pointer-events-none absolute left-0 top-0 h-full w-8 z-10 bg-gradient-to-r from-background to-transparent" />
              {/* Right fade edge */}
              <div className="pointer-events-none absolute right-0 top-0 h-full w-8 z-10 bg-gradient-to-l from-background to-transparent" />

              <CarouselContent className="px-4 sm:px-6 lg:px-12 -ml-3">
                {products.map((p, i) => {
                  const shouldAnimate = !hasAnimated.current;
                  return (
                    <CarouselItem
                      key={String(p.id)}
                      className={`pl-3 basis-[78%] sm:basis-[45%] md:basis-1/3 lg:basis-1/4 xl:basis-1/5 ${shouldAnimate ? "animate-fade-in" : ""}`}
                      style={{
                        animationDelay: shouldAnimate ? `${Math.min(i, 8) * 40}ms` : undefined,
                        willChange: "transform",
                      }}
                      aria-label={`Product ${i + 1} of ${products.length}: ${p.name ?? "Untitled"}`}
                    >
                      <ProductCard product={p} priority={i < 4} />
                    </CarouselItem>
                  );
                })}
              </CarouselContent>

              {/* Nav arrows — desktop only */}
              <div className="hidden md:block">
                <CarouselPrevious
                  aria-label="Previous products"
                  className="left-4 lg:left-6 bg-background/60 backdrop-blur-md border-border text-foreground hover:bg-background hover:text-foreground"
                />
                <CarouselNext
                  aria-label="Next products"
                  className="right-4 lg:right-6 bg-background/60 backdrop-blur-md border-border text-foreground hover:bg-background hover:text-foreground"
                />
              </div>
            </div>

            {/* Dot indicators */}
            <CarouselDots className="mt-6 px-4" />
          </Carousel>
        </>
      )}

      {/* Mark animation done after first render */}
      {!hasAnimated.current && products.length > 0 && !loading &&
        (() => { hasAnimated.current = true; return null; })()}

      {/* Mobile "See full market" link */}
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
