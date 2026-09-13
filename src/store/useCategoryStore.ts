/**
 * Store des Catégories & Univers — Maison Kenzi
 *
 * Gère les catégories synchronisées avec la table maisonkenzi.categories de Supabase.
 * Initialisé à vide si la base de données est vierge.
 */

import { useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";
import { normalizeImageUrl } from "@/lib/productImages";

export type AdminCategory = {
  id: string;
  slug: string;
  name: string;
  name_en?: string;
  description: string;
  description_en?: string;
  image?: string;
  icon?: string;
  images?: string[];
  gender?: string;
  is_active: boolean;
  is_coming_soon?: boolean;
  order_index: number;
};

const DEFAULT_CATEGORIES: AdminCategory[] = [];

const STORAGE_KEY = "maisonkenzi_categories";
const CHANNEL_NAME = "maisonkenzi_categories_channel";

// Extraction et normalisation sécurisée d'un tableau d'images
const parseImages = (raw: any): string[] => {
  let list: string[] = [];
  if (Array.isArray(raw)) list = raw.filter((s) => typeof s === "string" && s.trim());
  else if (typeof raw === "string" && raw.trim()) {
    if (raw.startsWith("[") && raw.endsWith("]")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) list = parsed.filter((s) => typeof s === "string" && s.trim());
      } catch {}
    } else if (raw.includes(",")) {
      list = raw.split(",").map((s) => s.trim()).filter(Boolean);
    } else {
      list = [raw.trim()];
    }
  }
  return list.map((img) => normalizeImageUrl(img));
};

// Génération sécurisée d'un identifiant unique (UUID ou horodatage)
const generateId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return `cat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const load = (): AdminCategory[] => {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    localStorage.removeItem("tabat_admin_categories");
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((cat: any, index: number) => {
          const imgs = parseImages(cat.images || cat.banner_images || cat.image || cat.icon);
          const primaryImage = imgs[0] || cat.image || cat.icon || "";
          return {
            ...cat,
            id: cat.id || cat.slug || `cat_${index}_${Date.now()}`,
            name_en: cat.name_en || "",
            description_en: cat.description_en || "",
            image: primaryImage,
            icon: primaryImage,
            images: imgs.length > 0 ? imgs : primaryImage ? [primaryImage] : [],
            is_active: cat.is_active ?? true,
            is_coming_soon: !!cat.is_coming_soon,
            order_index: cat.order_index ?? index,
          };
        });
      }
    }
  } catch {}
  return DEFAULT_CATEGORIES;
};

let state: AdminCategory[] = load();
const listeners = new Set<() => void>();

// Fonction de rechargement depuis Supabase
export const fetchCategoriesFromSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (!error && Array.isArray(data)) {
      state = data.map((c: any, index: number) => {
        const imgs = parseImages(c.images || c.banner_images || c.image || c.icon);
        const primaryImage = imgs[0] || c.image || c.icon || "";
        return {
          id: c.id || c.slug || `cat_${index}`,
          slug: c.slug,
          name: c.name,
          name_en: c.name_en || "",
          description: c.description || "",
          description_en: c.description_en || "",
          image: primaryImage,
          icon: primaryImage,
          images: imgs.length > 0 ? imgs : primaryImage ? [primaryImage] : [],
          gender: c.gender,
          is_active: c.is_active ?? true,
          is_coming_soon: !!c.is_coming_soon,
          order_index: c.sort_order ?? index,
        };
      });
      notify();
    }
  } catch {}
};

// Synchronisation initiale avec la table Supabase categories
if (typeof window !== "undefined") {
  fetchCategoriesFromSupabase();
}

// Canal de diffusion temps réel inter-onglets
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === "UPDATE_CATEGORIES") {
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          state = raw ? JSON.parse(raw) : DEFAULT_CATEGORIES;
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
        state = JSON.parse(e.newValue);
        listeners.forEach((l) => l());
      } catch {}
    }
  });
}

// Souscription Supabase Realtime pour synchroniser instantanément toute modification distante
if (typeof window !== "undefined") {
  try {
    supabase
      .channel("maisonkenzi_categories_realtime_store")
      .on(
        "postgres_changes",
        { event: "*", schema: "maisonkenzi", table: "categories" },
        () => {
          fetchCategoriesFromSupabase();
        }
      )
      .subscribe();
  } catch {}
}

const notify = () => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      broadcastChannel?.postMessage({ type: "UPDATE_CATEGORIES" });
      window.dispatchEvent(new CustomEvent("maisonkenzi_categories_updated", { detail: state }));
    } catch {}
  }
  listeners.forEach((l) => l());
};

export const getCategories = (): AdminCategory[] => state;

export const setCategories = (cats: AdminCategory[]) => {
  state = cats;
  notify();
};

export const addCategory = async (
  cat: Omit<AdminCategory, "id"> & { id?: string }
): Promise<{ success: boolean; error?: any; category: AdminCategory }> => {
  const id = cat.id?.trim() ? cat.id : generateId();
  const imgs = parseImages(cat.images || cat.image || cat.icon);
  const primaryImage = imgs[0] || cat.image || cat.icon || "";
  const fullCat: AdminCategory = {
    id,
    name: cat.name.trim(),
    name_en: cat.name_en ? cat.name_en.trim() : "",
    slug: cat.slug.trim(),
    description: cat.description ? cat.description.trim() : "",
    description_en: cat.description_en ? cat.description_en.trim() : "",
    image: primaryImage,
    icon: primaryImage,
    images: imgs.length > 0 ? imgs : primaryImage ? [primaryImage] : [],
    gender: cat.gender,
    is_active: cat.is_active ?? true,
    is_coming_soon: !!cat.is_coming_soon,
    order_index: cat.order_index ?? state.length + 1,
  };

  // Mise à jour optimiste locale
  state = [...state.filter((c) => c.id !== id), fullCat];
  notify();

  // Persistance dans la base de données Supabase
  try {
    const payload: any = {
      id: fullCat.id,
      name: fullCat.name,
      name_en: fullCat.name_en || null,
      slug: fullCat.slug,
      description: fullCat.description,
      description_en: fullCat.description_en || null,
      icon: fullCat.images && fullCat.images.length > 0 ? JSON.stringify(fullCat.images) : (fullCat.image || null),
      is_active: fullCat.is_active,
      is_coming_soon: fullCat.is_coming_soon,
      sort_order: fullCat.order_index,
    };

    const { error } = await supabase.from("categories").upsert(payload as never);

    if (error) {
      console.warn("Tentative sans colonne optionnelle pour compatibilité:", error.message);
      const { name_en: _ne, description_en: _de, is_coming_soon: _ics, ...fallbackPayload } = payload;
      const { error: err2 } = await supabase.from("categories").upsert(fallbackPayload as never);
      if (err2) {
        console.error("Erreur lors de l'enregistrement de la catégorie dans Supabase :", err2);
        return { success: false, error: err2, category: fullCat };
      }
    }
    return { success: true, category: fullCat };
  } catch (err) {
    console.error("Exception lors de l'enregistrement de la catégorie :", err);
    return { success: false, error: err, category: fullCat };
  }
};

export const updateCategory = async (
  id: string,
  partial: Partial<AdminCategory>
): Promise<{ success: boolean; error?: any }> => {
  state = state.map((c) => {
    if (c.id === id) {
      const imgs = partial.images !== undefined ? parseImages(partial.images) : c.images;
      const primaryImage = (imgs && imgs[0]) || partial.image || partial.icon || c.image || "";
      return {
        ...c,
        ...partial,
        image: primaryImage,
        icon: primaryImage,
        images: imgs && imgs.length > 0 ? imgs : (primaryImage ? [primaryImage] : []),
      };
    }
    return c;
  });
  notify();

  // Persistance dans Supabase
  try {
    const updated = state.find((c) => c.id === id);
    if (updated) {
      const payload: any = {
        id: updated.id,
        name: updated.name,
        name_en: updated.name_en || null,
        slug: updated.slug,
        description: updated.description,
        description_en: updated.description_en || null,
        icon: updated.images && updated.images.length > 0 ? JSON.stringify(updated.images) : (updated.image || null),
        is_active: updated.is_active,
        is_coming_soon: !!updated.is_coming_soon,
        sort_order: updated.order_index,
      };

      const { error } = await supabase.from("categories").upsert(payload as never);

      if (error) {
        console.warn("Tentative mise à jour sans colonnes optionnelles:", error.message);
        const { name_en: _ne, description_en: _de, is_coming_soon: _ics, ...fallbackPayload } = payload;
        const { error: err2 } = await supabase.from("categories").upsert(fallbackPayload as never);
        if (err2) {
          console.error("Erreur lors de la mise à jour de la catégorie dans Supabase :", err2);
          return { success: false, error: err2 };
        }
      }
    }
    return { success: true };
  } catch (err) {
    console.error("Exception lors de la mise à jour de la catégorie :", err);
    return { success: false, error: err };
  }
};

export const deleteCategory = async (
  id: string
): Promise<{ success: boolean; error?: any }> => {
  state = state.filter((c) => c.id !== id);
  notify();

  // Suppression dans Supabase
  try {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) {
      console.error("Erreur lors de la suppression de la catégorie dans Supabase :", error);
      return { success: false, error };
    }
    return { success: true };
  } catch (err) {
    console.error("Exception lors de la suppression de la catégorie :", err);
    return { success: false, error: err };
  }
};

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useCategories = (): AdminCategory[] => {
  return useSyncExternalStore(subscribe, getCategories, () => DEFAULT_CATEGORIES);
};

