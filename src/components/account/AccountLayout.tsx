// src/components/account/AccountLayout.tsx
import { Link, useLocation, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  ShoppingBag,
  MapPin,
  Settings,
  LogOut,
  ChevronRight,
} from "lucide-react";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { href: "/account",           label: "Dashboard",  icon: LayoutDashboard, desc: "Overview" },
  { href: "/account/profile",   label: "Profile",    icon: User,            desc: "Personal details" },
  { href: "/account/orders",    label: "Orders",     icon: ShoppingBag,     desc: "Track & history" },
  { href: "/account/addresses", label: "Addresses",  icon: MapPin,          desc: "Saved locations" },
  { href: "/account/settings",  label: "Settings",   icon: Settings,        desc: "Preferences" },
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
        <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
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
      <main className="flex-1 pt-6 sm:pt-10 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">

          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-[11px] font-mono tracking-[0.2em] text-muted-foreground mb-6 uppercase">
            <Link to="/" className="hover:text-accent transition-colors">Home</Link>
            <ChevronRight size={10} />
            <Link to="/account" className="hover:text-accent transition-colors">Account</Link>
            {title && (
              <>
                <ChevronRight size={10} />
                <span className="text-foreground">{title}</span>
              </>
            )}
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 lg:gap-10">

            {/* Sidebar / Modern nav cards */}
            <aside className="lg:sticky lg:top-24 lg:self-start space-y-3">

              {/* Profile card — luxury vault pass */}
              <div className="relative rounded-2xl border border-accent/20 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900/60 p-5 overflow-hidden shadow-[0_8px_32px_-12px_rgba(0,0,0,0.6)]">
                <span className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-accent/[0.08] blur-3xl" />
                <div className="relative flex items-center gap-3.5">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="w-14 h-14 rounded-full object-cover ring-2 ring-accent/40 ring-offset-2 ring-offset-zinc-950"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent/30 to-accent/5 ring-2 ring-accent/40 ring-offset-2 ring-offset-zinc-950 flex items-center justify-center text-base font-display font-semibold text-accent">
                      {initials}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-mono tracking-[0.18em] text-accent/80 uppercase mb-0.5">Welcome</p>
                    <p className="text-base font-display font-medium text-white truncate leading-tight">{displayName}</p>
                    <p className="text-[11px] font-mono text-zinc-500 truncate mt-0.5">{user.email}</p>
                  </div>
                </div>
                <div className="relative mt-4 pt-4 border-t border-zinc-800/80 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono tracking-[0.18em] uppercase border border-accent/40 text-accent bg-accent/[0.05]">
                    <span className="w-1 h-1 rounded-full bg-accent dot-glow-gold" />
                    Vault Member
                  </span>
                  <Link to="/account/profile" className="text-[10px] font-mono tracking-widest text-zinc-500 hover:text-accent transition-colors uppercase">
                    Edit
                  </Link>
                </div>
              </div>

              {/* Nav — mobile horizontal scroll, desktop stacked cards */}
              <nav
                aria-label="Account navigation"
                className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible -mx-4 px-4 lg:mx-0 lg:px-0 pb-2 lg:pb-0 scrollbar-none"
              >
                {navLinks.map(({ href, label, icon: Icon, desc }) => {
                  const active = location.pathname === href;
                  return (
                    <Link
                      key={href}
                      to={href}
                      aria-current={active ? "page" : undefined}
                      className={`group relative flex items-center gap-3 rounded-xl border px-4 py-3 min-w-[180px] lg:min-w-0 flex-shrink-0 transition-all duration-300 ${
                        active
                          ? "border-accent/40 bg-gradient-to-r from-accent/[0.08] to-transparent shadow-[inset_0_0_0_1px_rgba(0,0,0,0)]"
                          : "border-zinc-800/80 bg-zinc-950/60 hover:border-zinc-700 hover:bg-zinc-900/60"
                      }`}
                    >
                      <div className={`flex items-center justify-center w-9 h-9 rounded-lg transition-all ${
                        active
                          ? "bg-accent/15 text-accent"
                          : "bg-zinc-900 text-zinc-500 group-hover:text-white group-hover:bg-zinc-800"
                      }`}>
                        <Icon size={16} strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-[13px] font-display font-medium leading-tight ${active ? "text-white" : "text-zinc-200 group-hover:text-white"}`}>
                          {label}
                        </p>
                        <p className="hidden lg:block text-[10.5px] font-mono text-zinc-500 tracking-wide mt-0.5 truncate">{desc}</p>
                      </div>
                      <ChevronRight size={14} className={`hidden lg:block transition-all ${active ? "text-accent translate-x-0.5" : "text-zinc-700 group-hover:text-zinc-500 group-hover:translate-x-0.5"}`} />
                    </Link>
                  );
                })}

                <button
                  onClick={signOut}
                  className="group flex items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/60 hover:border-red-900/60 hover:bg-red-950/20 px-4 py-3 min-w-[180px] lg:min-w-0 flex-shrink-0 transition-all duration-300 text-left"
                >
                  <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-900 group-hover:bg-red-950/40 text-zinc-500 group-hover:text-red-400 transition-all">
                    <LogOut size={16} strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-display font-medium text-zinc-300 group-hover:text-red-300 leading-tight transition-colors">Sign Out</p>
                    <p className="hidden lg:block text-[10.5px] font-mono text-zinc-500 tracking-wide mt-0.5">End session</p>
                  </div>
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
