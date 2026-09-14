/**
 * Utilitaire de Localisation des Produits (Bilingue FR / EN) — Maison Kenzi
 *
 * Permet d'extraire dynamiquement le nom, la description, le sous-titre/conseils
 * et les notes olfactives du produit selon la langue active ("fr" ou "en").
 */

import type { Parfum } from "@/types/database";
import type { AdminParfum } from "@/store/useProductStore";

type AnyProduct = Partial<Parfum> | Partial<AdminParfum> | null | undefined;

/**
 * Retourne le nom du produit selon la langue (anglais si language === "en" et name_en renseigné)
 */
export const getProductName = (p: AnyProduct, language: string): string => {
  if (!p) return "";
  const nameEn = (p as any)?.name_en || (p as any)?.nameEn;
  if (language === "en" && typeof nameEn === "string" && nameEn.trim().length > 0) {
    return nameEn.trim();
  }
  return p.name || "";
};

/**
 * Retourne la description du produit selon la langue
 */
export const getProductDescription = (p: AnyProduct, language: string): string => {
  if (!p) return "";
  const descEn = (p as any)?.description_en || (p as any)?.descriptionEn;
  if (language === "en" && typeof descEn === "string" && descEn.trim().length > 0) {
    return descEn;
  }
  return p.description || "";
};

/**
 * Retourne le sous-titre / conseils d'application selon la langue
 */
export const getProductSubtitle = (p: AnyProduct, language: string): string => {
  if (!p) return "";
  const subEn = (p as any)?.image_label_en || (p as any)?.imageLabelEn;
  if (language === "en" && typeof subEn === "string" && subEn.trim().length > 0) {
    return subEn;
  }
  const subFr = (p as any)?.image_label || (p as any)?.imageLabel || "";
  return typeof subFr === "string" && !subFr.startsWith("[") ? subFr : "";
};

/**
 * Retourne les notes olfactives selon la langue
 */
export const getProductNotes = (p: AnyProduct, language: string): string => {
  if (!p) return "";
  const notesEn = (p as any)?.notes_en || (p as any)?.notesEn;
  if (language === "en" && notesEn) {
    if (typeof notesEn === "string" && notesEn.trim().length > 0) {
      return notesEn;
    }
    if (typeof notesEn === "object") {
      return Object.values(notesEn).flat().filter(Boolean).join(" • ");
    }
  }

  const notesObj = (p as any)?.notes;
  if (notesObj && typeof notesObj === "object") {
    return [
      ...(notesObj.tete || []),
      ...(notesObj.coeur || []),
      ...(notesObj.fond || []),
    ].filter(Boolean).join(" • ");
  }

  return [
    ...((p as any)?.notes_tete || []),
    ...((p as any)?.notes_coeur || []),
    ...((p as any)?.notes_fond || []),
  ].filter(Boolean).join(" • ");
};

/**
 * Traduit le genre d'un parfum selon la langue active (FR / EN)
 */
export const getProductGender = (gender?: string | null, language: string = "fr"): string => {
  if (!gender || typeof gender !== "string") return "";
  const g = gender.toLowerCase().trim();

  if (language === "en") {
    if (g === "homme" || g === "men" || g === "man") return "Men";
    if (g === "femme" || g === "women" || g === "woman") return "Women";
    if (g === "mixte" || g === "unisexe" || g === "unisex") return "Unisex";
    return gender;
  }

  // Français par défaut
  if (g === "homme" || g === "men" || g === "man") return "Homme";
  if (g === "femme" || g === "women" || g === "woman") return "Femme";
  if (g === "mixte" || g === "unisexe" || g === "unisex") return "Mixte";
  return gender;
};

/**
 * Traduit le nom d'une saison selon la langue active (FR / EN)
 */
export const getSeasonLabel = (seasonName?: string | null, language: string = "fr"): string => {
  if (!seasonName || typeof seasonName !== "string") return "";
  const norm = seasonName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  if (language === "en") {
    if (norm.includes("print")) return "Spring";
    if (norm.includes("ete")) return "Summer";
    if (norm.includes("auto")) return "Autumn";
    if (norm.includes("hiv")) return "Winter";
    if (norm.includes("toute") || norm.includes("all")) return "All Seasons";
    return seasonName;
  }

  // Français par défaut
  if (norm.includes("print")) return "Printemps";
  if (norm.includes("ete")) return "Été";
  if (norm.includes("auto")) return "Automne";
  if (norm.includes("hiv")) return "Hiver";
  if (norm.includes("toute") || norm.includes("all")) return "Toutes Saisons";
  return seasonName;
};
