/**
 * Store Local des Produits — Maison Kenzi
 *
 * Gère l'état réactif local des produits en synchronisation avec Supabase.
 */

import { useSyncExternalStore } from "react";
import type { Parfum } from "@/data/parfums";
import { supabase } from "@/lib/supabase";

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

const withDefaults = (p: AdminParfum): AdminParfum => {
  const cats = Array.isArray(p.categories) && p.categories.length > 0
    ? p.categories
    : p.category
    ? [p.category]
    : [];

  return {
    ...p,
    name_en: p.name_en || "",
    description_en: p.description_en || "",
    notes_en: p.notes_en || "",
    image_label_en: p.image_label_en || "",
    active: p.active ?? true,
    categories: cats,
    category: p.category || cats[0] || "",
    stock_5ml: p.stock_5ml ?? 20,
    stock_10ml: p.stock_10ml ?? 20,
    stock: p.stock ?? 20,
    sale_mode: p.sale_mode ?? "decant",
    seasons: p.seasons ?? [],
    images: Array.isArray(p.images) ? p.images : p.image_url ? [p.image_url] : [],
    full_bottle_volume_ml: p.full_bottle_volume_ml ?? null,
    full_bottle_price: p.full_bottle_price ?? null,
    full_bottle_stock: p.full_bottle_stock ?? 0,
    full_bottle_limited: p.full_bottle_limited ?? false,
  };
};

const load = (): AdminParfum[] => {
  if (typeof window === "undefined") return [];
  try {
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

// Écouteur des changements de localStorage entre onglets
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        state = (JSON.parse(e.newValue) as AdminParfum[]).map(withDefaults);
        listeners.forEach((l) => l());
      } catch {}
    }
  });
}

const notify = () => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      broadcastChannel?.postMessage({ type: "UPDATE_PRODUCTS" });
      window.dispatchEvent(new CustomEvent("maisonkenzi_products_updated", { detail: state }));
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
  state = [withDefaults(product), ...state.filter((p) => p.id !== product.id)];
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

// Souscription Supabase Realtime pour synchroniser instantanément toute modification distante
if (typeof window !== "undefined") {
  try {
    supabase
      .channel("maisonkenzi_parfums_realtime_store")
      .on(
        "postgres_changes",
        { event: "*", schema: "maisonkenzi", table: "parfums" },
        async () => {
          try {
            const { data, error } = await supabase
              .from("parfums")
              .select("*")
              .order("created_at", { ascending: false });

            if (!error && Array.isArray(data)) {
              const currentLocal = getProducts();
              const mapped: AdminParfum[] = data.map((r: any) => {
                const localMatch = currentLocal.find((lp) => lp.id === r.id);
                return {
                  id: r.id,
                  name: r.name,
                  maison: r.maison,
                  gender: r.gender,
                  category: r.category ?? localMatch?.category,
                  categories: Array.isArray(r.categories) ? r.categories : (r.category ? [r.category] : []),
                  seasons: Array.isArray(r.seasons) ? r.seasons : (localMatch?.seasons ?? []),
                  description: r.description || "",
                  notes: {
                    tete: r.notes_tete ?? localMatch?.notes?.tete ?? [],
                    coeur: r.notes_coeur ?? localMatch?.notes?.coeur ?? [],
                    fond: r.notes_fond ?? localMatch?.notes?.fond ?? [],
                  },
                  prices: {
                    "5ml": Number(r.price_5ml ?? localMatch?.prices?.["5ml"] ?? 0),
                    "10ml": Number(r.price_10ml ?? localMatch?.prices?.["10ml"] ?? 0),
                  },
                  imageLabel: r.image_label || localMatch?.imageLabel || r.id,
                  image_url: r.image_url ?? localMatch?.image_url ?? null,
                  images: Array.isArray(r.images) && r.images.length > 0 ? r.images : (r.image_url ? [r.image_url] : (localMatch?.images ?? [])),
                  isNew: !!r.is_new,
                  isBestseller: !!r.is_bestseller,
                  sale_mode: r.sale_mode ?? localMatch?.sale_mode ?? "decant",
                  full_bottle_price: r.full_bottle_price ? Number(r.full_bottle_price) : localMatch?.full_bottle_price ?? null,
                  full_bottle_volume_ml: r.full_bottle_volume_ml ? Number(r.full_bottle_volume_ml) : localMatch?.full_bottle_volume_ml ?? null,
                  full_bottle_stock: Number(r.full_bottle_stock ?? localMatch?.full_bottle_stock ?? 0),
                  full_bottle_limited: !!r.full_bottle_limited,
                  stock_5ml: Number(r.stock_5ml ?? localMatch?.stock_5ml ?? 0),
                  stock_10ml: Number(r.stock_10ml ?? localMatch?.stock_10ml ?? 0),
                  active: r.is_active ?? localMatch?.active ?? true,
                };
              });
              setProducts(mapped);
            }
          } catch {}
        }
      )
      .subscribe();
  } catch {}
}
