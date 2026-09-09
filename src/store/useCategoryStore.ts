import { useSyncExternalStore } from "react";

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

const DEFAULT_CATEGORIES: AdminCategory[] = [
  {
    id: "cat_homme",
    slug: "homme",
    name: "Parfums Homme",
    description: "Sillage puissant, boisé et charismatique dédié aux hommes.",
    gender: "Homme",
    is_active: true,
    order_index: 1,
  },
  {
    id: "cat_femme",
    slug: "femme",
    name: "Parfums Femme",
    description: "Fragrances florales, ambrées et élégantes pour femmes.",
    gender: "Femme",
    is_active: true,
    order_index: 2,
  },
  {
    id: "cat_mixte",
    slug: "mixte",
    name: "Parfums Mixtes & Niche",
    description: "Créations olfactives universelles sans distinction de genre.",
    gender: "Mixte",
    is_active: true,
    order_index: 3,
  },
  {
    id: "cat_deodorants",
    slug: "deodorants-stick",
    name: "Déodorants Stick",
    description: "Sticks corporels de luxe aux senteurs emblématiques des grandes maisons.",
    is_active: true,
    order_index: 4,
  },
  {
    id: "cat_packs",
    slug: "packs",
    name: "Coffrets & Packs Découverte",
    description: "Sélections exclusives et assortiments cadeaux à prix privilégié.",
    is_active: true,
    order_index: 5,
  },
];

const STORAGE_KEY = "tabat_admin_categories";

const loadCategories = (): AdminCategory[] => {
  if (typeof window === "undefined") return DEFAULT_CATEGORIES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_CATEGORIES;
};

let categoriesState: AdminCategory[] = loadCategories();
const listeners = new Set<() => void>();

const persist = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(categoriesState));
  } catch {}
};

const emit = () => {
  persist();
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

const getSnapshot = () => categoriesState;

export const useCategories = (): AdminCategory[] =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

export const addCategory = (cat: Omit<AdminCategory, "id"> & { id?: string }) => {
  const newCat: AdminCategory = {
    ...cat,
    id: cat.id || `cat_${Date.now()}`,
    order_index: categoriesState.length + 1,
  };
  categoriesState = [...categoriesState, newCat];
  emit();
};

export const updateCategory = (id: string, patch: Partial<AdminCategory>) => {
  categoriesState = categoriesState.map((c) => (c.id === id ? { ...c, ...patch } : c));
  emit();
};

export const deleteCategory = (id: string) => {
  categoriesState = categoriesState.filter((c) => c.id !== id);
  emit();
};

export const resetCategories = () => {
  categoriesState = DEFAULT_CATEGORIES;
  emit();
};
