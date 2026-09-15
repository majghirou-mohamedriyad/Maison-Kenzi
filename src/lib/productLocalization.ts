/**
 * Utilitaire de Localisation des Produits (Bilingue FR / EN) — Maison Kenzi
 *
 * Permet d'extraire dynamiquement le nom, la description, le sous-titre/conseils
 * et les notes olfactives du produit selon la langue active ("fr" ou "en").
 */

import type { Parfum } from "@/types/database";
import type { AdminParfum } from "@/store/useProductStore";
export { getCategorySlugOrder } from "@/lib/productCategories";

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

/**
 * Traduit le nom d'une catégorie selon la langue active (FR / EN)
 * Priorité :
 * 1. name_en si language === "en" et renseigné
 * 2. Dictionnaire bilingue des univers et familles olfactives Maison Kenzi
 * 3. Nom brut existant
 */
export const getCategoryName = (
  cat?: { name?: string; name_en?: string; nameEn?: string; slug?: string } | null,
  language: string = "fr"
): string => {
  if (!cat) return "";
  const rawName = cat.name || "";
  const nameEn = cat.name_en || (cat as any)?.nameEn;

  if (language === "en") {
    if (typeof nameEn === "string" && nameEn.trim().length > 0) {
      return nameEn.trim();
    }

    const s = (cat.slug || "").toLowerCase().trim();
    const n = rawName.toLowerCase().trim();

    // 1. Grands univers Maison Kenzi
    if (s === "parfums" || s === "parfum" || n === "parfums" || n === "parfum") return "Fragrances & Perfumes";
    if (s.includes("cosmetique") || n.includes("cosmétique") || n.includes("cosmetique")) return "Cosmetics & Skincare";
    if (s.includes("artisanal") || s.includes("artisanat") || s.includes("artisanaux") || n.includes("artisanal") || n.includes("artisanat")) return "Handcrafted Creations";
    if (s.includes("antique") || s.includes("antiquit") || n.includes("antique") || n.includes("antiquité")) return "Rare Antiques & Treasures";
    if (s.includes("deodorant") || n.includes("déodorant") || n.includes("deodorant")) return "Deodorant Sticks";
    if (s.includes("pack") || n.includes("pack")) return "Discovery Packs";
    if (s === "homme" || n === "homme") return "Men";
    if (s === "femme" || n === "femme") return "Women";
    if (s === "mixte" || s === "unisexe" || n === "mixte" || n === "unisexe") return "Unisex";

    // 2. Familles olfactives classiques
    if (s.includes("orient") || n.includes("orient")) return "Oriental";
    if (s.includes("flor") || n.includes("flor")) return "Floral";
    if (s.includes("bois") || n.includes("bois")) return "Woody";
    if (s.includes("ambr") || n.includes("ambr")) return "Amber";
    if (s.includes("gourmand") || n.includes("gourmand")) return "Gourmand";
    if (s.includes("frais") || n.includes("fresh")) return "Fresh";
    if (s.includes("epic") || n.includes("épic") || n.includes("spic")) return "Spicy";
    if (s.includes("aquat") || n.includes("marin")) return "Aquatic";
    if (s.includes("cuir") || n.includes("leather")) return "Leather";
    if (s.includes("agrum") || n.includes("citrus")) return "Citrus";

    return rawName;
  }

  return rawName;
};

/**
 * Traduit la description d'une catégorie selon la langue active (FR / EN)
 * Priorité :
 * 1. description_en si language === "en" et renseignée
 * 2. Dictionnaire bilingue des descriptions éditoriales Maison Kenzi
 * 3. Description brute existante
 */
export const getCategoryDescription = (
  cat?: { description?: string; description_en?: string; descriptionEn?: string; slug?: string; name?: string } | null,
  language: string = "fr"
): string => {
  if (!cat) return "";
  const rawDesc = cat.description || "";
  const descEn = cat.description_en || (cat as any)?.descriptionEn;

  if (language === "en") {
    if (typeof descEn === "string" && descEn.trim().length > 0) {
      return descEn.trim();
    }

    const s = (cat.slug || "").toLowerCase().trim();
    const n = (cat.name || "").toLowerCase().trim();

    if (s === "parfums" || s === "parfum" || n === "parfums" || n === "parfum") {
      return "Signature creations & niche fragrance catalog";
    }
    if (s.includes("cosmetique") || n.includes("cosmétique") || n.includes("cosmetique")) {
      return "Exceptional skincare & luxury cosmetics";
    }
    if (s.includes("artisanal") || s.includes("artisanat") || s.includes("artisanaux") || n.includes("artisanal") || n.includes("artisanat")) {
      return "Handcrafted artisan pieces & fine heritage";
    }
    if (s.includes("antique") || s.includes("antiquit") || n.includes("antique") || n.includes("antiquité")) {
      return "Collector items, vintage treasures & antiques";
    }
    if (s.includes("deodorant") || n.includes("déodorant") || n.includes("deodorant")) {
      return "Long-lasting freshness & luxury body care";
    }
    if (s.includes("pack") || n.includes("pack")) {
      return "Exclusive sets & curated discovery gifts";
    }
    if (s === "homme" || n === "homme") return "Exclusive masculine fragrances";
    if (s === "femme" || n === "femme") return "Enchanting feminine fragrances";
    if (s === "mixte" || s === "unisexe" || n === "mixte" || n === "unisexe") return "Unisex accords & bespoke creations";

    return "Exclusive collection";
  }

  return rawDesc || "Collection exclusive";
};
