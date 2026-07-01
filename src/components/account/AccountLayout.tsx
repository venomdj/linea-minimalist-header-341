// src/components/account/AccountLayout.tsx
import { Link, useLocation, Navigate } from "react-router-dom";
import { LayoutDashboard, User, ShoppingBag, MapPin, Settings, LogOut, ChevronRight } from "lucide-react";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { href: "/account",           label: "Dashboard",     icon: LayoutDashboard },
  { href: "/account/profile",   label: "Profile",       icon: User },
  { href: "/account/orders",    label: "My Orders",     icon: ShoppingBag },
  { href: "/account/addresses", label: "Addresses",     icon: MapPin },
  { href: "/account/settings",  label: "Settings",      icon: Settings },
];


interface Props {
  children: React.ReactNode;
  title?: string;
}

export default function AccountLayout({ children, title }: Props) {
  const { user, profile, loading, signOut } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  const displayName = profile?.full_name || user.email?.split("@")[0] || "Collector";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-8 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[12px] font-mono tracking-widest text-muted-foreground mb-8 uppercase">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight size={10} />
            <Link to="/account" className="hover:text-foreground transition-colors">My Account</Link>
            {title && (
              <>
                <ChevronRight size={10} />
                <span className="text-foreground">{title}</span>
              </>
            )}
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-8">

            {/* Sidebar */}
            <aside>
              {/* Profile card — vault access card */}
              <div className="relative border border-accent/25 bg-zinc-950 p-5 mb-4 shine overflow-hidden">
                <span className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
                <div className="flex items-center gap-3 mb-4">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} className="w-11 h-11 rounded-full object-cover border-2 border-accent/40" />
                  ) : (
                    <div className="w-11 h-11 rounded-full bg-accent/10 border-2 border-accent/40 flex items-center justify-center text-sm font-display font-semibold text-accent">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-[15px] font-display font-medium text-white truncate">{displayName}</p>
                    <p className="text-[11px] font-mono text-zinc-500 truncate">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-800 pt-3">
                  <span className="px-2.5 py-1 text-[9px] font-mono tracking-[0.18em] uppercase border border-rarity-legendary/50 text-rarity-legendary bg-background/40">
                    Vault Member
                  </span>
                </div>
              </div>

              {/* Nav links */}
              <nav className="border border-zinc-800 bg-zinc-950 overflow-hidden">
                {navLinks.map(({ href, label, icon: Icon }) => {
                  const active = location.pathname === href;
                  return (
                    <Link
                      key={href}
                      to={href}
                      className={`relative flex items-center gap-3 px-4 py-3 text-[13px] border-b border-zinc-800 last:border-0 transition-colors ${
                        active
                          ? "bg-accent/[0.07] text-white"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                      }`}
                    >
                      {active && <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent" />}
                      <Icon size={15} strokeWidth={1.5} className={active ? "text-accent" : ""} />
                      <span className="font-mono tracking-wider">{label}</span>
                      {active && <ChevronRight size={12} className="ml-auto text-accent" />}
                    </Link>
                  );
                })}
                <button
                  onClick={signOut}
                  className="flex items-center gap-3 px-4 py-3 w-full text-[13px] text-red-400/70 hover:text-red-400 hover:bg-zinc-900 transition-colors font-mono tracking-wider"
                >
                  <LogOut size={15} strokeWidth={1.5} />
                  Sign Out
                </button>
              </nav>
            </aside>

            {/* Content */}
            <div className="min-w-0">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
