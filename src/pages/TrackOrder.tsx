// src/pages/TrackOrder.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { lookupOrder } from '../hooks/useOrders';
import type { Order } from '../types/order';
import { ORDER_STAGES, CANCELLED_STAGE, getStageIndex } from '../types/order';
import Header from '../components/header/Header';
import Footer from '../components/footer/Footer';

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail]             = useState('');
  const [order, setOrder]             = useState<Order | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [searched, setSearched]       = useState(false);

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    setSearched(true);
    const result = await lookupOrder(orderNumber, email);
    if (!result) {
      setError('No order found. Please check your Order ID and email address.');
    } else {
      setOrder(result);
    }
    setLoading(false);
  }

  const stageIndex = order ? (order.status === 'cancelled' ? -1 : getStageIndex(order.status)) : -1;
  const isCancelled = order?.status === 'cancelled';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 py-16 px-4">
        <div className="max-w-xl mx-auto">

          {/* Header */}
          <div className="text-center mb-10">
            <p className="text-[10px] font-mono tracking-[0.25em] text-zinc-500 uppercase mb-3">Order Tracking</p>
            <h1 className="font-display text-3xl md:text-4xl text-white tracking-tight">Track Your Order</h1>
            <p className="text-sm text-zinc-500 mt-3 font-mono">Enter your Order ID and the email used at checkout.</p>
          </div>

          {/* Search form */}
          <form onSubmit={handleTrack} className="border border-zinc-800 bg-zinc-950 p-6 space-y-4 mb-6">
            <div>
              <label className="block text-[10px] font-mono tracking-widest text-zinc-500 uppercase mb-2">Order ID</label>
              <input
                type="text"
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value.toUpperCase())}
                placeholder="e.g. MVLT-ABC123-XY9Z"
                required
                className="w-full h-10 bg-zinc-900 border border-zinc-700 text-white text-sm font-mono px-3 focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono tracking-widest text-zinc-500 uppercase mb-2">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full h-10 bg-zinc-900 border border-zinc-700 text-white text-sm font-mono px-3 focus:outline-none focus:border-zinc-500 transition-colors placeholder:text-zinc-700"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-white text-black text-[11px] font-mono tracking-widest uppercase hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Searching…' : 'Track Order →'}
            </button>
          </form>

          {/* Error */}
          {error && !loading && (
            <div className="border border-red-900/50 bg-zinc-950 px-4 py-3 text-[12px] font-mono text-red-400 mb-4">
              ⚠ {error}
            </div>
          )}

          {/* Order card */}
          {order && (
            <div className="border border-zinc-800 bg-zinc-950">
              {/* Header */}
              <div className="flex items-start justify-between p-5 border-b border-zinc-800 gap-4 flex-wrap">
                <div>
                  <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mb-1">Order</p>
                  <p className="font-mono text-white text-base">{order.order_number}</p>
                  <p className="text-[11px] font-mono text-zinc-500 mt-1">
                    {new Date(order.order_date).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                  </p>
                </div>
                <span className={`px-3 py-1 text-[10px] font-mono tracking-widest uppercase border ${
                  isCancelled ? 'border-red-400/30 bg-red-400/10 text-red-400'
                  : stageIndex === ORDER_STAGES.length - 1 ? 'border-green-400/30 bg-green-400/10 text-green-400'
                  : 'border-yellow-400/30 bg-yellow-400/10 text-yellow-400'
                }`}>
                  {order.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Timeline */}
              <div className="p-5 border-b border-zinc-800">
                <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mb-5">Tracking</p>

                {isCancelled ? (
                  <div className="flex items-center gap-2 text-[12px] font-mono text-red-400">
                    <span>{CANCELLED_STAGE.icon}</span>
                    <span>{CANCELLED_STAGE.description}</span>
                  </div>
                ) : (
                  <div>
                    {ORDER_STAGES.map((stage, i) => {
                      const done    = i < stageIndex;
                      const current = i === stageIndex;
                      return (
                        <div key={stage.status} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs flex-shrink-0 ${
                              done    ? 'border-zinc-500 bg-zinc-800 text-zinc-300'
                              : current ? 'border-zinc-300 bg-zinc-900 text-white ring-2 ring-zinc-700 ring-offset-1 ring-offset-zinc-950'
                              : 'border-zinc-800 bg-zinc-950 text-zinc-700'
                            }`}>
                              {done ? '✓' : stage.icon}
                            </div>
                            {i < ORDER_STAGES.length - 1 && (
                              <div className={`w-px flex-1 mt-1 mb-1 min-h-[24px] ${done ? 'bg-zinc-600' : 'bg-zinc-800'}`} />
                            )}
                          </div>
                          <div className="pb-4">
                            <p className={`text-[12px] font-mono tracking-wider mt-1 ${
                              done ? 'text-zinc-500' : current ? 'text-white' : 'text-zinc-700'
                            }`}>{stage.label}</p>
                            {current && <p className="text-[11px] text-zinc-500 mt-0.5">{stage.description}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Courier info */}
              {order.tracking_number && (
                <div className="p-5 border-b border-zinc-800">
                  <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mb-3">Courier</p>
                  <div className="space-y-1.5">
                    {order.courier_name && <p className="text-[13px] font-mono text-zinc-300">{order.courier_name}</p>}
                    <p className="text-[12px] font-mono text-zinc-400">{order.tracking_number}</p>
                    {order.estimated_delivery && (
                      <p className="text-[11px] font-mono text-zinc-500">
                        Est. delivery: {new Date(order.estimated_delivery).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Items */}
              {(order.line_items as unknown[]).length > 0 && (
                <div className="p-5 border-b border-zinc-800">
                  <p className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase mb-3">Items</p>
                  <div className="space-y-2">
                    {(order.line_items as { title: string; image_url: string | null; quantity: number; price: number }[]).map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {item.image_url && <img src={item.image_url} alt={item.title} className="w-10 h-10 object-cover border border-zinc-800 flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] text-zinc-300 truncate">{item.title}</p>
                          <p className="text-[10px] font-mono text-zinc-600">×{item.quantity} · ₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA for logged in users */}
              <div className="p-5">
                <p className="text-[11px] font-mono text-zinc-600">
                  For full order history and real-time updates,{' '}
                  <Link to="/account/orders" className="text-zinc-400 hover:text-white transition-colors underline underline-offset-2">
                    view in My Account →
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
