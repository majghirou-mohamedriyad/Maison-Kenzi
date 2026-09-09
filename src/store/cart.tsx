import { createContext, useContext, useMemo, useState, ReactNode } from "react";
import type { Size } from "@/types/database";

export interface CartItem {
  id: string;          // parfum id (uuid)
  name: string;
  maison: string;
  size: Size;
  quantity: number;
  price: number;       // unit price in MAD for this size
  imageLabel: string;
  imageUrl?: string | null;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (id: string, size: Size, qty: number) => void;
  removeItem: (id: string, size: Size) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const key = (id: string, size: Size) => `${id}__${size}`;

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem: CartContextValue["addItem"] = (incoming) => {
    setItems((prev) => {
      const qty = incoming.quantity ?? 1;
      const existing = prev.find((i) => key(i.id, i.size) === key(incoming.id, incoming.size));
      if (existing) {
        return prev.map((i) =>
          key(i.id, i.size) === key(incoming.id, incoming.size)
            ? { ...i, quantity: i.quantity + qty }
            : i,
        );
      }
      return [...prev, { ...incoming, quantity: qty }];
    });
  };

  const updateQuantity: CartContextValue["updateQuantity"] = (id, size, qty) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((i) => key(i.id, i.size) !== key(id, size));
      return prev.map((i) => (key(i.id, i.size) === key(id, size) ? { ...i, quantity: qty } : i));
    });
  };

  const removeItem: CartContextValue["removeItem"] = (id, size) =>
    setItems((prev) => prev.filter((i) => key(i.id, i.size) !== key(id, size)));

  const clear = () => setItems([]);

  const value = useMemo<CartContextValue>(() => {
    const totalItems = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return { items, totalItems, subtotal, addItem, updateQuantity, removeItem, clear };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
