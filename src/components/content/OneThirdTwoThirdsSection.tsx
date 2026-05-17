import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import heroCard02 from "@/assets/hero-card-02.jpg";
import handling from "@/assets/editorial-handling.jpg";

const OneThirdTwoThirdsSection = () => {
  const ref = useScrollReveal();
  return (
    <section ref={ref} className="reveal w-full px-6 lg:px-12 py-24 lg:py-32 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left — narrow editorial */}
      <Link to="/about/our-story" className="lg:col-span-4 group block">
        <div className="relative aspect-[3/4] overflow-hidden bg-surface-1">
          <img
            src={handling}
            alt="A graded card is inspected with white cotton gloves"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-expo-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="eyebrow mb-2 text-foreground/70">The Process</p>
            <h3 className="font-display text-xl md:text-2xl tracking-tight text-foreground">
              Every card. Every grade. Verified by hand.
            </h3>
            <div className="mt-4 inline-flex items-center gap-2 text-sm text-foreground/80">
              <span className="border-b border-foreground/30 pb-0.5">Inside the vault</span>
              <ArrowUpRight size={14} />
            </div>
          </div>
        </div>
      </Link>

      {/* Right — large feature */}
      <Link to="/product/2" className="lg:col-span-8 group block">
        <div className="relative aspect-[16/10] lg:aspect-[16/9] overflow-hidden bg-surface-1">
          <img
            src={heroCard02}
            alt="Lumen Archivist — Silent Chronicle Vol. II"
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1600ms] ease-expo-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/20 to-transparent" />

          <div className="absolute top-6 left-6 flex gap-2">
            <span className="px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase font-mono border border-rarity-legendary/50 text-rarity-legendary bg-background/40 backdrop-blur-md">
              Legendary
            </span>
            <span className="px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase font-mono border border-verified/40 text-verified bg-background/40 backdrop-blur-md">
              PSA 10
            </span>
          </div>

          <div className="absolute bottom-0 left-0 p-6 lg:p-12 max-w-xl">
            <p className="eyebrow mb-4 text-foreground/70">Spotlight · Sale of the week</p>
            <h2 className="font-display text-3xl md:text-5xl tracking-tight text-foreground leading-[1.05]">
              Lumen Archivist.
            </h2>
            <p className="mt-4 text-sm md:text-base text-foreground/70 max-w-md leading-relaxed">
              A flawless Vol. II holofoil, one of only 47 graded copies in circulation. Sold last cycle for $8,200 — currently listed at $8,650.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 text-sm text-foreground/90 group-hover:text-foreground transition-colors">
              <span className="border-b border-foreground/40 pb-0.5">View the listing</span>
              <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
};

export default OneThirdTwoThirdsSection;
