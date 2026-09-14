/**
 * Store de Gestion du Panier — Maison Kenzi
 *
 * Gère l'état global du panier, la persistance dans le localStorage (mk_cart_items),
 * le calcul des totaux et l'état d'ouverture/fermeture du tiroir de commande.
 */

import { createContext, useContext, useMemo, useState, useEffect, ReactNode } from "react";
import type { Size } from "@/types/database";

export interface CartItem {
  id: string;          // parfum id (uuid)
  name: string;
  name_en?: string;
  maison: string;
  size: Size;
  quantity: number;
  price: number;       // unit price in MAD for this size
  imageLabel: string;
  imageLabel_en?: string;
  imageUrl?: string | null;
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  updateQuantity: (id: string, size: Size, qty: number) => void;
  removeItem: (id: string, size: Size) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_STORAGE_KEY = "mk_cart_items";

const key = (id: string, size: Size) => `${id}__${size}`;

const getInitialCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item) => item && item.id && item.quantity > 0 && typeof item.price === "number");
      }
    }
  } catch (err) {
    console.warn("Erreur lors de la récupération du panier local :", err);
  }
  return [];
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(getInitialCart);
  const [isOpen, setIsOpen] = useState(false);

  // Sauvegarde automatique du panier dans le localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn("Erreur lors de la sauvegarde du panier :", err);
    }
  }, [items]);

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);
  const toggleCart = () => setIsOpen((prev) => !prev);

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

  const clear = () => {
    setItems([]);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {}
  };

  const value = useMemo<CartContextValue>(() => {
    const totalItems = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return {
      items,
      totalItems,
      subtotal,
      isOpen,
      setIsOpen,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      updateQuantity,
      removeItem,
      clear,
    };
  }, [items, isOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
