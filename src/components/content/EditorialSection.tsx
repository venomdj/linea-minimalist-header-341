import { Link } from "react-router-dom";
import { ArrowUpRight, BadgeCheck, Lock, Globe2 } from "lucide-react";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const features = [
  {
    icon: BadgeCheck,
    title: "Authenticated by experts",
    body: "Every card is inspected, photographed in high resolution, and matched against population data before it ever appears on MYTHICAL VAULT.",
  },
  {
    icon: Lock,
    title: "Escrow on every sale",
    body: "Buyer funds are held in escrow until the card arrives, is inspected, and matches the listing. No mismatches, no surprises.",
  },
  {
    icon: Globe2,
    title: "Shipped insured, worldwide",
    body: "Fully insured, signature-required delivery to 180 countries. Real-time tracking from the seller's vault to your door.",
  },
];

const EditorialSection = () => {
  const ref = useScrollReveal();
  return (
    <section ref={ref} className="reveal w-full px-6 lg:px-12 py-24 lg:py-32 border-t border-border/60">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
        <div className="lg:col-span-5">
          <p className="eyebrow mb-4">A higher standard</p>
          <h2 className="font-display text-3xl md:text-5xl tracking-tight text-foreground leading-[1.05]">
            Built for collectors who care about <em className="not-italic text-foreground/60">what they own.</em>
          </h2>
          <p className="mt-8 text-base text-muted-foreground leading-relaxed max-w-md">
            MYTHICAL VAULT was founded on a simple idea — that the secondary market for high-grade anime collectibles deserves the same rigor as fine art, watches, and sneakers. We built the infrastructure to make that real.
          </p>
          <Link
            to="/about/our-story"
            className="mt-10 inline-flex items-center gap-2 text-sm text-foreground border-b border-foreground/30 hover:border-foreground transition-colors pb-1 group"
          >
            Read the founding letter
            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 gap-px bg-border/60">
          {features.map((f) => (
            <div key={f.title} className="bg-background p-8 lg:p-10 flex gap-6 group">
              <div className="shrink-0 mt-1">
                <f.icon size={20} strokeWidth={1.5} className="text-accent" />
              </div>
              <div>
                <h3 className="font-display text-xl tracking-tight text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default EditorialSection;
