// src/components/order/AdminOrders.tsx
// Drop this panel into your existing /admin page.
// Usage: import AdminOrders from '../components/order/AdminOrders';
//        Then render <AdminOrders /> inside your admin dashboard tab/section.


import { useState, useEffect, useCallback } from 'react';
import { useOrders } from '../../hooks/useOrders';
import type { Order, OrderInsert, OrderUpdate, TrackingStatus } from '../../types/order';
import { TRACKING_STAGES } from '../../types/order';

type Panel = 'list' | 'create' | 'edit';

export default function AdminOrders() {
  const { orders, loading, error, fetchAllOrders, createOrder, updateOrder, deleteOrder } =
    useOrders();
  const [panel, setPanel]         = useState<Panel>('list');
  const [search, setSearch]       = useState('');
  const [editing, setEditing]     = useState<Order | null>(null);
  const [toast, setToast]         = useState('');
  const [deleting, setDeleting]   = useState<string | null>(null);

  useEffect(() => { fetchAllOrders(); }, [fetchAllOrders]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchAllOrders(search);
  }

  function openEdit(order: Order) {
    setEditing(order);
    setPanel('edit');
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this order permanently?')) return;
    setDeleting(id);
    const ok = await deleteOrder(id);
    setDeleting(null);
    if (ok) showToast('Order deleted.');
  }

  return (
    <div style={s.wrap}>
      {/* Toast */}
      {toast && <div style={s.toast}>{toast}</div>}

      {/* Header bar */}
      <div style={s.topBar}>
        <h2 style={s.heading}>Orders</h2>
        <div style={s.topActions}>
          <button style={s.btnPrimary} onClick={() => setPanel('create')}>+ New Order</button>
          <button
            style={{ ...s.btnGhost, opacity: panel === 'list' ? 0.4 : 1 }}
            onClick={() => { setPanel('list'); setEditing(null); }}
          >
            ← Back to List
          </button>
        </div>
      </div>

      {error && <div style={s.errorBar}>{error}</div>}

      {/* ── List Panel ───────────────────────────────────── */}
      {panel === 'list' && (
        <>
          <form onSubmit={handleSearch} style={s.searchRow}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by order #, name, or email…"
              style={s.searchInput}
            />
            <button type="submit" style={s.btnPrimary}>Search</button>
            {search && (
              <button type="button" style={s.btnGhost} onClick={() => { setSearch(''); fetchAllOrders(); }}>
                Clear
              </button>
            )}
          </form>

          {loading ? (
            <div style={s.center}>Loading orders…</div>
          ) : orders.length === 0 ? (
            <div style={s.emptyState}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📦</div>
              <div>No orders yet. Create your first one above.</div>
            </div>
          ) : (
            <div style={s.tableWrap}>
              <table style={s.table}>
                <thead>
                  <tr>
                    {['Order #','Customer','Product','Status','Date','Actions'].map(h => (
                      <th key={h} style={s.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id} style={s.tr}>
                      <td style={s.td}><span style={s.orderNum}>{order.order_number}</span></td>
                      <td style={s.td}>
                        <div style={s.cellPrimary}>{order.customer_name}</div>
                        <div style={s.cellSub}>{order.customer_email}</div>
                      </td>
                      <td style={s.td}>
                        <div style={s.cellPrimary}>{order.product_name}</div>
                        <div style={s.cellSub}>Qty: {order.quantity}</div>
                      </td>
                      <td style={s.td}>
                        <StatusBadge status={order.tracking_status} />
                      </td>
                      <td style={s.td} className="whitespace-nowrap">
                        <div style={s.cellSub}>{fmtDate(order.order_date)}</div>
                        {order.estimated_delivery && (
                          <div style={{ ...s.cellSub, color: '#c9a96e' }}>
                            Est: {fmtDate(order.estimated_delivery)}
                          </div>
                        )}
                      </td>
                      <td style={s.td}>
                        <div style={s.actions}>
                          <button style={s.btnEdit} onClick={() => openEdit(order)}>Edit</button>
                          <button
                            style={s.btnDelete}
                            onClick={() => handleDelete(order.id)}
                            disabled={deleting === order.id}
                          >
                            {deleting === order.id ? '…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Create Panel ─────────────────────────────────── */}
      {panel === 'create' && (
        <CreateOrderForm
          onSave={async (data) => {
            const ok = await createOrder(data);
            if (ok) { showToast('Order created!'); setPanel('list'); }
          }}
          onCancel={() => setPanel('list')}
        />
      )}

      {/* ── Edit Panel ───────────────────────────────────── */}
      {panel === 'edit' && editing && (
        <EditOrderForm
          order={editing}
          onSave={async (updates) => {
            const ok = await updateOrder(editing.id, updates);
            if (ok) { showToast('Order updated!'); setPanel('list'); setEditing(null); }
          }}
          onCancel={() => { setPanel('list'); setEditing(null); }}
        />
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TrackingStatus }) {
  const stage = TRACKING_STAGES.find(st => st.status === status);
  const colors: Record<TrackingStatus, string> = {
    order_placed:       '#3a3a1a',
    payment_confirmed:  '#1a2a3a',
    processing:         '#1a1a3a',
    shipped:            '#1a3a2a',
    out_for_delivery:   '#2a1a3a',
    delivered:          '#1a3a1a',
  };
  return (
    <span style={{
      background: colors[status],
      border: `1px solid ${colors[status].replace('1a', '4a').replace('2a', '5a').replace('3a', '6a')}`,
      color: '#c9a96e',
      fontSize: '0.7rem',
      padding: '0.25rem 0.6rem',
      borderRadius: '2px',
      letterSpacing: '0.05em',
      fontFamily: "'Inter', sans-serif",
      whiteSpace: 'nowrap' as const,
    }}>
      {stage?.icon} {stage?.label}
    </span>
  );
}

function CreateOrderForm({
  onSave, onCancel,
}: { onSave: (d: OrderInsert) => void; onCancel: () => void }) {
  const [f, setF] = useState<OrderInsert>({
    order_number: '',
    customer_name: '',
    customer_email: '',
    product_name: '',
    product_image: null,
    quantity: 1,
    order_date: new Date().toISOString(),
    tracking_status: 'order_placed',
    tracking_message: null,
    courier_name: null,
    tracking_number: null,
    estimated_delivery: null,
  });

  function field(key: keyof OrderInsert) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = e.target.type === 'number' ? Number(e.target.value) : e.target.value || null;
      setF(prev => ({ ...prev, [key]: val }));
    };
  }

  return (
    <div style={s.formWrap}>
      <h3 style={s.formTitle}>Create New Order</h3>
      <div style={s.grid2}>
        <Field label="Order Number *" required>
          <input style={s.inp} value={f.order_number} onChange={e => setF(p => ({ ...p, order_number: e.target.value.toUpperCase() }))} placeholder="MV-20240601-001" required />
        </Field>
        <Field label="Order Date *">
          <input type="datetime-local" style={s.inp} value={f.order_date.slice(0, 16)} onChange={e => setF(p => ({ ...p, order_date: new Date(e.target.value).toISOString() }))} />
        </Field>
        <Field label="Customer Name *">
          <input style={s.inp} value={f.customer_name} onChange={e => setF(p => ({ ...p, customer_name: e.target.value }))} placeholder="Full name" required />
        </Field>
        <Field label="Customer Email *">
          <input type="email" style={s.inp} value={f.customer_email} onChange={e => setF(p => ({ ...p, customer_email: e.target.value.toLowerCase() }))} placeholder="email@example.com" required />
        </Field>
        <Field label="Product Name *">
          <input style={s.inp} value={f.product_name} onChange={e => setF(p => ({ ...p, product_name: e.target.value }))} placeholder="Product name" required />
        </Field>
        <Field label="Quantity">
          <input type="number" style={s.inp} value={f.quantity} min={1} onChange={e => setF(p => ({ ...p, quantity: Number(e.target.value) }))} />
        </Field>
        <Field label="Product Image URL">
          <input style={s.inp} value={f.product_image ?? ''} onChange={field('product_image')} placeholder="https://…" />
        </Field>
        <Field label="Status">
          <select style={s.inp} value={f.tracking_status} onChange={e => setF(p => ({ ...p, tracking_status: e.target.value as TrackingStatus }))}>
            {TRACKING_STAGES.map(st => <option key={st.status} value={st.status}>{st.icon} {st.label}</option>)}
          </select>
        </Field>
        <Field label="Courier Name">
          <input style={s.inp} value={f.courier_name ?? ''} onChange={field('courier_name')} placeholder="e.g. Blue Dart" />
        </Field>
        <Field label="Tracking Number">
          <input style={s.inp} value={f.tracking_number ?? ''} onChange={field('tracking_number')} placeholder="Courier tracking ID" />
        </Field>
        <Field label="Estimated Delivery">
          <input type="date" style={s.inp} value={f.estimated_delivery ?? ''} onChange={e => setF(p => ({ ...p, estimated_delivery: e.target.value || null }))} />
        </Field>
      </div>
      <Field label="Status Message (shown to customer)">
        <textarea style={{ ...s.inp, height: '80px', resize: 'vertical' }} value={f.tracking_message ?? ''} onChange={field('tracking_message')} placeholder="e.g. Your order has been dispatched from our Mumbai warehouse." />
      </Field>
      <div style={s.btnRow}>
        <button style={s.btnPrimary} onClick={() => {
          if (!f.order_number || !f.customer_name || !f.customer_email || !f.product_name) {
            alert('Fill all required fields'); return;
          }
          onSave(f);
        }}>Create Order</button>
        <button style={s.btnGhost} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function EditOrderForm({
  order, onSave, onCancel,
}: { order: Order; onSave: (u: OrderUpdate) => void; onCancel: () => void }) {
  const [f, setF] = useState<OrderUpdate & { order_number: string; customer_name: string; customer_email: string; product_name: string; quantity: number; order_date: string }>({
    order_number:       order.order_number,
    customer_name:      order.customer_name,
    customer_email:     order.customer_email,
    product_name:       order.product_name,
    product_image:      order.product_image,
    quantity:           order.quantity,
    order_date:         order.order_date,
    tracking_status:    order.tracking_status,
    tracking_message:   order.tracking_message,
    courier_name:       order.courier_name,
    tracking_number:    order.tracking_number,
    estimated_delivery: order.estimated_delivery,
  });

  function field(key: keyof typeof f) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const val = e.target.type === 'number' ? Number(e.target.value) : (e.target.value || null);
      setF(prev => ({ ...prev, [key]: val }));
    };
  }

  return (
    <div style={s.formWrap}>
      <h3 style={s.formTitle}>Edit Order — {order.order_number}</h3>
      <div style={s.grid2}>
        <Field label="Customer Name">
          <input style={s.inp} value={f.customer_name} onChange={e => setF(p => ({ ...p, customer_name: e.target.value }))} />
        </Field>
        <Field label="Customer Email">
          <input type="email" style={s.inp} value={f.customer_email} onChange={e => setF(p => ({ ...p, customer_email: e.target.value.toLowerCase() }))} />
        </Field>
        <Field label="Product Name">
          <input style={s.inp} value={f.product_name} onChange={e => setF(p => ({ ...p, product_name: e.target.value }))} />
        </Field>
        <Field label="Quantity">
          <input type="number" style={s.inp} value={f.quantity} min={1} onChange={e => setF(p => ({ ...p, quantity: Number(e.target.value) }))} />
        </Field>
        <Field label="Product Image URL">
          <input style={s.inp} value={f.product_image ?? ''} onChange={field('product_image')} />
        </Field>
        <Field label="Status">
          <select style={s.inp} value={f.tracking_status} onChange={e => setF(p => ({ ...p, tracking_status: e.target.value as TrackingStatus }))}>
            {TRACKING_STAGES.map(st => <option key={st.status} value={st.status}>{st.icon} {st.label}</option>)}
          </select>
        </Field>
        <Field label="Courier Name">
          <input style={s.inp} value={f.courier_name ?? ''} onChange={field('courier_name')} placeholder="e.g. Blue Dart" />
        </Field>
        <Field label="Tracking Number">
          <input style={s.inp} value={f.tracking_number ?? ''} onChange={field('tracking_number')} />
        </Field>
        <Field label="Estimated Delivery">
          <input type="date" style={s.inp} value={f.estimated_delivery ?? ''} onChange={e => setF(p => ({ ...p, estimated_delivery: e.target.value || null }))} />
        </Field>
      </div>
      <Field label="Status Message (shown to customer)">
        <textarea style={{ ...s.inp, height: '80px', resize: 'vertical' }} value={f.tracking_message ?? ''} onChange={field('tracking_message')} />
      </Field>
      <div style={s.btnRow}>
        <button style={s.btnPrimary} onClick={() => onSave(f)}>Save Changes</button>
        <button style={{ ...s.btnPrimary, background: 'linear-gradient(135deg, #4a9a4a, #2a7a2a)' }} onClick={() => onSave({ ...f, tracking_status: 'delivered', tracking_message: f.tracking_message ?? 'Your order has been delivered!' })}>
          ✅ Mark Delivered
        </button>
        <button style={s.btnGhost} onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <label style={s.fieldLabel}>{label}{required && <span style={{ color: '#c9a96e' }}> *</span>}</label>
      {children}
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  wrap:         { padding: '1.5rem', fontFamily: "'Inter', sans-serif", color: '#e0d9cc', position: 'relative' },
  topBar:       { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' },
  heading:      { fontSize: '1.4rem', fontWeight: 600, color: '#f0e8d8', margin: 0 },
  topActions:   { display: 'flex', gap: '0.75rem' },
  btnPrimary:   { background: 'linear-gradient(135deg, #c9a96e, #a07848)', color: '#0a0a0a', border: 'none', borderRadius: '3px', fontSize: '0.78rem', fontWeight: 700, padding: '0.6rem 1.25rem', cursor: 'pointer', letterSpacing: '0.04em' },
  btnGhost:     { background: 'transparent', color: '#888', border: '1px solid #2a2a2a', borderRadius: '3px', fontSize: '0.78rem', padding: '0.6rem 1.25rem', cursor: 'pointer' },
  btnEdit:      { background: '#1a2a3a', color: '#7aa7cc', border: '1px solid #2a3a4a', borderRadius: '2px', fontSize: '0.72rem', padding: '0.3rem 0.75rem', cursor: 'pointer' },
  btnDelete:    { background: '#2a1a1a', color: '#cc7777', border: '1px solid #3a2a2a', borderRadius: '2px', fontSize: '0.72rem', padding: '0.3rem 0.75rem', cursor: 'pointer' },
  errorBar:     { background: '#1a0f0f', border: '1px solid #3a1a1a', borderRadius: '3px', padding: '0.75rem 1rem', color: '#cc7777', marginBottom: '1rem', fontSize: '0.85rem' },
  searchRow:    { display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' },
  searchInput:  { flex: 1, minWidth: '200px', background: '#111', border: '1px solid #2a2a2a', borderRadius: '3px', color: '#e0d9cc', fontSize: '0.85rem', padding: '0.6rem 1rem', outline: 'none' },
  center:       { textAlign: 'center', padding: '3rem', color: '#555' },
  emptyState:   { textAlign: 'center', padding: '4rem 2rem', color: '#444', background: '#0d0d0d', borderRadius: '4px', border: '1px solid #1a1a1a' },
  tableWrap:    { overflowX: 'auto', borderRadius: '4px', border: '1px solid #1e1e1e' },
  table:        { width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' },
  th:           { textAlign: 'left', padding: '0.75rem 1rem', fontSize: '0.65rem', letterSpacing: '0.12em', color: '#555', textTransform: 'uppercase', borderBottom: '1px solid #1e1e1e', background: '#0d0d0d' },
  tr:           { borderBottom: '1px solid #1a1a1a' },
  td:           { padding: '0.9rem 1rem', verticalAlign: 'middle' },
  orderNum:     { color: '#c9a96e', fontWeight: 600, letterSpacing: '0.04em' },
  cellPrimary:  { color: '#e0d9cc' },
  cellSub:      { color: '#555', fontSize: '0.78rem', marginTop: '0.1rem' },
  actions:      { display: 'flex', gap: '0.5rem' },
  formWrap:     { background: '#0d0d0d', border: '1px solid #1e1e1e', borderRadius: '4px', padding: '2rem', maxWidth: '900px' },
  formTitle:    { fontSize: '1.1rem', fontWeight: 600, color: '#f0e8d8', marginTop: 0, marginBottom: '1.5rem', letterSpacing: '0.02em' },
  grid2:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' },
  fieldLabel:   { fontSize: '0.7rem', letterSpacing: '0.12em', color: '#555', textTransform: 'uppercase' },
  inp:          { background: '#111', border: '1px solid #2a2a2a', borderRadius: '3px', color: '#e0d9cc', fontSize: '0.88rem', padding: '0.65rem 0.9rem', outline: 'none', fontFamily: "'Inter', sans-serif", width: '100%', boxSizing: 'border-box' },
  btnRow:       { display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' },
  toast:        { position: 'fixed', bottom: '2rem', right: '2rem', background: '#1a3a1a', border: '1px solid #4a8a4a', color: '#7acc7a', padding: '0.75rem 1.5rem', borderRadius: '3px', fontSize: '0.85rem', zIndex: 9999 },
};
