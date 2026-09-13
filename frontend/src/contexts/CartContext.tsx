import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { fetchCart } from "../services/payments";
import { useAuth } from "./AuthContext";

interface CartContextValue {
  count: number;
  total: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [total, setTotal] = useState(0);

  const refreshCart = useCallback(async () => {
    if (!user) {
      setCount(0);
      setTotal(0);
      return;
    }
    try {
      const { items, total } = await fetchCart();
      setCount(items.length);
      setTotal(total);
    } catch {
      // ignore
    }
  }, [user]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return <CartContext.Provider value={{ count, total, refreshCart }}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
