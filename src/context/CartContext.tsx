import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { Product } from "@/data/products";

export interface CartLine {
  id: string | number;
  slug: string;
  name: string;
  series: string;
  price: number;
  image: string;
  quantity: number;
}

interface CartContextValue {
  items: CartLine[];
  count: number;
  subtotal: number;
  add: (product: Product, qty?: number) => void;
  remove: (id: string | number) => void;
  setQty: (id: string | number, qty: number) => void;
  clear: () => void;
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items]);

  const add = useCallback((product: Product, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((l) => l.id === product.id);
      if (existing) {
        return prev.map((l) => (l.id === product.id ? { ...l, quantity: l.quantity + qty } : l));
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
        },
      ];
    });
  }, []);

  const remove = useCallback((id: string | number) => {
    setItems((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const setQty = useCallback((id: string | number, qty: number) => {
    setItems((prev) =>
      qty <= 0 ? prev.filter((l) => l.id !== id) : prev.map((l) => (l.id === id ? { ...l, quantity: qty } : l))
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return { items, count, subtotal, add, remove, setQty, clear };
  }, [items, add, remove, setQty, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
