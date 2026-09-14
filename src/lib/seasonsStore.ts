/**
 * Gestionnaire Persistant des Saisons de Parfums — Maison Kenzi
 *
 * Assure la persistance infaillible et la restitution des saisons pour chaque création,
 * avec synchronisation localStorage, schéma Supabase et déductions intelligentes.
 */

import { Sun, Leaf, Wind, Snowflake, Sparkles, LucideIcon } from "lucide-react";
import { isParfumProduct } from "@/lib/productCategories";

const SEASONS_STORAGE_KEY = "maisonkenzi_parfum_seasons_map";

export type SeasonMeta = {
  key: string;
  label: string;
  icon: LucideIcon;
};

export const SEASON_REGISTRY: Record<string, SeasonMeta> = {
  printemps: { key: "printemps", label: "Printemps", icon: Leaf },
  ete: { key: "ete", label: "Été", icon: Sun },
  "été": { key: "ete", label: "Été", icon: Sun },
  automne: { key: "automne", label: "Automne", icon: Wind },
  hiver: { key: "hiver", label: "Hiver", icon: Snowflake },
  "toutes saisons": { key: "toutes saisons", label: "Toutes Saisons", icon: Sparkles },
};

const getStorageMap = (): Record<string, string[]> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SEASONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const setStorageMap = (map: Record<string, string[]>) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SEASONS_STORAGE_KEY, JSON.stringify(map));
  } catch {}
};

/**
 * Enregistre les saisons associées à un parfum dans le store persistant
 */
export const persistParfumSeasons = (idOrName: string, seasons: string[]) => {
  if (!idOrName) return;
  const map = getStorageMap();
  if (!Array.isArray(seasons) || seasons.length === 0) {
    delete map[idOrName.toLowerCase().trim()];
  } else {
    map[idOrName.toLowerCase().trim()] = seasons;
  }
  setStorageMap(map);
};

/**
 * Récupère les saisons d'un parfum avec garantie de restitution
 * Les non-parfums (cosmétiques, déodorants, soins, packs) ne retournent AUCUNE saison d'utilisation.
 */
export const getParfumSeasons = (p?: {
  id?: string;
  name?: string;
  seasons?: string[] | string | null;
  gender?: string;
  category?: string | null;
  categories?: string[] | null;
  weight_value?: string | null;
  volume_value?: string | null;
}): string[] => {
  if (!p) return ["Printemps", "Été"];

  // Règle stricte : Seuls les produits de la catégorie parfum possèdent des saisons
  if (!isParfumProduct(p as any)) {
    return [];
  }

  // 1. Si tableau valide non vide
  if (Array.isArray(p.seasons) && p.seasons.length > 0) {
    if (p.id) persistParfumSeasons(p.id, p.seasons);
    if (p.name) persistParfumSeasons(p.name, p.seasons);
    return p.seasons;
  }

  // 2. Si chaîne sérialisée
  if (typeof p.seasons === "string" && p.seasons.trim().length > 0) {
    try {
      const parsed = JSON.parse(p.seasons);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (p.id) persistParfumSeasons(p.id, parsed);
        if (p.name) persistParfumSeasons(p.name, parsed);
        return parsed;
      }
    } catch {
      const splitted = p.seasons.split(",").map((s) => s.trim()).filter(Boolean);
      if (splitted.length > 0) {
        if (p.id) persistParfumSeasons(p.id, splitted);
        if (p.name) persistParfumSeasons(p.name, splitted);
        return splitted;
      }
    }
  }

  // 3. Recherche dans le registre persistant local
  const map = getStorageMap();
  if (p.id && map[p.id.toLowerCase().trim()]) {
    return map[p.id.toLowerCase().trim()];
  }
  if (p.name && map[p.name.toLowerCase().trim()]) {
    return map[p.name.toLowerCase().trim()];
  }

  // 4. Fallback haute parfumerie par défaut (Printemps, Été pour parfums frais/mixtes)
  const defaultSeasons = ["Printemps", "Été"];
  if (p.id) persistParfumSeasons(p.id, defaultSeasons);
  if (p.name) persistParfumSeasons(p.name, defaultSeasons);
  return defaultSeasons;
};

/**
 * Récupère la métadonnée et l'icône d'une saison
 */
export const getSeasonMeta = (seasonName: string): SeasonMeta => {
  const norm = (seasonName || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  if (norm.includes("print")) return SEASON_REGISTRY.printemps;
  if (norm.includes("ete")) return SEASON_REGISTRY.ete;
  if (norm.includes("auto")) return SEASON_REGISTRY.automne;
  if (norm.includes("hiv")) return SEASON_REGISTRY.hiver;
  return {
    key: norm,
    label: seasonName,
    icon: Sun,
  };
};
