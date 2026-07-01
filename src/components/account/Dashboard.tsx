// src/pages/account/Dashboard.tsx
import { Link } from "react-router-dom";
import { ShoppingBag, User, Settings, ArrowRight, Package, BadgeCheck, Clock, MapPin } from "lucide-react";
import AccountLayout from "@/components/account/AccountLayout";
import { useAuth } from "@/context/AuthContext";
import { useMyOrders } from "@/hooks/useOrders";
import { getStatusBg, getStatusColor } from "@/types/order";

export default function Dashboard() {
  const { user, profile } = useAuth();
  const { orders, loading } = useMyOrders(user?.id ?? null);

  const recent = orders.slice(0, 3);
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Collector";

  return (
    <AccountLayout>
      <div className="space-y-6">
        {/* Welcome */}
        <div className="relative border border-zinc-800 bg-zinc-950 p-6 sm:p-7 overflow-hidden">
          <span className="absolute top-3 left-3 w-3 h-3 border-t border-l border-accent/50" />
          <span className="absolute top-3 right-3 w-3 h-3 border-t border-r border-accent/50" />
          <span className="absolute bottom-3 left-3 w-3 h-3 border-b border-l border-accent/50" />
          <span className="absolute bottom-3 right-3 w-3 h-3 border-b border-r border-accent/50" />
          <p className="text-[11px] font-mono tracking-[0.2em] text-accent uppercase mb-2">Welcome back</p>
          <h1 className="font-display font-semibold text-3xl sm:text-4xl text-gradient-accent tracking-tight">{displayName}</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="relative border border-zinc-800 bg-zinc-950 p-5 text-center hover-lift overflow-hidden">
            <span className="absolute top-0 left-0 right-0 h-[2px] bg-zinc-700" />
            <Package size={16} strokeWidth={1.5} className="mx-auto mb-2 text-zinc-500" />
            <p className="text-3xl font-display font-semibold text-white">{loading ? "—" : orders.length}</p>
            <p className="text-[10px] font-mono tracking-widest text-zinc-500 mt-1 uppercase">Total Orders</p>
          </div>
          <div className="relative border border-zinc-800 bg-zinc-950 p-5 text-center hover-lift overflow-hidden">
            <span className="absolute top-0 left-0 right-0 h-[2px] bg-verified" />
            <BadgeCheck size={16} strokeWidth={1.5} className="mx-auto mb-2 text-verified" />
            <p className="text-3xl font-display font-semibold text-white">
              {loading ? "—" : orders.filter(o => o.status === "delivered").length}
            </p>
            <p className="text-[10px] font-mono tracking-widest text-zinc-500 mt-1 uppercase">Delivered</p>
          </div>
          <div className="relative border border-zinc-800 bg-zinc-950 p-5 text-center col-span-2 sm:col-span-1 hover-lift overflow-hidden">
            <span className="absolute top-0 left-0 right-0 h-[2px] bg-accent" />
            <Clock size={16} strokeWidth={1.5} className="mx-auto mb-2 text-accent" />
            <p className="text-3xl font-display font-semibold text-white">
              {loading ? "—" : orders.filter(o => !["delivered", "cancelled"].includes(o.status)).length}
            </p>
            <p className="text-[10px] font-mono tracking-widest text-zinc-500 mt-1 uppercase">In Progress</p>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="border border-zinc-800 bg-zinc-950">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <p className="text-[12px] font-mono font-medium tracking-widest text-zinc-300 uppercase">Recent Orders</p>
            <Link to="/account/orders" className="text-[11px] font-mono tracking-widest text-accent hover:text-foreground flex items-center gap-1 transition-colors">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
            </div>
          ) : recent.length === 0 ? (
            <div className="p-10 text-center">
              <Package size={28} className="mx-auto mb-3 text-zinc-700" strokeWidth={1} />
              <p className="text-[13px] font-mono text-zinc-400 tracking-wider">No orders yet</p>
              <Link to="/category/all" className="inline-block mt-4 text-[11px] font-mono font-medium tracking-widest text-accent hover:text-foreground border border-accent/40 hover:border-accent px-4 py-2 transition-colors uppercase">
                Shop the Vault
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {recent.map(order => (
                <Link key={order.id} to={`/account/orders/${order.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-zinc-900 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-mono text-white truncate">{order.order_number}</p>
                    <p className="text-[11px] font-mono text-zinc-500 mt-0.5">
                      {new Date(order.order_date).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                    </p>
                  </div>
                  <div className={`px-2.5 py-1 border text-[10px] font-mono font-medium tracking-widest uppercase ${getStatusBg(order.status)} ${getStatusColor(order.status)}`}>
                    {order.status.replace(/_/g, " ")}
                  </div>
                  <ArrowRight size={13} className="text-zinc-700 group-hover:text-accent transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: "/account/profile",   icon: User,        label: "Edit Profile" },
            { to: "/account/orders",    icon: ShoppingBag, label: "All Orders" },
            { to: "/account/addresses", icon: MapPin,      label: "Addresses" },
            { to: "/account/settings",  icon: Settings,    label: "Settings" },

          ].map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className="flex items-center gap-3 border border-zinc-800 bg-zinc-950 px-4 py-3.5 hover:bg-zinc-900 hover:border-accent/40 transition-colors group">
              <Icon size={15} strokeWidth={1.5} className="text-zinc-400 group-hover:text-accent transition-colors" />
              <span className="text-[13px] font-mono font-medium tracking-wider text-zinc-300 group-hover:text-white transition-colors">{label}</span>
              <ArrowRight size={12} className="ml-auto text-zinc-700 group-hover:text-accent transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </AccountLayout>
  );
}
