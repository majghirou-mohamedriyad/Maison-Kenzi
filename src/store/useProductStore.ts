/**
 * Store Local des Produits — Maison Kenzi
 *
 * Gère l'état réactif local des produits en synchronisation avec Supabase.
 */

import { useSyncExternalStore } from "react";
import type { Parfum, ProductTier, ProductCustomOption } from "@/data/parfums";
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
  has_tiers?: boolean;
  quantity_tiers?: ProductTier[];
  has_custom_options?: boolean;
  custom_options?: ProductCustomOption[];
  weight_value?: string;
  weight_unit?: "mg" | "g" | "kg" | string;
  volume_value?: string;
  volume_unit?: "ml" | "L";
};

export type AdminParfum = Parfum & ExtraMeta;

const withDefaults = (p: AdminParfum): AdminParfum => {
  const cats = Array.isArray(p.categories) && p.categories.length > 0
    ? p.categories
    : p.category
    ? [p.category]
    : [];

  const rawImages = Array.isArray(p.images) && p.images.length > 0
    ? p.images
    : p.image_url
    ? [p.image_url]
    : [];

  let parsedTiers: ProductTier[] = [];
  if (Array.isArray(p.quantity_tiers)) {
    parsedTiers = p.quantity_tiers;
  } else if (typeof (p as any).quantity_tiers === "string") {
    try {
      const parsed = JSON.parse((p as any).quantity_tiers);
      if (Array.isArray(parsed)) parsedTiers = parsed;
    } catch {}
  }

  let parsedCustomOptions: ProductCustomOption[] = [];
  if (Array.isArray(p.custom_options)) {
    parsedCustomOptions = p.custom_options;
  } else if (typeof (p as any).custom_options === "string") {
    try {
      const parsed = JSON.parse((p as any).custom_options);
      if (Array.isArray(parsed)) parsedCustomOptions = parsed;
    } catch {}
  }

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
    images: rawImages,
    image_url: rawImages[0] || p.image_url || null,
    full_bottle_volume_ml: p.full_bottle_volume_ml ?? null,
    full_bottle_price: p.full_bottle_price ?? null,
    full_bottle_stock: p.full_bottle_stock ?? 0,
    full_bottle_limited: p.full_bottle_limited ?? false,
    has_tiers: p.has_tiers ?? (parsedTiers.length > 0),
    quantity_tiers: parsedTiers,
    has_custom_options: p.has_custom_options ?? (parsedCustomOptions.length > 0),
    custom_options: parsedCustomOptions,
    weight_value: p.weight_value,
    weight_unit: p.weight_unit || "g",
    volume_value: p.volume_value,
    volume_unit: p.volume_unit || "ml",
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
                const rawLabel = typeof r.image_label === "string" ? r.image_label.trim() : "";
                const isJsonLabel = rawLabel.startsWith("[") && rawLabel.endsWith("]");
                let extractedImagesFromLabel: string[] = [];
                if (isJsonLabel) {
                  try {
                    const parsed = JSON.parse(rawLabel);
                    if (Array.isArray(parsed)) extractedImagesFromLabel = parsed.filter(Boolean);
                  } catch {}
                }

                const remoteImages = Array.isArray(r.images) && r.images.length > 0
                  ? r.images
                  : (extractedImagesFromLabel.length > 0
                    ? extractedImagesFromLabel
                    : (r.image_url ? [r.image_url] : []));

                const finalImages = remoteImages.length > 0 ? remoteImages : (localMatch?.images ?? []);

                const cleanImageLabel = !isJsonLabel && rawLabel
                  ? rawLabel
                  : (localMatch?.imageLabel && !localMatch.imageLabel.startsWith("[") ? localMatch.imageLabel : "");

                return {
                  id: r.id,
                  name: r.name,
                  name_en: r.name_en || localMatch?.name_en || "",
                  maison: r.maison,
                  gender: r.gender,
                  category: r.category ?? localMatch?.category,
                  categories: Array.isArray(r.categories) ? r.categories : (r.category ? [r.category] : []),
                  seasons: Array.isArray(r.seasons) ? r.seasons : (localMatch?.seasons ?? []),
                  description: r.description || "",
                  description_en: r.description_en || localMatch?.description_en || "",
                  notes_en: r.notes_en || localMatch?.notes_en || "",
                  image_label_en: r.image_label_en || localMatch?.image_label_en || "",
                  notes: {
                    tete: r.notes_tete ?? localMatch?.notes?.tete ?? [],
                    coeur: r.notes_coeur ?? localMatch?.notes?.coeur ?? [],
                    fond: r.notes_fond ?? localMatch?.notes?.fond ?? [],
                  },
                  prices: {
                    "5ml": Number(r.price_5ml ?? localMatch?.prices?.["5ml"] ?? 0),
                    "10ml": Number(r.price_10ml ?? localMatch?.prices?.["10ml"] ?? 0),
                  },
                  imageLabel: cleanImageLabel,
                  image_url: finalImages[0] || r.image_url || localMatch?.image_url || null,
                  images: finalImages,
                  isNew: !!r.is_new,
                  isBestseller: !!r.is_bestseller,
                  sale_mode: r.sale_mode ?? localMatch?.sale_mode ?? "decant",
                  full_bottle_price: r.full_bottle_price ? Number(r.full_bottle_price) : localMatch?.full_bottle_price ?? null,
                  full_bottle_volume_ml: r.full_bottle_volume_ml ? Number(r.full_bottle_volume_ml) : localMatch?.full_bottle_volume_ml ?? null,
                  full_bottle_stock: Number(r.full_bottle_stock ?? localMatch?.full_bottle_stock ?? 0),
                  full_bottle_limited: !!r.full_bottle_limited,
                  has_tiers: r.has_tiers ?? localMatch?.has_tiers ?? false,
                  quantity_tiers: Array.isArray(r.quantity_tiers) ? r.quantity_tiers : (typeof r.quantity_tiers === 'string' ? JSON.parse(r.quantity_tiers || '[]') : localMatch?.quantity_tiers ?? []),
                  stock_5ml: Number(r.stock_5ml ?? localMatch?.stock_5ml ?? 0),
                  stock_10ml: Number(r.stock_10ml ?? localMatch?.stock_10ml ?? 0),
                  active: r.is_active ?? localMatch?.active ?? true,
                  weight_value: r.weight_value || localMatch?.weight_value,
                  weight_unit: r.weight_unit || localMatch?.weight_unit || "g",
                  volume_value: r.volume_value || localMatch?.volume_value,
                  volume_unit: r.volume_unit || localMatch?.volume_unit || "ml",
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
