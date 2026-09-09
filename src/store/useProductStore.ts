import { useSyncExternalStore } from "react";
import { parfums as seed, type Parfum } from "@/data/parfums";

const STORAGE_KEY = "ne_products";
const CHANNEL_NAME = "tabat_realtime_channel";

export type SaleMode = "decant" | "full_bottle";

type ExtraMeta = {
  active?: boolean;
  stock?: number; // legacy: total bottles
  stock_5ml?: number;
  stock_10ml?: number;
  // Full bottle mode
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
  if (typeof window === "undefined") return seed.map((p) => withDefaults(p as AdminParfum));
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AdminParfum[];
      if (Array.isArray(parsed) && parsed.length) {
        // Fusionner les produits seed manquants (packs, déodorants) si non présents dans le localStorage
        const existingIds = new Set(parsed.map((p) => p.id));
        const missingSeed = seed.filter((s) => !existingIds.has(s.id));
        return [...parsed, ...missingSeed].map(withDefaults);
      }
    }
  } catch {}
  return seed.map((p) => withDefaults(p as AdminParfum));
};

let state: AdminParfum[] = load();
const listeners = new Set<() => void>();

// Set up Cross-Tab Broadcast Channel
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === "TABAT_PRODUCTS_SYNC") {
        state = load();
        listeners.forEach((l) => l());
        window.dispatchEvent(new Event("tabat_products_updated"));
      }
    };
  } catch (err) {
    console.warn("BroadcastChannel init note:", err);
  }
}

// Cross-tab storage event listener
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      state = load();
      listeners.forEach((l) => l());
      window.dispatchEvent(new Event("tabat_products_updated"));
    }
  });
}

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
};

const emit = () => {
  persist();
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("tabat_products_updated"));
  }
  // Broadcast to other tabs immediately
  try {
    broadcastChannel?.postMessage({
      type: "TABAT_PRODUCTS_SYNC",
      timestamp: Date.now(),
    });
  } catch {}
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const getSnapshot = () => state;

export const useProducts = (): AdminParfum[] =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

export const useProduct = (id?: string): AdminParfum | undefined => {
  const list = useProducts();
  return id ? list.find((p) => p.id === id) : undefined;
};

export const getProducts = () => state;

export const addProduct = (p: AdminParfum) => {
  state = [...state, p];
  emit();
};

export const updateProduct = (id: string, patch: Partial<AdminParfum>) => {
  state = state.map((p) => (p.id === id ? { ...p, ...patch } : p));
  emit();
};

export const deleteProduct = (id: string) => {
  state = state.filter((p) => p.id !== id);
  emit();
};

export const resetProducts = () => {
  state = seed.map((p) => withDefaults(p as AdminParfum));
  emit();
};
