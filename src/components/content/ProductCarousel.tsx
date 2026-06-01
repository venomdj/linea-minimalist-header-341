import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import ProductCard from "@/components/product/ProductCard";
import { products as seedProducts } from "@/data/products";
import { useProducts } from "@/hooks/useProducts";

const ProductCarousel = () => {
  const ref = useScrollReveal();
  const { products } = useProducts();
  const source = products.length > 0 ? products : seedProducts;
  const featured = source.slice(0, 8);

  return (
    <section ref={ref} className="reveal w-full py-20 lg:py-28">
      <div className="px-6 lg:px-12 flex items-end justify-between mb-10">
        <div>
          <p className="eyebrow mb-3">Trending now · Last 24h</p>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight text-foreground">
            What collectors are watching.
          </h2>
        </div>
        <Link
          to="/category/all"
          className="hidden md:inline-block text-sm text-muted-foreground hover:text-foreground transition-colors border-b border-border hover:border-foreground/40 pb-1"
        >
          See full market
        </Link>
      </div>

      <Carousel opts={{ align: "start", loop: false }} className="w-full">
        <div className="relative">
          <CarouselContent className="px-6 lg:px-12 -ml-3">
            {featured.map((p) => (
              <CarouselItem key={String(p.id)} className="pl-3 basis-[70%] sm:basis-[45%] md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                <ProductCard product={p} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="hidden md:block">
            <CarouselPrevious className="left-6 bg-background/60 backdrop-blur-md border-border text-foreground hover:bg-background hover:text-foreground" />
            <CarouselNext className="right-6 bg-background/60 backdrop-blur-md border-border text-foreground hover:bg-background hover:text-foreground" />
          </div>
        </div>
      </Carousel>
    </section>
  );
};

export default ProductCarousel;
