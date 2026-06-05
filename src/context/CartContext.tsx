import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { Product } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CartLine {
  id: string | number;
  slug: string;
  name: string;
  series: string;
  price: number;
  image: string;
  quantity: number;
  /** Snapshot of inStock at time of add — updated by realtime watcher */
  inStock?: boolean;
  /** Live stock value — updated by realtime watcher + refreshStock */
  stock?: number;
}

interface CartContextValue {
  items: CartLine[];
  count: number;
  subtotal: number;
  /** Returns false if nothing (or less than requested) was added */
  add: (product: Product, qty?: number) => boolean;
  remove: (id: string | number) => void;
  setQty: (id: string | number, qty: number) => void;
  clear: () => void;
  hasOutOfStockItems: boolean;
  /** Re-sync each line's stock from DB; auto-removes OOS, caps over-stock */
  refreshStock: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "mythicalvault.cart.v1";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartLine[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as CartLine[]) : [];
    } catch {
      return [];
    }
  });

  // Keep a ref of current items so callbacks don't need to depend on `items`
  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  // Realtime watcher: sync stock + auto-cap quantity when DB changes
  useEffect(() => {
    const channel = supabase
      .channel("cart-stock-watcher")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products" },
        (payload) => {
          const u = payload.new as { id: string; in_stock: boolean; stock: number };
          setItems((prev) => {
            const idx = prev.findIndex((l) => String(l.id) === String(u.id));
            if (idx === -1) return prev;
            const line = prev[idx];

            // Out of stock → remove
            if (!u.in_stock || u.stock <= 0) {
              toast.warning(
                `"${line.name}" is out of stock and has been removed from your bag.`
              );
              return prev.filter((l) => String(l.id) !== String(u.id));
            }

            // Cap quantity at live stock
            const cappedQty = Math.min(line.quantity, u.stock);
            if (cappedQty < line.quantity) {
              toast.info(
                `"${line.name}" quantity reduced to ${cappedQty} (only ${u.stock} left in stock).`
              );
            }
            return prev.map((l, i) =>
              i === idx
                ? { ...l, inStock: true, stock: u.stock, quantity: cappedQty }
                : l
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Re-fetch stock from DB for every cart line — call on mount + at checkout
  const refreshStock = useCallback(async () => {
    const current = itemsRef.current;
    if (current.length === 0) return;
    const ids = current.map((i) => String(i.id));
    const { data, error } = await supabase
      .from("products")
      .select("id, stock, in_stock")
      .in("id", ids);
    if (error || !data) return;

    setItems((prev) =>
      prev.flatMap((l) => {
        const row = data.find((r) => String(r.id) === String(l.id));
        // Product was deleted — drop it
        if (!row) {
          toast.warning(`"${l.name}" is no longer available and was removed.`);
          return [];
        }
        if (!row.in_stock || row.stock <= 0) {
          toast.warning(`"${l.name}" is out of stock and was removed from your bag.`);
          return [];
        }
        const capped = Math.min(l.quantity, row.stock);
        if (capped < l.quantity) {
          toast.info(
            `"${l.name}" quantity reduced to ${capped} (only ${row.stock} left).`
          );
        }
        return [{ ...l, stock: row.stock, inStock: true, quantity: capped }];
      })
    );
  }, []);

  // Run once on mount so stale localStorage carts are reconciled
  useEffect(() => {
    refreshStock();
  }, [refreshStock]);

  const add = useCallback((product: Product, qty = 1): boolean => {
    // Block adding OOS items
    if (product.inStock === false || (product.stock ?? 0) <= 0) {
      toast.error(`"${product.name}" is out of stock`);
      return false;
    }

    const max = product.stock ?? Infinity;
    let fullyAdded = true;

    setItems((prev) => {
      const existing = prev.find((l) => l.id === product.id);
      const currentQty = existing?.quantity ?? 0;
      const desired = currentQty + qty;

      if (desired > max) {
        fullyAdded = false;
        toast.warning(
          `Only ${max} in stock. Cart updated to the maximum available.`
        );
      }

      const finalQty = Math.min(desired, max);

      if (existing) {
        return prev.map((l) =>
          l.id === product.id
            ? { ...l, quantity: finalQty, stock: max, inStock: true }
            : l
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          slug: product.slug,
          name: product.name,
          series: product.series,
          price: product.price,
          image: product.image,
          quantity: finalQty,
          inStock: true,
          stock: product.stock,
        },
      ];
    });

    return fullyAdded;
  }, []);

  const remove = useCallback((id: string | number) => {
    setItems((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const setQty = useCallback((id: string | number, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((l) => l.id !== id);
      return prev.map((l) => {
        if (l.id !== id) return l;
        const max = l.stock ?? Infinity;
        if (qty > max) {
          toast.warning(`Only ${max} in stock.`);
          return { ...l, quantity: max };
        }
        return { ...l, quantity: qty };
      });
    });
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const hasOutOfStockItems = items.some(
      (i) => i.inStock === false || (i.stock != null && i.stock <= 0)
    );
    return {
      items,
      count,
      subtotal,
      add,
      remove,
      setQty,
      clear,
      hasOutOfStockItems,
      refreshStock,
    };
  }, [items, add, remove, setQty, clear, refreshStock]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
