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

// Génération sécurisée d'un identifiant unique (UUID v4 conforme PostgreSQL)
const generateId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {}
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
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
    let { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      // Repli si sort_order n'existe pas encore dans la table PostgreSQL
      const fallbackRes = await supabase.from("categories").select("*");
      data = fallbackRes.data;
      error = fallbackRes.error;
    }

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
  } catch (err) {
    console.warn("Exception lors du chargement des catégories depuis Supabase :", err);
  }
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

  // Mise à jour optimiste locale immédiate
  state = [...state.filter((c) => c.id !== id && c.slug !== fullCat.slug), fullCat];
  notify();

  // Persistance dans la base de données Supabase avec repli progressif
  try {
    const payload: any = {
      id: fullCat.id,
      name: fullCat.name,
      name_en: fullCat.name_en || null,
      slug: fullCat.slug,
      description: fullCat.description,
      description_en: fullCat.description_en || null,
      icon: fullCat.images && fullCat.images.length > 0 ? JSON.stringify(fullCat.images) : (fullCat.image || null),
      gender: fullCat.gender || null,
      is_active: fullCat.is_active,
      is_coming_soon: fullCat.is_coming_soon,
      sort_order: fullCat.order_index,
    };

    // 1. Tentative d'upsert complet avec conflit sur id
    let { error } = await supabase.from("categories").upsert(payload as never, { onConflict: "id" });

    if (error) {
      console.warn("Tentative 1 sans colonnes optionnelles pour compatibilité :", error.message);
      // 2. Repli sans les colonnes optionnelles bilingues, genre et coming_soon
      const { name_en: _ne, description_en: _de, is_coming_soon: _ics, gender: _g, ...fallbackPayload } = payload;
      const res2 = await supabase.from("categories").upsert(fallbackPayload as never, { onConflict: "id" });
      error = res2.error;

      if (error) {
        console.warn("Tentative 2 sans sort_order :", error.message);
        // 3. Repli sans sort_order
        const { sort_order: _so, ...fallbackMinimal } = fallbackPayload;
        const res3 = await supabase.from("categories").upsert(fallbackMinimal as never, { onConflict: "id" });
        error = res3.error;

        if (error) {
          console.warn("Tentative 3 avec conflit sur slug :", error.message);
          // 4. Repli avec onConflict: slug si id n'est pas la clé primaire
          const res4 = await supabase.from("categories").upsert(fallbackMinimal as never, { onConflict: "slug" });
          error = res4.error;
        }
      }
    }

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
    if (c.id === id || c.slug === id) {
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
    const updated = state.find((c) => c.id === id || c.slug === id);
    if (updated) {
      const payload: any = {
        name: updated.name,
        name_en: updated.name_en || null,
        slug: updated.slug,
        description: updated.description,
        description_en: updated.description_en || null,
        icon: updated.images && updated.images.length > 0 ? JSON.stringify(updated.images) : (updated.image || null),
        gender: updated.gender || null,
        is_active: updated.is_active,
        is_coming_soon: !!updated.is_coming_soon,
        sort_order: updated.order_index,
      };

      // 1. Tenter d'abord une mise à jour directe (UPDATE) par ID
      let { error } = await supabase.from("categories").update(payload as never).eq("id", updated.id);

      if (error) {
        console.warn("Mise à jour directe échouée, tentative sans colonnes optionnelles :", error.message);
        // 2. Repli sans colonnes optionnelles
        const { name_en: _ne, description_en: _de, is_coming_soon: _ics, gender: _g, ...fallbackPayload } = payload;
        const res2 = await supabase.from("categories").update(fallbackPayload as never).eq("id", updated.id);
        error = res2.error;

        if (error && updated.slug) {
          console.warn("Mise à jour par ID échouée, tentative par slug :", error.message);
          const res3 = await supabase.from("categories").update(fallbackPayload as never).eq("slug", updated.slug);
          error = res3.error;
        }

        if (error) {
          // 3. Si update échoue (ligne absente), tenter un upsert complet
          const upsertPayload = { id: updated.id, ...fallbackPayload };
          const res4 = await supabase.from("categories").upsert(upsertPayload as never, { onConflict: "id" });
          error = res4.error;
        }
      }

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
  const target = state.find((c) => c.id === id || c.slug === id);
  state = state.filter((c) => c.id !== id && c.slug !== id);
  notify();

  // Suppression dans Supabase
  try {
    let { error } = await supabase.from("categories").delete().eq("id", id);
    if (error && target?.slug) {
      const res2 = await supabase.from("categories").delete().eq("slug", target.slug);
      error = res2.error;
    }
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

