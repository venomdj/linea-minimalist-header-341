import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative bg-background border-t border-border/60 mt-32">
      {/* Marquee */}
      <div className="overflow-hidden border-b border-border/60 py-6">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex shrink-0 items-center gap-12 pr-12">
              {["Authenticated", "Insured Shipping", "Escrow Protected", "PSA Partner", "Global Marketplace", "1.2M Listings", "Verified Sellers"].map((t) => (
                <span key={t} className="font-display text-5xl md:text-7xl font-light tracking-tight text-foreground/15 hover:text-foreground/40 transition-colors duration-700">
                  {t} ·
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 lg:px-12 pt-20 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-20">
          {/* Brand */}
          <div className="lg:col-span-5">
            <Link to="/" className="font-display text-3xl font-semibold tracking-[0.32em] text-foreground">
              MYTHICAL VAULT
            </Link>
            <p className="mt-6 text-sm text-muted-foreground max-w-md leading-relaxed">
              The trusted global marketplace for graded, authenticated anime collectibles. Verified provenance, secure escrow, and curated by collectors who care.
            </p>

            <form className="mt-10 max-w-md">
              <p className="eyebrow mb-3">Receive Drop Notices</p>
              <div className="flex border-b border-border focus-within:border-foreground/60 transition-colors">
                <input
                  type="email"
                  placeholder="you@domain.com"
                  className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground/60"
                />
                <button className="px-2 py-3 text-foreground hover:text-accent transition-colors">
                  <ArrowUpRight size={18} strokeWidth={1.5} />
                </button>
              </div>
            </form>
          </div>

          {/* Links */}
          <div className="lg:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { h: "Market", l: ["All Cards", "New Listings", "Trending", "Auctions", "Grails"] },
              { h: "Sell", l: ["List a Card", "Authentication", "Fees", "Seller Hub"] },
              { h: "Trust", l: ["Grading", "Escrow", "Insurance", "Help Center"] },
              { h: "Company", l: ["About", "Press", "Careers", "Contact"] },
            ].map((col) => (
              <div key={col.h}>
                <p className="eyebrow mb-5">{col.h}</p>
                <ul className="space-y-3">
                  {col.l.map((l) => (
                    <li key={l}>
                      <a href="#" className="text-sm text-foreground/70 hover:text-foreground transition-colors">
                        {l}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border/60 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-mono tracking-wider">
            © 2026 MYTHICAL VAULT MARKETPLACE INC · ALL RIGHTS RESERVED
          </p>
          <div className="flex gap-6 text-xs text-muted-foreground font-mono tracking-wider">
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">PRIVACY</Link>
            <Link to="/terms-of-service" className="hover:text-foreground transition-colors">TERMS</Link>
            <a href="#" className="hover:text-foreground transition-colors">COOKIES</a>
            <a href="https://www.instagram.com/hakaii_690/" className="hover:text-foreground transition-colors">INSTAGRAM</a>
            <a href="#" className="hover:text-foreground transition-colors">X / TWITTER</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
