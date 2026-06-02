// src/hooks/useOrders.ts
// Admin hook — full CRUD on the orders table.
// Uses the standard Supabase client (anon key) — see migration notes
// about using service_role key for production admin security.

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase'; // adjust path to your supabase client
import type { Order, OrderInsert, OrderUpdate } from '../types/order';

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
      setOrders(data ?? []);
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
        .insert([order])
        .select()
        .single();
      if (err) throw err;
      setOrders(prev => [data, ...prev]);
      return data;
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
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (err) throw err;
      setOrders(prev => prev.map(o => (o.id === id ? data : o)));
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

// Customer lookup — matches order_number + email (no auth required)
export async function lookupOrder(orderNumber: string, email: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber.trim().toUpperCase())
    .eq('customer_email', email.trim().toLowerCase())
    .maybeSingle();

  if (error || !data) return null;
  return data;
}
