// src/hooks/useOrders.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Order, OrderInsert, OrderUpdate } from '@/types/order';

// ─── Admin hook — full CRUD + realtime ────────────────────────────────────────
export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllOrders = useCallback(async (search = '') => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (search.trim()) {
        query = query.or(
          `order_number.ilike.%${search}%,customer_name.ilike.%${search}%,customer_email.ilike.%${search}%`
        );
      }

      const { data, error: err } = await query;
      if (err) throw err;
      setOrders((data ?? []) as Order[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  const createOrder = useCallback(async (order: OrderInsert): Promise<Order | null> => {
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('orders')
        .insert([order as never])
        .select()
        .single();
      if (err) throw err;
      setOrders(prev => [data as Order, ...prev]);
      return data as Order;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create order');
      return null;
    }
  }, []);

  const updateOrder = useCallback(async (id: string, updates: OrderUpdate): Promise<boolean> => {
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('orders')
        .update(updates as never)
        .eq('id', id)
        .select()
        .single();
      if (err) throw err;
      setOrders(prev => prev.map(o => (o.id === id ? (data as Order) : o)));
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update order');
      return false;
    }
  }, []);

  const deleteOrder = useCallback(async (id: string): Promise<boolean> => {
    setError(null);
    try {
      const { error: err } = await supabase.from('orders').delete().eq('id', id);
      if (err) throw err;
      setOrders(prev => prev.filter(o => o.id !== id));
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete order');
      return false;
    }
  }, []);

  return { orders, loading, error, fetchAllOrders, createOrder, updateOrder, deleteOrder };
}

// ─── User-scoped hook — my orders with realtime subscription ─────────────────
export function useMyOrders(userId: string | null) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!userId) { setOrders([]); return; }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (err) throw err;
      setOrders((data ?? []) as Order[]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Realtime subscription — updates My Orders page live when admin changes status
  useEffect(() => {
    if (!userId) return;
    fetchOrders();

    const channel = supabase
      .channel(`user-orders-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setOrders(prev => [payload.new as Order, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new as Order : o));
          } else if (payload.eventType === 'DELETE') {
            setOrders(prev => prev.filter(o => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
    return () => { channel.unsubscribe(); };
  }, [userId, fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}

// ─── Public lookup — for TrackOrder page (no auth) ───────────────────────────
export async function lookupOrder(orderNumber: string, email: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber.trim().toUpperCase())
    .eq('customer_email', email.trim().toLowerCase())
    .maybeSingle();

  if (error || !data) return null;
  return data as Order;
}
