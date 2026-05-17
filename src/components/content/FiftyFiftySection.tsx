import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import card01 from "@/assets/card-product-01.jpg";
import card04 from "@/assets/card-product-04.jpg";

const FiftyFiftySection = () => {
  const ref = useScrollReveal();
  return (
    <section ref={ref} className="reveal w-full px-6 lg:px-12 py-24 lg:py-32">
      <div className="flex items-end justify-between mb-12">
        <div>
          <p className="eyebrow mb-3">Curated · This Week</p>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight text-foreground max-w-2xl">
            Two drops, both authenticated, both grail-tier.
          </h2>
        </div>
        <Link
          to="/category/all"
          className="hidden md:inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all drops <ArrowUpRight size={14} />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
        {[
          { img: card01, title: "Æther Order — Series 03", caption: "1st Edition · 12 graded copies in circulation", href: "/category/all", price: "from $14,200", tag: "Grail" },
          { img: card04, title: "Lantern Codex — Holofoil Set", caption: "Complete 9-card master set · PSA 10", href: "/category/all", price: "from $28,400", tag: "Master Set" },
        ].map((d, i) => (
          <Link key={i} to={d.href} className="group block">
            <div className="relative aspect-[4/5] overflow-hidden bg-surface-1">
              <img
                src={d.img}
                alt={d.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1400ms] ease-expo-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

              <div className="absolute top-5 left-5">
                <span className="px-3 py-1.5 text-[10px] tracking-[0.18em] uppercase font-mono border border-foreground/20 text-foreground/90 bg-background/40 backdrop-blur-md">
                  {d.tag}
                </span>
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 lg:p-10">
                <p className="eyebrow mb-2 text-foreground/70">{d.caption}</p>
                <div className="flex items-end justify-between gap-4">
                  <h3 className="font-display text-2xl md:text-4xl tracking-tight text-foreground max-w-lg">
                    {d.title}
                  </h3>
                  <span className="text-sm font-mono text-foreground/80 tracking-wider shrink-0 pb-1">
                    {d.price}
                  </span>
                </div>
                <div className="mt-6 inline-flex items-center gap-2 text-sm text-foreground/80 group-hover:text-foreground transition-colors">
                  <span className="border-b border-foreground/30 group-hover:border-foreground pb-0.5">Browse the drop</span>
                  <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default FiftyFiftySection;
