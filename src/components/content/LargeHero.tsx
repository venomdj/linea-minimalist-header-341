import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck } from "lucide-react";
import heroVault from "@/assets/hero-vault.jpg";

const LargeHero = () => {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative w-full min-h-[100svh] lg:min-h-[92vh] overflow-hidden bg-background grain flex flex-col">
      {/* Parallax bg */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{ transform: `translate3d(0, ${scrollY * 0.25}px, 0) scale(${1 + scrollY * 0.0003})` }}
      >
        <img
          src={heroVault}
          alt="The ANIMEX vault"
          className="w-full h-full object-cover opacity-80"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/30 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col justify-end px-6 lg:px-12 pb-16 lg:pb-24">
        <div className="max-w-4xl">
          <div className="flex items-center gap-3 mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-verified pulse-dot" />
            <span className="eyebrow text-foreground/70">Series 03 — Eclipse Saga · Now Live</span>
          </div>

          <h1
            className="font-display text-[clamp(2.75rem,8vw,7.5rem)] leading-[0.92] tracking-[-0.03em] font-light text-foreground animate-fade-up"
            style={{ animationDelay: "0.1s" }}
          >
            The marketplace
            <br />
            <span className="text-foreground/60">for the cards</span>
            <br />
            <span className="italic font-extralight">collectors actually want.</span>
          </h1>

          <p
            className="mt-8 max-w-xl text-base lg:text-lg text-foreground/70 leading-relaxed animate-fade-up"
            style={{ animationDelay: "0.25s" }}
          >
            Every listing graded, authenticated, and insured end-to-end. No fakes, no flippers, no fluff — just provenance you can trust and prices set by the market.
          </p>

          <div className="mt-12 flex flex-wrap items-center gap-4 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <Link
              to="/category/all"
              className="group inline-flex items-center gap-3 bg-foreground text-background px-7 py-4 text-sm tracking-wider font-medium hover:bg-foreground/90 transition-all duration-300"
            >
              Explore the marketplace
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/about/our-story"
              className="group inline-flex items-center gap-2 text-sm text-foreground/80 hover:text-foreground transition-colors py-4 border-b border-foreground/20 hover:border-foreground/60"
            >
              How authentication works
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Trust strip */}
          <div className="mt-16 flex flex-wrap items-center gap-x-10 gap-y-4 text-xs font-mono tracking-wider text-muted-foreground animate-fade-up" style={{ animationDelay: "0.55s" }}>
            <span className="flex items-center gap-2"><BadgeCheck size={14} className="text-verified" strokeWidth={1.8} /> PSA & BGS PARTNER</span>
            <span>1.2M+ LISTINGS</span>
            <span>₹680Cr GMV</span>
            <span>28 STATES · 8 UTs</span>
          </div>
        </div>
      </div>

      {/* Bottom scroll cue */}
      <div className="absolute bottom-6 right-6 hidden lg:flex items-center gap-3 text-[10px] font-mono tracking-[0.3em] text-muted-foreground/70">
        <span className="w-12 h-px bg-muted-foreground/40" />
        SCROLL
      </div>
    </section>
  );
};

export default LargeHero;
