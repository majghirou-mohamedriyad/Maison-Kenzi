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
  icon?: string;
  gender?: string;
  is_active: boolean;
  order_index: number;
};

const DEFAULT_CATEGORIES: AdminCategory[] = [];

const STORAGE_KEY = "maisonkenzi_categories";
const CHANNEL_NAME = "maisonkenzi_categories_channel";

const load = (): AdminCategory[] => {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    localStorage.removeItem("tabat_admin_categories");
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
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
        state = data.map((c: any) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          description: c.description || "",
          icon: c.icon || "",
          is_active: c.is_active ?? true,
          order_index: c.sort_order ?? 0,
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

export const addCategory = async (cat: AdminCategory) => {
  state = [...state, cat];
  notify();

  // Persistance dans Supabase
  try {
    await supabase.from("categories").upsert({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon || null,
      is_active: cat.is_active,
      sort_order: cat.order_index,
    } as never);
  } catch {}
};

export const updateCategory = async (id: string, partial: Partial<AdminCategory>) => {
  state = state.map((c) => (c.id === id ? { ...c, ...partial } : c));
  notify();

  // Persistance dans Supabase
  try {
    const updated = state.find((c) => c.id === id);
    if (updated) {
      await supabase.from("categories").upsert({
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        description: updated.description,
        icon: updated.icon || null,
        is_active: updated.is_active,
        sort_order: updated.order_index,
      } as never);
    }
  } catch {}
};

export const deleteCategory = async (id: string) => {
  state = state.filter((c) => c.id !== id);
  notify();

  // Suppression dans Supabase
  try {
    await supabase.from("categories").delete().eq("id", id);
  } catch {}
};

export const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useCategories = (): AdminCategory[] => {
  return useSyncExternalStore(subscribe, getCategories, () => DEFAULT_CATEGORIES);
};
