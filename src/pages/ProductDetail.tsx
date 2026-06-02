import { useParams, Link } from "react-router-dom";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import ProductImageGallery from "../components/product/ProductImageGallery";
import ProductInfo from "../components/product/ProductInfo";
import ProductDescription from "../components/product/ProductDescription";
import ProductCarousel from "../components/content/ProductCarousel";
import { getProduct, type Product } from "../data/products";
import { useProducts } from "@/hooks/useProducts";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";

const ProductDetailSkeleton = () => (
  <div className="min-h-screen bg-background">
    <Header />
    <main className="pt-8 lg:pt-12">
      <section className="w-full px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
          <div className="lg:col-span-7 space-y-3">
            <Skeleton className="w-full aspect-[4/5]" />
            <Skeleton className="w-full aspect-[4/5]" />
          </div>
          <div className="lg:col-span-5 space-y-4 mt-8 lg:mt-0">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

const ProductDetail = () => {
  const { productId } = useParams();
  const { loading } = useProducts();

  if (loading) return <ProductDetailSkeleton />;

  const product = getProduct(productId ?? 1);

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-8 lg:pt-12 px-6 lg:px-12">
          <div className="max-w-xl mx-auto text-center py-24">
            <p className="font-display text-3xl text-foreground tracking-tight mb-4">
              Listing unavailable
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              This collectible is no longer available or has been moved.
            </p>
            <Link
              to="/category/all"
              className="inline-flex items-center gap-2 text-sm text-foreground border-b border-foreground/30 hover:border-foreground transition-colors pb-1"
            >
              Browse the marketplace
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-8 lg:pt-12">
        <section className="w-full px-6 lg:px-12">
          <div className="lg:hidden mb-6">
            <Breadcrumb>
              <BreadcrumbList className="text-muted-foreground">
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/" className="text-xs font-mono tracking-wider">HOME</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-xs font-mono tracking-wider text-foreground uppercase">
                    {product.name}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            <div className="lg:col-span-7">
              <ProductImageGallery product={product} />
            </div>
            <div className="lg:col-span-5 mt-8 lg:mt-0 lg:sticky lg:top-28 lg:h-fit">
              <ProductInfo product={product} />
              <ProductDescription product={product} />
            </div>
          </div>
        </section>

        <section className="w-full mt-24 lg:mt-32 border-t border-border/60 pt-4">
          <ProductCarousel />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
