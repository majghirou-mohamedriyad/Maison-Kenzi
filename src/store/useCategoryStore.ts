/**
 * Store des Catégories & Univers — Maison Kenzi
 *
 * Gère les catégories synchronisées avec la table maisonkenzi.categories de Supabase.
 * Initialisé à vide si la base de données est vierge.
 */

import { useSyncExternalStore } from "react";
import { supabase } from "@/lib/supabase";

export type AdminCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
  image?: string;
  icon?: string;
  gender?: string;
  is_active: boolean;
  order_index: number;
};

const DEFAULT_CATEGORIES: AdminCategory[] = [];

const STORAGE_KEY = "maisonkenzi_categories";
const CHANNEL_NAME = "maisonkenzi_categories_channel";

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
        return parsed.map((cat: any, index: number) => ({
          ...cat,
          id: cat.id || cat.slug || `cat_${index}_${Date.now()}`,
          image: cat.image || cat.icon || "",
          icon: cat.icon || cat.image || "",
          is_active: cat.is_active ?? true,
          order_index: cat.order_index ?? index,
        }));
      }
    }
  } catch {}
  return DEFAULT_CATEGORIES;
};

let state: AdminCategory[] = load();
const listeners = new Set<() => void>();

// Synchronisation initiale avec la table Supabase categories
if (typeof window !== "undefined") {
  (async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order", { ascending: true });

      if (!error && Array.isArray(data)) {
        state = data.map((c: any, index: number) => ({
          id: c.id || c.slug || `cat_${index}`,
          slug: c.slug,
          name: c.name,
          description: c.description || "",
          image: c.image || c.icon || "",
          icon: c.icon || c.image || "",
          is_active: c.is_active ?? true,
          order_index: c.sort_order ?? index,
        }));
        notify();
      }
    } catch {}
  })();
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

const notify = () => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      broadcastChannel?.postMessage({ type: "UPDATE_CATEGORIES" });
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
  const imageVal = cat.image || cat.icon || "";
  const fullCat: AdminCategory = {
    id,
    name: cat.name.trim(),
    slug: cat.slug.trim(),
    description: cat.description ? cat.description.trim() : "",
    image: imageVal,
    icon: imageVal,
    gender: cat.gender,
    is_active: cat.is_active ?? true,
    order_index: cat.order_index ?? state.length + 1,
  };

  // Mise à jour optimiste locale
  state = [...state.filter((c) => c.id !== id), fullCat];
  notify();

  // Persistance dans la base de données Supabase
  try {
    const { error } = await supabase.from("categories").upsert({
      id: fullCat.id,
      name: fullCat.name,
      slug: fullCat.slug,
      description: fullCat.description,
      icon: fullCat.image || fullCat.icon || null,
      is_active: fullCat.is_active,
      sort_order: fullCat.order_index,
    } as never);

    if (error) {
      console.error("Erreur lors de l'enregistrement de la catégorie dans Supabase :", error);
      return { success: false, error, category: fullCat };
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
      const img = partial.image !== undefined ? partial.image : partial.icon !== undefined ? partial.icon : c.image;
      return { ...c, ...partial, image: img, icon: img };
    }
    return c;
  });
  notify();

  // Persistance dans Supabase
  try {
    const updated = state.find((c) => c.id === id);
    if (updated) {
      const { error } = await supabase.from("categories").upsert({
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        description: updated.description,
        icon: updated.image || updated.icon || null,
        is_active: updated.is_active,
        sort_order: updated.order_index,
      } as never);

      if (error) {
        console.error("Erreur lors de la mise à jour de la catégorie dans Supabase :", error);
        return { success: false, error };
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

