// src/components/account/Dashboard.tsx
import { Link } from "react-router-dom";
import {
  ShoppingBag,
  User,
  Settings,
  ArrowRight,
  Package,
  BadgeCheck,
  Clock,
  MapPin,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import AccountLayout from "@/components/account/AccountLayout";
import { useAuth } from "@/context/AuthContext";
import { useMyOrders } from "@/hooks/useOrders";
import { getStatusBg, getStatusColor } from "@/types/order";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { orders, loading } = useMyOrders(user?.id ?? null);

  const recent = orders.slice(0, 3);
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Collector";
  const firstName = displayName.split(" ")[0];

  const totalSpent = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const deliveredCount = orders.filter(o => o.status === "delivered").length;
  const inProgressCount = orders.filter(o => !["delivered", "cancelled"].includes(o.status)).length;

  return (
    <AccountLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Hero — cinematic welcome */}
        <section className="relative rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 p-6 sm:p-10 overflow-hidden">
          <span className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-accent/[0.06] blur-3xl pointer-events-none" />
          <span className="absolute -bottom-32 -left-24 w-72 h-72 rounded-full bg-accent/[0.04] blur-3xl pointer-events-none" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-accent/30 bg-accent/[0.06] mb-5">
              <Sparkles size={11} className="text-accent" strokeWidth={2} />
              <span className="text-[10px] font-mono tracking-[0.22em] text-accent uppercase">Vault Access</span>
            </div>
            <h1 className="font-display font-medium text-3xl sm:text-5xl text-white tracking-tight leading-[1.05]">
              Welcome back,<br />
              <span className="text-gradient-accent">{firstName}.</span>
            </h1>
            <p className="mt-4 text-[13px] sm:text-sm text-zinc-400 max-w-md leading-relaxed">
              Your curated collection, order history, and vault preferences — all in one place.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/category/all"
                className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-5 py-2.5 text-[11px] font-mono font-semibold tracking-[0.18em] uppercase hover:bg-accent/90 transition-all hover:shadow-[0_0_30px_-5px_hsl(var(--accent)/0.5)]"
              >
                Explore the Vault
                <ArrowRight size={13} />
              </Link>
              <Link
                to="/account/orders"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-700 hover:border-accent/60 text-zinc-300 hover:text-white px-5 py-2.5 text-[11px] font-mono tracking-[0.18em] uppercase transition-colors"
              >
                View Orders
              </Link>
            </div>
          </div>
        </section>

        {/* Stats — premium cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              icon: Package, label: "Total Orders",
              value: loading ? "—" : orders.length.toString(),
              color: "text-zinc-300", ring: "from-zinc-700/50",
            },
            {
              icon: BadgeCheck, label: "Delivered",
              value: loading ? "—" : deliveredCount.toString(),
              color: "text-verified", ring: "from-verified/40",
            },
            {
              icon: Clock, label: "In Progress",
              value: loading ? "—" : inProgressCount.toString(),
              color: "text-accent", ring: "from-accent/40",
            },
            {
              icon: TrendingUp, label: "Total Spent",
              value: loading ? "—" : `₹${(totalSpent / 1000).toFixed(1)}k`,
              color: "text-accent", ring: "from-accent/40",
            },
          ].map(({ icon: Icon, label, value, color, ring }) => (
            <div
              key={label}
              className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-950 p-4 sm:p-5 overflow-hidden hover:border-zinc-700 transition-all duration-300 hover:-translate-y-0.5"
            >
              <span className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${ring} to-transparent blur-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />
              <div className="relative">
                <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-900 ${color} mb-3`}>
                  <Icon size={16} strokeWidth={1.75} />
                </div>
                <p className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight">{value}</p>
                <p className="text-[10px] font-mono tracking-[0.16em] text-zinc-500 mt-1 uppercase">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <section className="rounded-2xl border border-zinc-800/80 bg-zinc-950 overflow-hidden">
          <header className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-800/80">
            <div>
              <h2 className="text-[15px] font-display font-medium text-white">Recent Orders</h2>
              <p className="text-[11px] font-mono text-zinc-500 mt-0.5">Latest activity in your vault</p>
            </div>
            <Link
              to="/account/orders"
              className="text-[10px] font-mono tracking-[0.2em] text-accent hover:text-white flex items-center gap-1 transition-colors uppercase"
            >
              View all <ArrowRight size={11} />
            </Link>
          </header>

          {loading ? (
            <div className="p-10 flex justify-center">
              <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
          ) : recent.length === 0 ? (
            <EmptyOrdersInline />
          ) : (
            <div className="divide-y divide-zinc-800/80">
              {recent.map(order => (
                <Link
                  key={order.id}
                  to={`/account/orders/${order.id}`}
                  className="flex items-center gap-4 px-5 sm:px-6 py-4 hover:bg-zinc-900/60 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-500 group-hover:text-accent transition-colors flex-shrink-0">
                    <Package size={16} strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13.5px] font-mono text-white truncate">{order.order_number}</p>
                    <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
                      {new Date(order.order_date).toLocaleDateString("en-IN", { dateStyle: "medium" })} · ₹{order.total_amount.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className={`px-2.5 py-1 rounded-full border text-[9px] font-mono tracking-[0.16em] uppercase ${getStatusBg(order.status)} ${getStatusColor(order.status)}`}>
                    {order.status.replace(/_/g, " ")}
                  </div>
                  <ArrowRight size={14} className="text-zinc-700 group-hover:text-accent group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Quick actions — refined cards */}
        <section>
          <p className="text-[10px] font-mono tracking-[0.22em] text-zinc-500 uppercase mb-3 px-1">Quick Actions</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { to: "/account/profile",   icon: User,        label: "Profile",   desc: "Personal info" },
              { to: "/account/orders",    icon: ShoppingBag, label: "Orders",    desc: "Track & history" },
              { to: "/account/addresses", icon: MapPin,      label: "Addresses", desc: "Shipping" },
              { to: "/account/settings",  icon: Settings,    label: "Settings",  desc: "Preferences" },
            ].map(({ to, icon: Icon, label, desc }) => (
              <Link
                key={to}
                to={to}
                className="group relative rounded-2xl border border-zinc-800/80 bg-zinc-950 p-4 hover:border-accent/40 hover:bg-zinc-900/40 transition-all duration-300 hover:-translate-y-0.5"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-zinc-900 group-hover:bg-accent/15 text-zinc-400 group-hover:text-accent transition-all">
                    <Icon size={16} strokeWidth={1.75} />
                  </div>
                  <ArrowRight size={13} className="text-zinc-700 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[14px] font-display font-medium text-white leading-tight">{label}</p>
                <p className="text-[10.5px] font-mono text-zinc-500 mt-1 tracking-wide">{desc}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </AccountLayout>
  );
}

function EmptyOrdersInline() {
  return (
    <div className="px-6 py-12 text-center">
      <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-accent/15 to-transparent mb-4">
        <Package size={26} className="text-accent" strokeWidth={1.5} />
        <span className="absolute inset-0 rounded-full border border-accent/20" />
      </div>
      <p className="text-[15px] font-display text-white">No orders yet</p>
      <p className="text-[12px] font-mono text-zinc-500 mt-1.5 max-w-xs mx-auto">
        Your first legendary pull awaits.
      </p>
      <Link
        to="/category/all"
        className="inline-flex items-center gap-2 mt-5 rounded-full bg-accent text-accent-foreground px-5 py-2.5 text-[10.5px] font-mono font-semibold tracking-[0.18em] uppercase hover:bg-accent/90 transition-colors"
      >
        Discover Cards <ArrowRight size={11} />
      </Link>
    </div>
  );
}
