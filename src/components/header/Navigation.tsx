import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Heart, ShoppingBag as BagIcon, X, Menu, LogIn, User, ChevronRight } from "lucide-react";
import ShoppingBag from "./ShoppingBag";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

const navItems = [
  { name: "Marketplace", href: "/category/all", sub: ["All Cards", "New Listings", "Trending", "Auctions Ending"] },
  { name: "Series", href: "/category/series", sub: ["Æther Order", "Silent Chronicle", "Eclipse Saga", "Hollow Vow", "Lantern Codex"] },
  { name: "Grades", href: "/category/grades", sub: ["PSA 10", "PSA 9", "BGS 9.5", "Ungraded", "Slabbed"] },
  { name: "Vault", href: "/", sub: ["About Mythical Vault", "Authentication", "Grading Standards", "Sell With Us"] },
];

const Navigation = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [search, setSearch] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);
  const { items, count, setQty } = useCart();
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const total = count;
  const updateQty = (id: number, q: number) => setQty(id, q);
  const cart = items.map((i) => ({
    id: i.id,
    name: i.name,
    price: `₹${i.price.toLocaleString("en-IN")}`,
    image: i.image,
    quantity: i.quantity,
    category: i.series,
  }));

  return (
    <>
      {/* Status / announcement bar */}
      <div className="hidden md:block bg-background border-b border-border/60">
        <div className="px-6 h-8 flex items-center justify-between text-[11px] font-mono tracking-wider text-muted-foreground/80">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-verified pulse-dot" />
            LIVE
          </div>
          <div className="flex items-center gap-6">
            <span>FREE INSURED SHIPPING OVER ₹5,000 · PAN-INDIA</span>
            <Link to="/about/our-story" className="hover:text-foreground transition-colors" />
          </div>
        </div>
      </div>

      <nav
        className={`sticky top-0 z-50 transition-all duration-500 ${
          scrolled ? "glass-strong" : "bg-background"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 sm:px-6">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobile(!mobile)}
            className="lg:hidden p-2 text-nav-foreground hover:text-nav-hover transition-colors"
            aria-label="Menu"
          >
            {mobile ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Left nav desktop links */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => setOpen(item.name)}
                onMouseLeave={() => setOpen(null)}
              >
                <Link
                  to={item.href}
                  className="text-[13px] tracking-wide text-nav-foreground hover:text-nav-hover transition-colors py-6 block"
                >
                  {item.name}
                </Link>
              </div>
            ))}
          </div>

          {/* ── CENTER BRAND — FIX: whitespace-nowrap + fluid font-size ── */}
          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 group select-none"
            aria-label="Mythical Vault — Home"
          >
            <span
              className="
                font-display font-semibold tracking-[0.28em]
                text-foreground whitespace-nowrap
                text-[clamp(0.7rem,2.6vw,1.125rem)]
                group-hover:text-foreground/80 transition-colors duration-300
              "
            >
              MYTHICAL VAULT
            </span>
          </Link>

          {/* Right side icon actions panel */}
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setSearch(!search)}
              className="p-2 text-nav-foreground hover:text-nav-hover transition-colors"
              aria-label="Search"
            >
              <Search size={18} strokeWidth={1.5} />
            </button>
            <button
              className="hidden lg:block p-2 text-nav-foreground hover:text-nav-hover transition-colors"
              aria-label="Watchlist"
            >
              <Heart size={18} strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setBagOpen(true)}
              className="p-2 text-nav-foreground hover:text-nav-hover transition-colors relative"
              aria-label="Cart"
            >
              <BagIcon size={18} strokeWidth={1.5} />
              {total > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-accent text-accent-foreground text-[9px] font-mono font-semibold flex items-center justify-center">
                  {total}
                </span>
              )}
            </button>

            {/* ── ACCOUNT / LOGIN — premium redesign ── */}
            {user ? (
              <button
                onClick={() => navigate("/account")}
                className="
                  group ml-1 sm:ml-2 relative flex items-center gap-2
                  pl-2.5 pr-3 py-1.5
                  border border-zinc-700/60 bg-zinc-900/80
                  hover:border-zinc-500 hover:bg-zinc-800/90
                  transition-all duration-200
                  overflow-hidden
                "
                title="My Account"
              >
                {/* subtle shimmer on hover */}
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent pointer-events-none" />
                <span className="relative flex items-center justify-center w-5 h-5 rounded-full bg-zinc-700 group-hover:bg-zinc-600 transition-colors">
                  <User size={11} strokeWidth={2} className="text-zinc-200" />
                </span>
                <span className="hidden sm:block text-[10px] font-mono uppercase tracking-widest text-zinc-300 group-hover:text-white transition-colors">
                  Account
                </span>
              </button>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="
                  group ml-1 sm:ml-2 relative flex items-center gap-2
                  pl-2.5 pr-3 py-1.5
                  border border-zinc-700/40 bg-transparent
                  hover:border-zinc-500 hover:bg-zinc-900/70
                  transition-all duration-200
                  overflow-hidden
                "
                title="Sign In"
              >
                <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent pointer-events-none" />
                {/* glowing dot indicator — draws the eye */}
                <span className="relative flex items-center justify-center w-5 h-5">
                  <span className="absolute w-5 h-5 rounded-full border border-zinc-500/40 group-hover:border-zinc-400/60 transition-colors" />
                  <LogIn size={10} strokeWidth={2} className="text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                </span>
                <span className="hidden sm:block text-[10px] font-mono uppercase tracking-widest text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  Sign&nbsp;In
                </span>
                <ChevronRight size={9} className="hidden sm:block text-zinc-600 group-hover:text-zinc-400 transition-colors -ml-0.5" />
              </button>
            )}
          </div>
        </div>

        {/* Dropdown contents */}
        {open && (
          <div
            className="absolute top-full left-0 right-0 glass-strong border-t border-border/40 animate-fade-in"
            onMouseEnter={() => setOpen(open)}
            onMouseLeave={() => setOpen(null)}
          >
            <div className="px-6 py-10 grid grid-cols-12 gap-8">
              <div className="col-span-3">
                <p className="eyebrow mb-4">{open}</p>
                <ul className="space-y-3">
                  {navItems.find((i) => i.name === open)?.sub.map((s) => (
                    <li key={s}>
                      <Link
                        to="/category/all"
                        className="text-sm text-nav-foreground hover:text-nav-hover transition-colors flex items-center justify-between group"
                      >
                        <span>{s}</span>
                        <span className="opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Search Modal */}
        {search && (
          <div className="absolute top-full left-0 right-0 glass-strong border-t border-border/40 animate-fade-in">
            <div className="px-6 py-10 max-w-3xl mx-auto">
              <div className="flex items-center border-b border-border pb-3">
                <Search size={18} className="text-muted-foreground mr-3" strokeWidth={1.5} />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search by card, series, or grade…"
                  className="flex-1 bg-transparent outline-none text-base text-foreground placeholder:text-muted-foreground/60 font-light"
                />
              </div>
              <p className="eyebrow mt-6 mb-3">Trending searches</p>
              <div className="flex flex-wrap gap-2">
                {["PSA 10", "1st Edition", "Holofoil", "Promo", "Grail Tier"].map((s) => (
                  <button key={s} className="text-xs text-foreground/80 hover:text-foreground border border-border hover:border-foreground/40 px-3 py-1.5 rounded-full transition-colors font-mono tracking-wider">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mobile slide menu container */}
        {mobile && (
          <div className="lg:hidden absolute top-full left-0 right-0 glass-strong border-t border-border/40 animate-fade-in">
            <div className="px-6 py-8 space-y-6">
              {navItems.map((item) => (
                <div key={item.name}>
                  <Link
                    to={item.href}
                    onClick={() => setMobile(false)}
                    className="block font-display text-xl text-foreground tracking-tight"
                  >
                    {item.name}
                  </Link>
                  <div className="mt-2 pl-1 space-y-1.5">
                    {item.sub.map((s) => (
                      <Link
                        key={s}
                        to="/category/all"
                        onClick={() => setMobile(false)}
                        className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {s}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              {/* Mobile auth CTA */}
              <div className="pt-2 border-t border-border/40">
                {user ? (
                  <button
                    onClick={() => { navigate("/account"); setMobile(false); }}
                    className="w-full flex items-center gap-3 py-3 text-sm text-foreground"
                  >
                    <User size={16} strokeWidth={1.5} />
                    My Account
                  </button>
                ) : (
                  <button
                    onClick={() => { navigate("/login"); setMobile(false); }}
                    className="w-full flex items-center gap-3 py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <LogIn size={16} strokeWidth={1.5} />
                    Sign In / Create Account
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      <ShoppingBag
        isOpen={bagOpen}
        onClose={() => setBagOpen(false)}
        cartItems={cart}
        updateQuantity={updateQty}
      />
    </>
  );
};

export default Navigation;
