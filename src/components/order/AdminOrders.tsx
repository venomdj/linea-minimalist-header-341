// src/components/order/AdminOrders.tsx
// Drop into your /admin page: <AdminOrders />

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrders } from '@/hooks/useOrders';
import type { Order, OrderUpdate } from '@/types/order';
import { ORDER_STAGES, CANCELLED_STAGE, getStatusColor, getStatusBg } from '@/types/order';

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
                      style={{ ...btnDanger, padding: '4px 10px', fontSize: 11 }}
                    >
                      {deleting === order.id ? '…' : 'Del'}
                    </button>
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
