import React from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../data/products';
import { useProducts } from '../hooks/useProducts';
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import LargeHero from "../components/content/LargeHero";
import EditorialSection from "../components/content/EditorialSection";
const Index = () => {
  const { products: liveProducts, loading } = useProducts();


  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      
      <main className="flex-1">
        <LargeHero />
        
        {/* Permanent Live Card Grid Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-zinc-950/40 border border-zinc-900 my-10">
          <div className="flex items-baseline justify-between border-b border-zinc-800 pb-4 mb-10">
            <h2 className="text-sm font-light tracking-[0.2em] text-zinc-400 uppercase">
              Live Vault Listings
            </h2>
            <span className="text-[11px] font-mono text-zinc-600 uppercase tracking-widest">
              {loading ? "Syncing Feed..." : `Showing ${liveProducts.length} Authenticated Cards`}
            </span>
          </div>

          {loading ? (
            <div className="text-center py-20 font-mono text-xs tracking-widest text-zinc-600">
              CONNECTING TO VAULT DATABASE...
            </div>
          ) : liveProducts.length === 0 ? (
            <div className="text-center py-20 font-mono text-xs tracking-widest text-zinc-500 italic">
              NO CURRENT LISTINGS DETECTED IN VAULT
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {liveProducts.map((card) => (
                <div 
                  key={card.id} 
                  className="group relative bg-zinc-900/10 border border-zinc-900/80 p-4 flex flex-col justify-between transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/30"
                >
                  {/* Card Image Container */}
                  <div className="aspect-[3/4] w-full overflow-hidden bg-black/40 border border-zinc-900 flex items-center justify-center relative mb-4">
                    <img
                      src={card.image}
                      alt={card.name}
                      className="object-contain h-full w-full p-3 transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {card.grade && (
                      <span className="absolute top-2 right-2 bg-zinc-950 text-[9px] text-zinc-400 px-1.5 py-0.5 font-mono tracking-wider border border-zinc-800">
                        {card.grade}
                      </span>
                    )}
                  </div>

                  {/* Card Info Details */}
                  <div className="space-y-1">
                    <p className="text-[9px] text-zinc-600 uppercase tracking-widest font-mono">
                      {card.rarity || "COLLECTIBLE"} {card.edition ? `• ${card.edition}` : ''}
                    </p>
                    <h3 className="text-xs font-light text-zinc-300 tracking-wide truncate group-hover:text-white transition">
                      {card.name}
                    </h3>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-900/60 mt-2">
                      <span className="text-sm font-medium text-white tracking-wide">
                        {formatPrice(card.price)}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors duration-200">
                        View Item &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <EditorialSection />
      </main>

      <Footer />
    </div>
  );
};

export default Index;
