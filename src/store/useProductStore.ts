/**
 * Store Local des Produits — Maison Kenzi
 *
 * Gère l'état réactif local des produits en synchronisation avec Supabase.
 */

import { useSyncExternalStore } from "react";
import type { Parfum } from "@/data/parfums";

const STORAGE_KEY = "maisonkenzi_products";
const CHANNEL_NAME = "maisonkenzi_realtime_channel";

export type SaleMode = "decant" | "full_bottle";

type ExtraMeta = {
  active?: boolean;
  stock?: number;
  stock_5ml?: number;
  stock_10ml?: number;
  sale_mode?: SaleMode;
  full_bottle_volume_ml?: number | null;
  full_bottle_price?: number | null;
  full_bottle_stock?: number | null;
  full_bottle_limited?: boolean | null;
};

export type AdminParfum = Parfum & ExtraMeta;

const withDefaults = (p: AdminParfum): AdminParfum => ({
  ...p,
  active: p.active ?? true,
  stock_5ml: p.stock_5ml ?? 20,
  stock_10ml: p.stock_10ml ?? 20,
  stock: p.stock ?? 20,
  sale_mode: p.sale_mode ?? "decant",
  full_bottle_volume_ml: p.full_bottle_volume_ml ?? null,
  full_bottle_price: p.full_bottle_price ?? null,
  full_bottle_stock: p.full_bottle_stock ?? 0,
  full_bottle_limited: p.full_bottle_limited ?? false,
});

const load = (): AdminParfum[] => {
  if (typeof window === "undefined") return [];
  try {
    // Nettoyer l'ancienne clé legacy de démo
    localStorage.removeItem("ne_products");
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AdminParfum[];
      if (Array.isArray(parsed)) {
        return parsed.map(withDefaults);
      }
    }
  } catch {}
  return [];
};

let state: AdminParfum[] = load();
const listeners = new Set<() => void>();

// Canal de diffusion inter-onglets
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === "UPDATE_PRODUCTS") {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          state = raw ? (JSON.parse(raw) as AdminParfum[]).map(withDefaults) : [];
          listeners.forEach((l) => l());
        } catch {}
      }
    };
  } catch {}
}

const notify = () => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      broadcastChannel?.postMessage({ type: "UPDATE_PRODUCTS" });
    } catch {}
  }
  listeners.forEach((l) => l());
};

export const getProducts = (): AdminParfum[] => state;

export const setProducts = (products: AdminParfum[]) => {
  state = products.map(withDefaults);
  notify();
};

export const addProduct = (product: AdminParfum) => {
  state = [withDefaults(product), ...state];
  notify();
};

export const updateProduct = (id: string, partial: Partial<AdminParfum>) => {
  state = state.map((p) => (p.id === id ? withDefaults({ ...p, ...partial }) : p));
  notify();
};

export const deleteProduct = (id: string) => {
  state = state.filter((p) => p.id !== id);
  notify();
};

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useProducts = (): AdminParfum[] => {
  return useSyncExternalStore(subscribe, getProducts, () => []);
};
