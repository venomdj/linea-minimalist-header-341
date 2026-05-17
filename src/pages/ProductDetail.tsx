import { useParams, Link } from "react-router-dom";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import ProductImageGallery from "../components/product/ProductImageGallery";
import ProductInfo from "../components/product/ProductInfo";
import ProductDescription from "../components/product/ProductDescription";
import ProductCarousel from "../components/content/ProductCarousel";
import { getProduct } from "../data/products";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

const ProductDetail = () => {
  const { productId } = useParams();
  const product = getProduct(productId ?? 1);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-8 lg:pt-12">
        <section className="w-full px-6 lg:px-12">
          <div className="lg:hidden mb-6">
            <Breadcrumb>
              <BreadcrumbList className="text-muted-foreground">
                <BreadcrumbItem><BreadcrumbLink asChild><Link to="/" className="text-xs font-mono tracking-wider">HOME</Link></BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage className="text-xs font-mono tracking-wider text-foreground uppercase">{product.name}</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16">
            <div className="lg:col-span-7">
              <ProductImageGallery />
            </div>
            <div className="lg:col-span-5 mt-8 lg:mt-0 lg:sticky lg:top-28 lg:h-fit">
              <ProductInfo />
              <ProductDescription />
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
