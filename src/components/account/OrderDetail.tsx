// src/pages/account/OrderDetail.tsx
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Copy, Package } from "lucide-react";
import { toast } from "sonner";
import AccountLayout from "@/components/account/AccountLayout";
import OrderTimeline from "@/components/account/OrderTimeline";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import type { Order } from "@/types/order";
import { getStatusBg, getStatusColor } from "@/types/order";

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId || !user) return;
    setLoading(true);

    supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error: err }) => {
        if (err || !data) setError("Order not found");
        else setOrder(data as Order);
        setLoading(false);
      });

    // Realtime subscription for status updates
    const channel = supabase
      .channel(`order-detail-${orderId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${orderId}` }, payload => {
        setOrder(payload.new as Order);
        toast.info("Order status updated");
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [orderId, user]);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success(`${label} copied`));
  };

  return (
    <AccountLayout title="Order Details">
      <div className="space-y-5">
        {/* Back */}
        <Link to="/account/orders" className="inline-flex items-center gap-2 text-[11px] font-mono tracking-widest text-zinc-500 hover:text-white transition-colors uppercase">
          <ArrowLeft size={12} /> Back to Orders
        </Link>

        {loading ? (
          <div className="border border-zinc-800 bg-zinc-950 p-12 flex justify-center">
            <div className="w-5 h-5 border-2 border-zinc-700 border-t-zinc-300 rounded-full animate-spin" />
          </div>
        ) : error || !order ? (
          <div className="border border-zinc-800 bg-zinc-950 p-10 text-center">
            <Package size={28} className="mx-auto mb-3 text-zinc-700" strokeWidth={1} />
            <p className="text-[12px] font-mono text-zinc-500">{error ?? "Order not found"}</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="border border-zinc-800 bg-zinc-950 p-6">
              <div className="flex flex-wrap items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase mb-1">Order</p>
                  <div className="flex items-center gap-2">
                    <h2 className="font-mono text-white text-lg">{order.order_number}</h2>
                    <button onClick={() => copy(order.order_number, "Order number")} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                      <Copy size={13} />
                    </button>
                  </div>
                  <p className="text-[11px] font-mono text-zinc-500 mt-1">
                    Placed {new Date(order.order_date).toLocaleDateString("en-IN", { dateStyle: "long" })}
                  </p>
                </div>
                <span className={`px-3 py-1 border text-[10px] font-mono tracking-widest uppercase ${getStatusBg(order.status)} ${getStatusColor(order.status)}`}>
                  {order.status.replace(/_/g, " ")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Tracking timeline */}
              <div className="border border-zinc-800 bg-zinc-950 p-6">
                <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase mb-5">Tracking</p>
                <OrderTimeline order={order} />
                {order.tracking_number && (
                  <div className="mt-5 pt-4 border-t border-zinc-800">
                    <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase mb-2">Courier Info</p>
                    <p className="text-[13px] font-mono text-white">{order.courier_name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[12px] font-mono text-zinc-400">{order.tracking_number}</p>
                      <button onClick={() => copy(order.tracking_number!, "Tracking number")} className="text-zinc-600 hover:text-zinc-400 transition-colors">
                        <Copy size={12} />
                      </button>
                    </div>
                    {order.estimated_delivery && (
                      <p className="text-[11px] font-mono text-zinc-500 mt-1">
                        Est. delivery: {new Date(order.estimated_delivery).toLocaleDateString("en-IN", { dateStyle: "long" })}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Order details */}
              <div className="space-y-4">
                {/* Items */}
                <div className="border border-zinc-800 bg-zinc-950 p-5">
                  <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase mb-4">Items</p>
                  <div className="space-y-3">
                    {(order.line_items as { title: string; image_url: string | null; quantity: number; price: number }[]).map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {item.image_url && (
                          <img src={item.image_url} alt={item.title} className="w-12 h-12 object-cover border border-zinc-800 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-white truncate">{item.title}</p>
                          <p className="text-[11px] font-mono text-zinc-500">Qty: {item.quantity}</p>
                        </div>
                        <p className="text-[13px] font-mono text-zinc-300 flex-shrink-0">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-zinc-800 mt-4 pt-4 space-y-1.5">
                    <div className="flex justify-between text-[11px] font-mono text-zinc-500">
                      <span>Subtotal</span><span>₹{order.subtotal.toLocaleString("en-IN")}</span>
                    </div>
                    {order.gst_amount > 0 && (
                      <div className="flex justify-between text-[11px] font-mono text-zinc-500">
                        <span>GST</span><span>₹{order.gst_amount.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    {order.shipping_amount > 0 && (
                      <div className="flex justify-between text-[11px] font-mono text-zinc-500">
                        <span>Shipping</span><span>₹{order.shipping_amount.toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[13px] font-mono text-white border-t border-zinc-800 pt-2 mt-2">
                      <span>Total</span><span>₹{order.total_amount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping */}
                <div className="border border-zinc-800 bg-zinc-950 p-5">
                  <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase mb-3">Shipping Address</p>
                  <div className="text-[12px] font-mono text-zinc-400 space-y-0.5">
                    <p className="text-white">{order.customer_name}</p>
                    <p>{order.shipping_address}</p>
                    {order.shipping_address2 && <p>{order.shipping_address2}</p>}
                    <p>{[order.shipping_city, order.shipping_state, order.shipping_pincode].filter(Boolean).join(", ")}</p>
                    <p className="text-zinc-500 pt-1">{order.customer_phone}</p>
                  </div>
                </div>

                {/* Payment */}
                <div className="border border-zinc-800 bg-zinc-950 p-5">
                  <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase mb-3">Payment</p>
                  <div className="flex items-center justify-between text-[12px] font-mono">
                    <span className="text-zinc-400">Method</span>
                    <span className="text-zinc-300 uppercase">{order.payment_method ?? "UPI"}</span>
                  </div>
                  <div className="flex items-center justify-between text-[12px] font-mono mt-2">
                    <span className="text-zinc-400">Status</span>
                    <span className={`uppercase ${order.payment_status === "paid" ? "text-green-400" : "text-yellow-400"}`}>
                      {order.payment_status ?? "Pending"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {order.notes && (
              <div className="border border-zinc-800 bg-zinc-950 p-5">
                <p className="text-[11px] font-mono tracking-widest text-zinc-500 uppercase mb-2">Notes</p>
                <p className="text-[12px] text-zinc-400">{order.notes}</p>
              </div>
            )}
          </>
        )}
      </div>
    </AccountLayout>
  );
}
