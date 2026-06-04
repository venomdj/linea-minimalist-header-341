import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
}

interface CartContextValue {
  items: CartLine[];
  count: number;
  subtotal: number;
  add: (product: Product, qty?: number) => void;
  remove: (id: string | number) => void;
  setQty: (id: string | number, qty: number) => void;
  clear: () => void;
  hasOutOfStockItems: boolean;
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

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  // Realtime watcher: if a product in the cart goes OOS, flag it + toast
  useEffect(() => {
    const channel = supabase
      .channel("cart-stock-watcher")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "products" },
        (payload) => {
          const updated = payload.new as { id: string; in_stock: boolean; stock: number };
          setItems((prev) => {
            const idx = prev.findIndex((l) => String(l.id) === String(updated.id));
            if (idx === -1) return prev;

            if (!updated.in_stock) {
              // Flag as OOS (don't auto-remove — let user see the warning at checkout)
              const name = prev[idx].name;
              toast.warning(`"${name}" just went out of stock and has been removed from your bag.`);
              // Remove from cart
              return prev.filter((l) => String(l.id) !== String(updated.id));
            }
            // Back in stock — update flag
            return prev.map((l, i) =>
              i === idx ? { ...l, inStock: updated.in_stock } : l
            );
          });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const add = useCallback((product: Product, qty = 1) => {
    // Block adding OOS items
    if (product.inStock === false) {
      toast.error(`"${product.name}" is out of stock`);
      return;
    }
    setItems((prev) => {
      const existing = prev.find((l) => l.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.id === product.id ? { ...l, quantity: l.quantity + qty } : l
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
          quantity: qty,
          inStock: product.inStock ?? true,
        },
      ];
    });
  }, []);

  const remove = useCallback((id: string | number) => {
    setItems((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const setQty = useCallback((id: string | number, qty: number) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((l) => l.id !== id)
        : prev.map((l) => (l.id === id ? { ...l, quantity: qty } : l))
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const hasOutOfStockItems = items.some((i) => i.inStock === false);
    return { items, count, subtotal, add, remove, setQty, clear, hasOutOfStockItems };
  }, [items, add, remove, setQty, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
