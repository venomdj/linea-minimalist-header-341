import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import LargeHero from "../components/content/LargeHero";
import EditorialSection from "../components/content/EditorialSection";
import ProductCarousel from "../components/content/ProductCarousel";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1">
        <LargeHero />
        <ProductCarousel />
        <EditorialSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
