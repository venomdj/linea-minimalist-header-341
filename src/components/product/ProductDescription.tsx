import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Product } from "@/data/products";

interface Props { product: Product; }

const Section = ({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border">
      <button
        onClick={() => setOpen(!open)}
        className="w-full py-5 flex items-center justify-between text-left group"
      >
        <span className="text-sm tracking-wide text-foreground">{title}</span>
        <ChevronDown size={16} className={`text-muted-foreground transition-transform duration-500 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-all duration-500 ease-expo-out ${open ? "grid-rows-[1fr] pb-6" : "grid-rows-[0fr]"}`}>
        <div className="overflow-hidden">
          <div className="text-sm text-muted-foreground leading-relaxed space-y-3">{children}</div>
        </div>
      </div>
    </div>
  );
};

const Row = ({ k, v }: { k: string; v: string }) => (
  <div className="flex justify-between py-1.5 text-sm">
    <span className="text-muted-foreground">{k}</span>
    <span className="text-foreground font-mono">{v}</span>
  </div>
);

const ProductDescription = ({ product }: Props) => (
  <div className="mt-12 border-t border-border">
    <Section title="Provenance" defaultOpen>
      <p>
        {product.name} is a {product.edition.toLowerCase()} pull from {product.series} — {product.set}. This copy was graded {product.grade} and entered the Mythical Vault following full visual authentication, edge-wear inspection, and population cross-reference.
      </p>
      <p>
        Only {product.population ?? "—"} known copies exist at this grade. Chain-of-custody documentation accompanies every shipment.
      </p>
    </Section>
    <Section title="Specification">
      <Row k="Series" v={product.series} />
      <Row k="Set" v={product.set} />
      <Row k="Edition" v={product.edition} />
      <Row k="Grade" v={product.grade} />
      <Row k="Rarity" v={product.rarity} />
      <Row k="Population" v={product.population?.toString() ?? "—"} />
    </Section>
    <Section title="Authentication & Escrow">
      <ul className="space-y-2 list-none">
        <li>— Multi-point physical inspection on intake and dispatch.</li>
        <li>— Tamper-evident slab serial cross-checked against grading registry.</li>
        <li>— Buyer funds held in escrow until verified delivery and 48-hour inspection window closes.</li>
        <li>— Full insurance, signature-required courier, real-time tracking.</li>
      </ul>
    </Section>
    <Section title="Returns & Buyer Protection">
      <p>
        If the card does not match the listing in grade, edition, or population data, the sale is reversed and funds are returned in full within 48 hours of inspection.
      </p>
    </Section>
  </div>
);

export default ProductDescription;
