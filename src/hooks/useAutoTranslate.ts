/**
 * Hook de Traduction Bilingue Instantané — Maison Kenzi
 *
 * Fonctionne de façon 100% autonome et immédiate sans appel réseau ni dépendance externe.
 */

import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Traduction immédiate des termes et textes récurrents
 */
const COMMON_DICTIONARY: Record<string, string> = {
  "Flacon Complet Scellé": "Full Sealed Bottle",
  "Flacon d'origine": "Original Flacon",
  "Format Découverte 5 ml": "5 ml Discovery Sample",
  "Format Voyage 10 ml": "10 ml Travel Spray",
  "Rupture de Stock": "Out of Stock",
  "En stock": "In Stock",
  "Homme": "Men",
  "Femme": "Women",
  "Mixte": "Unisex",
  "Unisexe": "Unisex",
  "Printemps": "Spring",
  "Été": "Summer",
  "Automne": "Autumn",
  "Hiver": "Winter",
  "Toutes saisons": "All Seasons",
  "Frais": "Fresh",
  "Boisé": "Woody",
  "Oriental": "Oriental",
  "Gourmand": "Gourmand",
  "Floral": "Floral",
  "Épicé": "Spicy",
  "Ambré": "Ambery",
  "Cuiré": "Leathery",
  "Agrumes": "Citrus",
};

export const useAutoTranslate = (frenchText: string | undefined | null): string => {
  const { language } = useLanguage();

  if (!frenchText) return "";
  if (language === "fr") return frenchText;

  // Si une traduction standard existe dans le dictionnaire
  if (COMMON_DICTIONARY[frenchText]) {
    return COMMON_DICTIONARY[frenchText];
  }

  return frenchText;
};
