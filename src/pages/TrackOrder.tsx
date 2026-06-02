// src/pages/TrackOrder.tsx
import { useState } from 'react';
import { lookupOrder } from '../hooks/useOrders';
import type { Order } from '../types/order';
import { TRACKING_STAGES, getStageIndex } from '../types/order';

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

  const stageIndex = order ? getStageIndex(order.tracking_status) : -1;

  return (
    <div style={styles.page}>
      {/* Background texture */}
      <div style={styles.bgNoise} />

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.badgeRow}>
            <span style={styles.badge}>ORDER TRACKING</span>
          </div>
          <h1 style={styles.title}>Track Your Order</h1>
          <p style={styles.subtitle}>
            Enter your Order ID and the email address used at checkout.
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleTrack} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Order ID</label>
            <input
              type="text"
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              placeholder="e.g. MV-20240601-001"
              style={styles.input}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={styles.input}
              required
            />
          </div>
          <button type="submit" style={styles.btn} disabled={loading}>
            {loading ? (
              <span style={styles.spinner}>⟳</span>
            ) : (
              'Track Order →'
            )}
          </button>
        </form>

        {/* Error */}
        {error && !loading && (
          <div style={styles.errorBox}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span> {error}
          </div>
        )}

        {/* No result empty state */}
        {searched && !loading && !order && !error && (
          <div style={styles.emptyState}>No results yet.</div>
        )}

        {/* Order card */}
        {order && (
          <div style={styles.card}>
            {/* Order meta */}
            <div style={styles.cardHeader}>
              <div>
                <div style={styles.orderNumLabel}>ORDER</div>
                <div style={styles.orderNum}>#{order.order_number}</div>
              </div>
              <div style={styles.statusPill}>
                {TRACKING_STAGES[stageIndex]?.icon}{' '}
                {TRACKING_STAGES[stageIndex]?.label}
              </div>
            </div>

            {/* Progress bar */}
            <div style={styles.progressWrap}>
              {TRACKING_STAGES.map((stage, i) => {
                const done    = i <= stageIndex;
                const current = i === stageIndex;
                return (
                  <div key={stage.status} style={styles.stageItem}>
                    <div style={{ position: 'relative' }}>
                      {/* connector line left */}
                      {i > 0 && (
                        <div style={{
                          ...styles.connector,
                          background: i <= stageIndex ? '#c9a96e' : '#2a2a2a',
                        }} />
                      )}
                      <div style={{
                        ...styles.dot,
                        background: done ? '#c9a96e' : '#1a1a1a',
                        border: `2px solid ${done ? '#c9a96e' : '#3a3a3a'}`,
                        boxShadow: current ? '0 0 12px #c9a96e88' : 'none',
                        transform: current ? 'scale(1.25)' : 'scale(1)',
                      }}>
                        {done && <span style={{ fontSize: '0.6rem' }}>✓</span>}
                      </div>
                    </div>
                    <span style={{
                      ...styles.stageLabel,
                      color: done ? '#c9a96e' : '#555',
                      fontWeight: current ? 700 : 400,
                    }}>
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Status message */}
            {order.tracking_message && (
              <div style={styles.messageBox}>
                <span style={{ color: '#c9a96e', marginRight: '0.5rem' }}>📣</span>
                {order.tracking_message}
              </div>
            )}

            {/* Details grid */}
            <div style={styles.detailsGrid}>
              <DetailRow label="Customer"         value={order.customer_name} />
              <DetailRow label="Product"          value={`${order.product_name} × ${order.quantity}`} />
              <DetailRow label="Order Date"       value={fmtDate(order.order_date)} />
              {order.estimated_delivery && (
                <DetailRow label="Est. Delivery"  value={fmtDate(order.estimated_delivery)} highlight />
              )}
              {order.courier_name && (
                <DetailRow label="Courier"        value={order.courier_name} />
              )}
              {order.tracking_number && (
                <DetailRow label="Tracking No."   value={order.tracking_number} mono />
              )}
            </div>

            {/* Product image */}
            {order.product_image && (
              <div style={styles.imgWrap}>
                <img src={order.product_image} alt={order.product_name} style={styles.img} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DetailRow({
  label, value, highlight, mono,
}: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <div style={styles.detailRow}>
      <span style={styles.detailLabel}>{label}</span>
      <span style={{
        ...styles.detailValue,
        color: highlight ? '#c9a96e' : '#e0d9cc',
        fontFamily: mono ? "'Courier New', monospace" : 'inherit',
        letterSpacing: mono ? '0.05em' : 'normal',
      }}>
        {value}
      </span>
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#0a0a0a',
    color: '#e0d9cc',
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: '4rem',
  },
  bgNoise: {
    position: 'fixed',
    inset: 0,
    backgroundImage: 'radial-gradient(ellipse at 20% 50%, #1a1208 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #0d1a1a 0%, transparent 50%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  container: {
    position: 'relative',
    zIndex: 1,
    maxWidth: '680px',
    margin: '0 auto',
    padding: '4rem 1.5rem 2rem',
  },
  header: { textAlign: 'center', marginBottom: '3rem' },
  badgeRow: { marginBottom: '1rem' },
  badge: {
    background: 'linear-gradient(135deg, #c9a96e22, #c9a96e44)',
    border: '1px solid #c9a96e55',
    color: '#c9a96e',
    fontSize: '0.65rem',
    letterSpacing: '0.25em',
    padding: '0.35rem 1rem',
    borderRadius: '2px',
  },
  title: {
    fontSize: 'clamp(2rem, 5vw, 3.2rem)',
    fontWeight: 400,
    color: '#f0e8d8',
    letterSpacing: '-0.02em',
    margin: '0.75rem 0 0.5rem',
    lineHeight: 1.1,
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#666',
    letterSpacing: '0.02em',
    fontFamily: "'Inter', sans-serif",
  },
  form: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '4px',
    padding: '2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    marginBottom: '1.5rem',
  },
  inputGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: {
    fontSize: '0.7rem',
    letterSpacing: '0.15em',
    color: '#888',
    textTransform: 'uppercase',
    fontFamily: "'Inter', sans-serif",
  },
  input: {
    background: '#0d0d0d',
    border: '1px solid #2a2a2a',
    borderRadius: '3px',
    color: '#e0d9cc',
    fontSize: '1rem',
    padding: '0.75rem 1rem',
    outline: 'none',
    fontFamily: "'Inter', sans-serif",
    transition: 'border-color 0.2s',
  },
  btn: {
    background: 'linear-gradient(135deg, #c9a96e, #a07848)',
    color: '#0a0a0a',
    border: 'none',
    borderRadius: '3px',
    fontSize: '0.8rem',
    letterSpacing: '0.12em',
    fontWeight: 700,
    padding: '0.85rem 2rem',
    cursor: 'pointer',
    textTransform: 'uppercase',
    fontFamily: "'Inter', sans-serif",
    marginTop: '0.25rem',
  },
  spinner: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
    fontSize: '1.2rem',
  },
  errorBox: {
    background: '#1a0f0f',
    border: '1px solid #3a1a1a',
    borderRadius: '3px',
    padding: '1rem 1.25rem',
    color: '#cc7777',
    fontSize: '0.9rem',
    fontFamily: "'Inter', sans-serif",
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  emptyState: {
    textAlign: 'center',
    color: '#444',
    padding: '2rem',
    fontFamily: "'Inter', sans-serif",
  },
  card: {
    background: '#111',
    border: '1px solid #222',
    borderRadius: '4px',
    padding: '2rem',
    marginTop: '1.5rem',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  orderNumLabel: {
    fontSize: '0.65rem',
    letterSpacing: '0.2em',
    color: '#555',
    fontFamily: "'Inter', sans-serif",
  },
  orderNum: {
    fontSize: '1.4rem',
    color: '#f0e8d8',
    letterSpacing: '0.05em',
    fontWeight: 500,
  },
  statusPill: {
    background: '#c9a96e22',
    border: '1px solid #c9a96e44',
    color: '#c9a96e',
    fontSize: '0.75rem',
    letterSpacing: '0.08em',
    padding: '0.4rem 1rem',
    borderRadius: '2px',
    fontFamily: "'Inter', sans-serif",
  },
  progressWrap: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '2rem',
    overflowX: 'auto',
    paddingBottom: '0.5rem',
  },
  stageItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.5rem',
    flex: 1,
    minWidth: '60px',
  },
  connector: {
    position: 'absolute',
    top: '50%',
    right: '100%',
    width: '100%',
    height: '2px',
    transform: 'translateY(-50%)',
  },
  dot: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s',
    position: 'relative',
    zIndex: 1,
  },
  stageLabel: {
    fontSize: '0.62rem',
    textAlign: 'center',
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1.3,
  },
  messageBox: {
    background: '#0d0d0d',
    border: '1px solid #1e1e1e',
    borderLeft: '3px solid #c9a96e',
    borderRadius: '0 3px 3px 0',
    padding: '0.75rem 1rem',
    fontSize: '0.9rem',
    color: '#ccc',
    marginBottom: '1.5rem',
    fontFamily: "'Inter', sans-serif",
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.5rem',
  },
  detailsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0',
    borderTop: '1px solid #1e1e1e',
    marginBottom: '1.5rem',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 0',
    borderBottom: '1px solid #1a1a1a',
  },
  detailLabel: {
    fontSize: '0.7rem',
    letterSpacing: '0.1em',
    color: '#555',
    textTransform: 'uppercase',
    fontFamily: "'Inter', sans-serif",
  },
  detailValue: {
    fontSize: '0.9rem',
    textAlign: 'right',
    maxWidth: '60%',
    fontFamily: "'Inter', sans-serif",
  },
  imgWrap: {
    marginTop: '1rem',
    borderRadius: '3px',
    overflow: 'hidden',
    border: '1px solid #222',
    height: '200px',
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
};
