// src/components/order/AdminOrders.tsx
// Drop into your /admin page: <AdminOrders />

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrders } from '@/hooks/useOrders';
import type { Order, OrderUpdate } from '@/types/order';
import { ORDER_STAGES, CANCELLED_STAGE, getStatusColor, getStatusBg } from '@/types/order';
import { buildWaLink } from '@/utils/whatsappHelpers';

const ALL_STATUSES = [...ORDER_STAGES.map(s => s.status), 'cancelled'] as const;
type Panel = 'list' | 'edit';

export default function AdminOrders() {
  const { orders, loading, error, fetchAllOrders, updateOrder, updateOrderStatusWithTracking, deleteOrder } = useOrders();
  const [panel, setPanel]     = useState<Panel>('list');
  const [search, setSearch]   = useState('');
  const [editing, setEditing] = useState<Order | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [saving, setSaving]   = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── WhatsApp helpers ──────────────────────────────────────────────────────
  const [waMenu, setWaMenu] = useState<string | null>(null); // order.id with open menu

  function waLink(order: Order, type: string): string {
    const phone = (order.customer_phone ?? '').replace(/\D/g, '');
    const name  = order.customer_name;
    const id    = order.order_number;
    const amt   = `₹${order.total_amount.toLocaleString('en-IN')}`;
    const isCod = order.payment_status !== 'paid';

    const msgs: Record<string, string> = {
      placed: `Hi ${name}! 👋\n\nThank you for your order at *Mythical Vault*! 🎉\n\n🧾 *Order ID:* ${id}\n💰 *Total:* ${amt}\n\nYour order has been received and is being processed. We'll keep you updated at every step! 😊`,
      cod:    `Hi ${name}! 👋\n\nYou placed a *Cash on Delivery* order at Mythical Vault.\n\n🧾 *Order ID:* ${id}\n💰 *Amount to Pay on Delivery:* ${amt}\n\nPlease confirm or cancel:\n✅ Reply *CONFIRM* to confirm\n❌ Reply *CANCEL* to cancel`,
      payment:`Hi ${name}! 💳✅\n\nYour payment of *${amt}* has been received!\n\n🧾 *Order ID:* ${id}\n\nWe're now preparing your order for dispatch. 🚀`,
      processing: `Hi ${name}! ⚙️\n\nYour order *${id}* is now being processed and prepared for packaging!\n\nWe'll notify you as soon as it ships. 📦`,
      shipped:    `Hi ${name}! 🚀\n\nYour order *${id}* has been shipped!${order.courier_name ? `\n🚚 *Courier:* ${order.courier_name}` : ''}${order.tracking_number ? `\n📦 *Tracking:* ${order.tracking_number}` : ''}\n\nEstimated delivery: 2–5 business days. 😊`,
      out_for_delivery: `Hi ${name}! 🛵\n\nYour order *${id}* is *OUT FOR DELIVERY* today!\n\nPlease be available to receive the package.${isCod ? `\n💰 Amount to pay: *${amt}*` : '\n✅ Already paid — no payment needed!'}`,
      delivered: `Hi ${name}! 🎉\n\nYour order *${id}* has been *DELIVERED* successfully!\n\nWe hope you love your purchase. ⭐ Feel free to share your feedback!\n\nThank you for shopping with *Mythical Vault*! 🛍️`,
      cancelled: `Hi ${name},\n\nYour order *${id}* has been *cancelled*.\n\nIf you paid online, your refund will be processed within 5–7 business days.\n\nSorry for the inconvenience. Feel free to shop again! 🛍️`,
    };

    return buildWaLink(phone, msgs[type] ?? msgs.placed);
  }

  // Realtime subscription so admin list updates live
  useEffect(() => {
    fetchAllOrders();

    const channel = supabase
      .channel('admin-orders-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchAllOrders(search);
      })
      .subscribe();

    channelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [fetchAllOrders]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3000);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchAllOrders(search);
  }

  function openEdit(order: Order) {
    setEditing({ ...order });
    setPanel('edit');
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this order permanently?')) return;
    setDeleting(id);
    const ok = await deleteOrder(id);
    setDeleting(null);
    if (ok) showToast('Order deleted.');
  }

  async function handleSave() {
    if (!editing) return;
    setSaving(true);

    // If status changed, use the email-aware updater; otherwise plain updateOrder
    const statusChanged = editing.status !== orders.find(o => o.id === editing.id)?.status;

    if (statusChanged) {
      // Use updateOrderStatusWithTracking so the right email fires automatically
      const ok = await updateOrderStatusWithTracking(
        editing.id,
        editing.status,
        editing.tracking_number ?? undefined,
        undefined, // tracking_url not in this form — add if needed
      );
      if (ok) {
        // Also save the remaining non-status fields
        await updateOrder(editing.id, {
          payment_status:     editing.payment_status ?? undefined,
          courier_name:       editing.courier_name,
          estimated_delivery: editing.estimated_delivery,
          notes:              editing.notes,
          customer_name:      editing.customer_name,
          customer_email:     editing.customer_email,
          customer_phone:     editing.customer_phone,
        });
      }
      setSaving(false);
      if (ok) { showToast('Order updated — status email sent.'); setPanel('list'); setEditing(null); }
      else     { showToast('Failed to update order.'); }
    } else {
      // Status unchanged — plain update, no email
      const payload: OrderUpdate = {
        payment_status:     editing.payment_status ?? undefined,
        courier_name:       editing.courier_name,
        tracking_number:    editing.tracking_number,
        estimated_delivery: editing.estimated_delivery,
        notes:              editing.notes,
        customer_name:      editing.customer_name,
        customer_email:     editing.customer_email,
        customer_phone:     editing.customer_phone,
      };
      const ok = await updateOrder(editing.id, payload);
      setSaving(false);
      if (ok) { showToast('Order updated.'); setPanel('list'); setEditing(null); }
      else     { showToast('Failed to update order.'); }
    }
  }

  // Rendered field editors for edit panel
  function field(label: string, value: string, onChange: (v: string) => void, type = 'text') {
    return (
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 10, letterSpacing: '0.15em', color: '#71717a', textTransform: 'uppercase', marginBottom: 5 }}>{label}</label>
        <input
          type={type}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          style={{ width: '100%', background: '#18181b', border: '1px solid #3f3f46', color: '#fff', padding: '7px 10px', fontSize: 13, fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
        />
      </div>
    );
  }

  // ── EDIT PANEL ──────────────────────────────────────────────────────────
  if (panel === 'edit' && editing) {
    const e = editing;
    const set = (k: keyof Order) => (v: string) => setEditing(prev => prev ? { ...prev, [k]: v } : prev);

    return (
      <div style={{ background: '#09090b', minHeight: '100%', padding: 24, color: '#fff' }}>
        {toastMsg && <Toast msg={toastMsg} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => { setPanel('list'); setEditing(null); }} style={btnGhost}>← Back</button>
          <span style={{ fontSize: 11, fontFamily: 'monospace', letterSpacing: '0.15em', color: '#71717a', textTransform: 'uppercase' }}>
            Edit · {e.order_number}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
          {/* Status & tracking */}
          <section style={card}>
            <SectionTitle>Fulfilment</SectionTitle>
            <div style={{ marginBottom: 14 }}>
              <label style={fieldLabel}>Order Status</label>
              <select value={e.status} onChange={ev => set('status')(ev.target.value)} style={selectStyle}>
                {ALL_STATUSES.map(s => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={fieldLabel}>Payment Status</label>
              <select value={e.payment_status ?? 'pending'} onChange={ev => set('payment_status')(ev.target.value)} style={selectStyle}>
                {['pending', 'paid', 'failed', 'refunded'].map(s => (
                  <option key={s} value={s}>{s.toUpperCase()}</option>
                ))}
              </select>
            </div>
            {field('Courier Name', e.courier_name ?? '', set('courier_name'))}
            {field('Tracking Number', e.tracking_number ?? '', set('tracking_number'))}
            {field('Estimated Delivery', e.estimated_delivery ?? '', set('estimated_delivery'), 'date')}
          </section>

          {/* Customer */}
          <section style={card}>
            <SectionTitle>Customer</SectionTitle>
            {field('Full Name', e.customer_name, set('customer_name'))}
            {field('Email', e.customer_email, set('customer_email'), 'email')}
            {field('Phone', e.customer_phone ?? '', set('customer_phone'))}
          </section>

          {/* Notes */}
          <section style={card}>
            <SectionTitle>Internal Notes</SectionTitle>
            <textarea
              value={e.notes ?? ''}
              onChange={ev => setEditing(prev => prev ? { ...prev, notes: ev.target.value } : prev)}
              rows={5}
              placeholder="Admin notes (not visible to customer)"
              style={{ ...inputStyle, resize: 'vertical', width: '100%' }}
            />
          </section>

          {/* Order summary (read-only) */}
          <section style={card}>
            <SectionTitle>Order Summary</SectionTitle>
            <InfoRow label="Order No."   value={e.order_number} />
            <InfoRow label="Date"        value={new Date(e.order_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })} />
            <InfoRow label="Subtotal"    value={`₹${e.subtotal.toLocaleString('en-IN')}`} />
            <InfoRow label="GST"         value={`₹${e.gst_amount.toLocaleString('en-IN')}`} />
            <InfoRow label="Shipping"    value={`₹${e.shipping_amount.toLocaleString('en-IN')}`} />
            <InfoRow label="Total"       value={`₹${e.total_amount.toLocaleString('en-IN')}`} bold />
            <div style={{ marginTop: 12, borderTop: '1px solid #27272a', paddingTop: 12 }}>
              <label style={fieldLabel}>Items</label>
              {(e.line_items as { title: string; quantity: number; price: number }[]).map((item, i) => (
                <p key={i} style={{ fontSize: 12, color: '#a1a1aa', fontFamily: 'monospace', marginBottom: 4 }}>
                  {item.title} × {item.quantity} — ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </p>
              ))}
            </div>
          </section>
        </div>

        <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
          <button onClick={handleSave} disabled={saving} style={btnPrimary}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
          <button onClick={() => { setPanel('list'); setEditing(null); }} style={btnGhost}>Cancel</button>
        </div>
      </div>
    );
  }

  // ── LIST PANEL ───────────────────────────────────────────────────────────
  return (
    <div style={{ background: '#09090b', minHeight: '100%', padding: 24, color: '#fff' }}>
      {toastMsg && <Toast msg={toastMsg} />}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 18, fontFamily: 'monospace', letterSpacing: '0.1em', color: '#fff', margin: 0 }}>ORDERS</h2>
        <span style={{ fontSize: 11, color: '#52525b', fontFamily: 'monospace' }}>
          {orders.length} total · live sync
        </span>
      </div>

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search order number, name, email…"
          style={{ ...inputStyle, flex: 1 }}
        />
        <button type="submit" style={btnPrimary}>Search</button>
        {search && <button type="button" onClick={() => { setSearch(''); fetchAllOrders(); }} style={btnGhost}>Clear</button>}
      </form>

      {loading && <p style={{ fontFamily: 'monospace', color: '#52525b', fontSize: 12 }}>Loading…</p>}
      {error && <p style={{ color: '#f87171', fontFamily: 'monospace', fontSize: 12 }}>{error}</p>}

      {!loading && orders.length === 0 && (
        <p style={{ fontFamily: 'monospace', color: '#52525b', fontSize: 12, padding: '40px 0' }}>No orders found.</p>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'monospace' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #27272a' }}>
              {['Order #', 'Date', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '8px 12px', color: '#71717a', textAlign: 'left', fontWeight: 500, letterSpacing: '0.1em', fontSize: 10, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map(order => {
              const statusClass = getStatusBg(order.status);
              const statusText  = getStatusColor(order.status);
              return (
                <tr key={order.id} style={{ borderBottom: '1px solid #18181b' }}>
                  <td style={{ padding: '10px 12px', color: '#e4e4e7', whiteSpace: 'nowrap' }}>{order.order_number}</td>
                  <td style={{ padding: '10px 12px', color: '#71717a', whiteSpace: 'nowrap' }}>
                    {new Date(order.order_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <p style={{ color: '#e4e4e7', marginBottom: 2 }}>{order.customer_name}</p>
                    <p style={{ color: '#71717a', fontSize: 10 }}>{order.customer_email}</p>
                  </td>
                  <td style={{ padding: '10px 12px', color: '#71717a' }}>
                    {(order.line_items as unknown[]).length} item{(order.line_items as unknown[]).length !== 1 ? 's' : ''}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#e4e4e7', whiteSpace: 'nowrap' }}>
                    ₹{order.total_amount.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      fontSize: 9, letterSpacing: '0.15em', padding: '3px 7px',
                      color: order.payment_status === 'paid' ? '#4ade80' : '#facc15',
                      background: order.payment_status === 'paid' ? 'rgba(74,222,128,0.1)' : 'rgba(250,204,21,0.1)',
                      border: order.payment_status === 'paid' ? '1px solid rgba(74,222,128,0.3)' : '1px solid rgba(250,204,21,0.3)',
                      textTransform: 'uppercase',
                    }}>
                      {order.payment_status ?? 'pending'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontSize: 9, letterSpacing: '0.15em', padding: '3px 7px', textTransform: 'uppercase' }}
                          className={`${statusClass} ${statusText}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>
                    <button onClick={() => openEdit(order)} style={{ ...btnGhost, marginRight: 6, padding: '4px 10px', fontSize: 11 }}>Edit</button>
                    <button
                      onClick={() => handleDelete(order.id)}
                      disabled={deleting === order.id}
                      style={{ ...btnDanger, padding: '4px 10px', fontSize: 11, marginRight: 6 }}
                    >
                      {deleting === order.id ? '…' : 'Del'}
                    </button>
                    {/* WhatsApp dropdown */}
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <button
                        onClick={() => setWaMenu(waMenu === order.id ? null : order.id)}
                        style={btnWa}
                      >
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: 4, flexShrink: 0 }}>
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        WA ▾
                      </button>
                      {waMenu === order.id && (
                        <>
                          {/* Click-outside backdrop */}
                          <div
                            style={{ position: 'fixed', inset: 0, zIndex: 49 }}
                            onClick={() => setWaMenu(null)}
                          />
                          <div style={waDropdown}>
                            <p style={waDropdownLabel}>Send to {order.customer_name.split(' ')[0]}</p>
                            {[
                              { key: 'placed',            label: 'Order Placed' },
                              { key: 'cod',               label: 'COD Confirmation' },
                              { key: 'payment',           label: 'Payment Success' },
                              { key: 'processing',        label: 'Order Processing' },
                              { key: 'shipped',           label: 'Order Shipped' },
                              { key: 'out_for_delivery',  label: 'Out for Delivery' },
                              { key: 'delivered',         label: 'Delivered' },
                              { key: 'cancelled',         label: 'Order Cancelled' },
                            ].map(({ key, label }) => (
                              <a
                                key={key}
                                href={waLink(order, key)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setWaMenu(null)}
                                style={waItem}
                                onMouseEnter={e => (e.currentTarget.style.background = '#1c1c1f')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                {label}
                              </a>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────
function Toast({ msg }: { msg: string }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#18181b', border: '1px solid #3f3f46', color: '#e4e4e7', padding: '10px 18px', fontFamily: 'monospace', fontSize: 12, letterSpacing: '0.08em', zIndex: 9999 }}>
      {msg}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 10, letterSpacing: '0.18em', color: '#71717a', textTransform: 'uppercase', marginBottom: 14, borderBottom: '1px solid #27272a', paddingBottom: 8 }}>{children}</p>;
}

function InfoRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
      <span style={{ fontSize: 11, color: '#71717a', fontFamily: 'monospace' }}>{label}</span>
      <span style={{ fontSize: 12, color: bold ? '#fff' : '#a1a1aa', fontFamily: 'monospace', fontWeight: bold ? 600 : 400 }}>{value}</span>
    </div>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  background: '#0c0c0e',
  border: '1px solid #27272a',
  padding: 20,
};

const inputStyle: React.CSSProperties = {
  background: '#18181b',
  border: '1px solid #3f3f46',
  color: '#e4e4e7',
  padding: '8px 12px',
  fontSize: 13,
  fontFamily: 'monospace',
  outline: 'none',
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  width: '100%',
  cursor: 'pointer',
};

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  letterSpacing: '0.15em',
  color: '#71717a',
  textTransform: 'uppercase',
  marginBottom: 5,
};

const btnPrimary: React.CSSProperties = {
  background: '#fff',
  color: '#000',
  border: 'none',
  padding: '8px 18px',
  fontSize: 11,
  fontFamily: 'monospace',
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  cursor: 'pointer',
};

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  color: '#a1a1aa',
  border: '1px solid #3f3f46',
  padding: '8px 18px',
  fontSize: 11,
  fontFamily: 'monospace',
  letterSpacing: '0.1em',
  cursor: 'pointer',
};

const btnDanger: React.CSSProperties = {
  background: 'transparent',
  color: '#f87171',
  border: '1px solid rgba(248,113,113,0.3)',
  padding: '8px 12px',
  fontSize: 11,
  fontFamily: 'monospace',
  cursor: 'pointer',
};

const btnWa: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  background: 'transparent',
  color: '#25D366',
  border: '1px solid rgba(37,211,102,0.35)',
  padding: '4px 10px',
  fontSize: 11,
  fontFamily: 'monospace',
  letterSpacing: '0.08em',
  cursor: 'pointer',
};

const waDropdown: React.CSSProperties = {
  position: 'absolute',
  right: 0,
  top: '100%',
  marginTop: 4,
  background: '#0c0c0e',
  border: '1px solid #27272a',
  minWidth: 180,
  zIndex: 50,
  boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
};

const waDropdownLabel: React.CSSProperties = {
  fontSize: 9,
  letterSpacing: '0.15em',
  color: '#52525b',
  textTransform: 'uppercase',
  padding: '8px 12px 6px',
  borderBottom: '1px solid #27272a',
  margin: 0,
};

const waItem: React.CSSProperties = {
  display: 'block',
  padding: '7px 12px',
  fontSize: 11,
  fontFamily: 'monospace',
  color: '#a1a1aa',
  textDecoration: 'none',
  cursor: 'pointer',
  background: 'transparent',
  transition: 'background 0.1s',
};
