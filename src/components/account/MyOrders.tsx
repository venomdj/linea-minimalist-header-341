// src/components/account/MyOrders.tsx
import { Link } from "react-router-dom";
import { Package, ArrowRight, Search, FileText, Sparkles, Compass } from "lucide-react";
import { useState } from "react";
import AccountLayout from "@/components/account/AccountLayout";
import OrderTimeline from "@/components/account/OrderTimeline";
import { useAuth } from "@/context/AuthContext";
import { useMyOrders } from "@/hooks/useOrders";
import { useProducts } from "@/hooks/useProducts";
import { getStatusBg, getStatusColor } from "@/types/order";
import { viewInvoicePDF } from "@/lib/generateInvoice";

export default function MyOrders() {
  const { user } = useAuth();
  const { orders, loading, error } = useMyOrders(user?.id ?? null);
  const [search, setSearch] = useState("");

  const filtered = orders.filter(o => {
    const q = search.toLowerCase();
    return !q || o.order_number.toLowerCase().includes(q) || o.status.includes(q);
  });

  return (
    <AccountLayout title="Orders">
      <div className="space-y-6">
        {/* Page header */}
        <header className="rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-950 to-black p-6 sm:p-7 relative overflow-hidden">
          <span className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-accent/[0.05] blur-3xl pointer-events-none" />
          <div className="relative flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-mono tracking-[0.22em] text-accent uppercase mb-2">Account</p>
              <h1 className="font-display font-medium text-2xl sm:text-3xl text-white tracking-tight">My Orders</h1>
              <p className="text-[12px] font-mono text-zinc-500 mt-1.5">
                {orders.length} {orders.length === 1 ? "order" : "orders"} · lifetime record
              </p>
            </div>
            {orders.length > 0 && (
              <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/80 pl-4 pr-2 py-1.5 w-full sm:w-auto sm:min-w-[280px]">
                <Search size={13} className="text-zinc-600 flex-shrink-0" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search orders…"
                  aria-label="Search orders"
                  className="flex-1 bg-transparent text-[13px] font-mono text-white placeholder:text-zinc-600 focus:outline-none min-w-0"
                />
              </div>
            )}
          </div>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-16 flex justify-center">
            <div className="w-5 h-5 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-red-900/50 bg-red-950/10 p-6 text-center text-[12px] font-mono text-red-400">{error}</div>
        ) : orders.length === 0 ? (
          <EmptyOrdersHero />
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950 p-12 text-center">
            <p className="text-[13px] font-mono text-zinc-400">No matching orders</p>
            <button
              onClick={() => setSearch("")}
              className="mt-3 text-[11px] font-mono tracking-widest text-accent hover:text-white uppercase"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <article key={order.id} className="rounded-2xl border border-zinc-800/80 bg-zinc-950 overflow-hidden hover:border-zinc-700 transition-colors">
                {/* Header */}
                <div className="flex flex-wrap items-start gap-3 px-5 sm:px-6 py-4 border-b border-zinc-800/80">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <p className="text-[13.5px] font-mono text-white">{order.order_number}</p>
                      <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono tracking-[0.16em] uppercase ${getStatusBg(order.status)} ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-[11px] font-mono text-zinc-500 mt-1">
                      {new Date(order.order_date).toLocaleDateString("en-IN", { dateStyle: "long" })}
                      {" · "}<span className="text-zinc-300">₹{order.total_amount.toLocaleString("en-IN")}</span>
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => viewInvoicePDF(order)}
                      className="flex items-center gap-1.5 rounded-full text-[10px] font-mono font-semibold tracking-[0.16em] text-accent-foreground bg-accent hover:bg-accent/90 px-3.5 py-2 transition-colors uppercase"
                    >
                      <FileText size={11} /> Invoice
                    </button>
                    <Link
                      to={`/account/orders/${order.id}`}
                      className="flex items-center gap-1.5 rounded-full text-[10px] font-mono tracking-[0.16em] text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3.5 py-2 transition-colors uppercase"
                    >
                      Details <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>

                {/* Items */}
                {order.line_items && (order.line_items as unknown[]).length > 0 && (
                  <div className="px-5 sm:px-6 py-3 border-b border-zinc-800/60 flex gap-3 overflow-x-auto scrollbar-none">
                    {(order.line_items as { title: string; image_url: string | null; quantity: number; price: number }[]).map((item, i) => (
                      <div key={i} className="flex items-center gap-2.5 flex-shrink-0">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.title} className="w-10 h-10 object-cover rounded-md border border-zinc-800" />
                        )}
                        <div className="min-w-0">
                          <p className="text-[11.5px] text-zinc-200 truncate max-w-[140px]">{item.title}</p>
                          <p className="text-[10px] font-mono text-zinc-500">
                            ×{item.quantity} · ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Timeline */}
                <div className="px-5 sm:px-6 py-4">
                  <OrderTimeline order={order} compact />
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}

/* ---------------- Rich empty state ---------------- */

function EmptyOrdersHero() {
  const { products } = useProducts();
  const featured = products.filter(p => p.featured).slice(0, 3);
  const recommended = (featured.length ? featured : products.slice(0, 3));

  return (
    <div className="space-y-6">
      {/* Hero empty card */}
      <div className="relative rounded-2xl border border-zinc-800/80 bg-gradient-to-br from-zinc-950 via-black to-zinc-950 px-6 py-14 sm:py-20 text-center overflow-hidden">
        <span className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-accent/[0.06] blur-3xl pointer-events-none" />
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

        <div className="relative">
          {/* Illustration */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <span className="absolute inset-0 rounded-full bg-accent/10 blur-2xl scale-150" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-accent/30 flex items-center justify-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)]">
              <Package size={30} strokeWidth={1.4} className="text-accent" />
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-accent flex items-center justify-center">
                <Sparkles size={10} className="text-accent-foreground" strokeWidth={2.5} />
              </span>
            </div>
          </div>

          <p className="text-[10px] font-mono tracking-[0.24em] text-accent uppercase mb-3">The Vault Awaits</p>
          <h2 className="font-display font-medium text-2xl sm:text-3xl text-white tracking-tight">
            Your collection starts here
          </h2>
          <p className="text-[13px] sm:text-sm text-zinc-400 mt-3 max-w-md mx-auto leading-relaxed">
            No orders yet. Discover legendary cards, graded slabs, and rare pulls — every piece verified and preserved.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/category/all"
              className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-foreground px-6 py-3 text-[11px] font-mono font-semibold tracking-[0.18em] uppercase hover:bg-accent/90 transition-all hover:shadow-[0_0_30px_-5px_hsl(var(--accent)/0.55)]"
            >
              <Compass size={13} /> Browse the Vault
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-700 hover:border-accent/60 text-zinc-300 hover:text-white px-6 py-3 text-[11px] font-mono tracking-[0.18em] uppercase transition-colors"
            >
              View Featured Drops
            </Link>
          </div>
        </div>
      </div>

      {/* Recommended */}
      {recommended.length > 0 && (
        <section>
          <div className="flex items-center justify-between px-1 mb-4">
            <div>
              <p className="text-[10px] font-mono tracking-[0.22em] text-accent uppercase">Curated for you</p>
              <h3 className="text-[16px] font-display font-medium text-white mt-1">Featured this week</h3>
            </div>
            <Link to="/category/all" className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 hover:text-accent flex items-center gap-1 uppercase transition-colors">
              See all <ArrowRight size={11} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {recommended.map(p => (
              <Link
                key={p.id}
                to={`/product/${p.slug}`}
                className="group rounded-2xl border border-zinc-800/80 bg-zinc-950 overflow-hidden hover:border-accent/40 transition-all duration-300"
              >
                <div className="aspect-[4/5] bg-zinc-900 overflow-hidden relative">
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {p.rarity && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur text-[9px] font-mono tracking-[0.16em] uppercase text-accent border border-accent/30">
                      {p.rarity}
                    </span>
                  )}
                </div>
                <div className="p-3.5">
                  <p className="text-[13px] font-display text-white truncate">{p.name}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className="text-[12px] font-mono text-zinc-300">₹{p.price.toLocaleString("en-IN")}</p>
                    <ArrowRight size={12} className="text-zinc-700 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
