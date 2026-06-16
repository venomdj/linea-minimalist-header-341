// src/components/account/MyOrders.tsx
import { Link } from "react-router-dom";
import { Package, ArrowRight, Search, FileText } from "lucide-react";
import { useState } from "react";
import AccountLayout from "@/components/account/AccountLayout";
import OrderTimeline from "@/components/account/OrderTimeline";
import { useAuth } from "@/context/AuthContext";
import { useMyOrders } from "@/hooks/useOrders";
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
    <AccountLayout title="My Orders">
      <div className="space-y-5">
        <div className="border border-zinc-800 bg-zinc-950 p-6">
          <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase mb-1">Account</p>
          <h2 className="font-display text-xl text-white">My Orders</h2>
          <p className="text-[12px] text-zinc-500 font-mono mt-1">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
        </div>

        {/* Search */}
        {orders.length > 0 && (
          <div className="flex items-center gap-2 border border-zinc-800 bg-zinc-950 px-4 py-2.5">
            <Search size={14} className="text-zinc-600 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by order number or status…"
              className="flex-1 bg-transparent text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none"
            />
          </div>
        )}

        {loading ? (
          <div className="border border-zinc-800 bg-zinc-950 p-12 flex justify-center">
            <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="border border-red-900/50 bg-zinc-950 p-6 text-center text-[12px] font-mono text-red-400">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="border border-zinc-800 bg-zinc-950 p-12 text-center">
            <Package size={32} className="mx-auto mb-4 text-zinc-700" strokeWidth={1} />
            <p className="text-[12px] font-mono text-zinc-600 tracking-wider">
              {search ? "No matching orders" : "No orders yet"}
            </p>
            {!search && (
              <Link to="/category/all" className="inline-block mt-5 text-[11px] font-mono tracking-widest text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 px-5 py-2.5 transition-colors uppercase">
                Explore the Vault →
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(order => (
              <div key={order.id} className="border border-zinc-800 bg-zinc-950 overflow-hidden">
                {/* Order header */}
                <div className="flex flex-wrap items-start gap-3 px-5 py-4 border-b border-zinc-800">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <p className="text-[13px] font-mono text-white">{order.order_number}</p>
                      <span className={`px-2 py-0.5 border text-[9px] font-mono tracking-widest uppercase ${getStatusBg(order.status)} ${getStatusColor(order.status)}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-zinc-500 mt-1">
                      {new Date(order.order_date).toLocaleDateString("en-IN", { dateStyle: "long" })}
                      {" · "}₹{order.total_amount.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => viewInvoicePDF(order)}
                      className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-zinc-500 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 transition-colors uppercase"
                    >
                      <FileText size={10} /> View PDF
                    </button>
                    <Link
                      to={`/account/orders/${order.id}`}
                      className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest text-zinc-500 hover:text-white border border-zinc-700 hover:border-zinc-500 px-3 py-1.5 transition-colors uppercase"
                    >
                      Details <ArrowRight size={10} />
                    </Link>
                  </div>
                </div>

                {/* Line items preview */}
                {order.line_items && (order.line_items as unknown[]).length > 0 && (
                  <div className="px-5 py-3 border-b border-zinc-800/50 flex gap-3 overflow-x-auto">
                    {(order.line_items as { title: string; image_url: string | null; quantity: number; price: number }[]).map((item, i) => (
                      <div key={i} className="flex items-center gap-2 flex-shrink-0 min-w-0">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.title} className="w-8 h-8 object-cover border border-zinc-800 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="text-[11px] text-zinc-300 truncate max-w-[120px]">{item.title}</p>
                          <p className="text-[10px] font-mono text-zinc-600">
                            ×{item.quantity} · ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Compact timeline */}
                <div className="px-5 py-4">
                  <OrderTimeline order={order} compact />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
