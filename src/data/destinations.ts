/**
 * Référentiel des Destinations de Livraison — Maison Kenzi
 *
 * Prend en charge l'ensemble des villes du Maroc ainsi que l'Europe
 * (France, Belgique, Suisse, Espagne, Italie, Allemagne, etc.).
 */

import { MOROCCAN_CITIES, POPULAR_CITIES as POPULAR_MOROCCAN_CITIES } from "./moroccanCities";

export interface CountryOption {
  code: string;
  name: string;
  phonePrefix: string;
  flagCode: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: "MA", name: "Maroc", phonePrefix: "+212", flagCode: "MA" },
  { code: "FR", name: "France", phonePrefix: "+33", flagCode: "FR" },
  { code: "BE", name: "Belgique", phonePrefix: "+32", flagCode: "BE" },
  { code: "CH", name: "Suisse", phonePrefix: "+41", flagCode: "CH" },
  { code: "ES", name: "Espagne", phonePrefix: "+34", flagCode: "ES" },
  { code: "IT", name: "Italie", phonePrefix: "+39", flagCode: "IT" },
  { code: "DE", name: "Allemagne", phonePrefix: "+49", flagCode: "DE" },
  { code: "GB", name: "Royaume-Uni", phonePrefix: "+44", flagCode: "GB" },
  { code: "NL", name: "Pays-Bas", phonePrefix: "+31", flagCode: "NL" },
  { code: "PT", name: "Portugal", phonePrefix: "+351", flagCode: "PT" },
  { code: "LU", name: "Luxembourg", phonePrefix: "+352", flagCode: "LU" },
  { code: "EU", name: "Autre (Europe)", phonePrefix: "+", flagCode: "EU" },
];

export const EUROPEAN_CITIES: string[] = [
  "Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille",
  "Bruxelles", "Liège", "Anvers", "Gand", "Charleroi",
  "Genève", "Lausanne", "Zurich", "Bâle", "Neuchâtel",
  "Madrid", "Barcelone", "Valence", "Séville", "Malaga",
  "Rome", "Milan", "Naples", "Turin", "Florence",
  "Berlin", "Munich", "Francfort", "Hambourg", "Cologne",
  "Londres", "Manchester", "Birmingham",
  "Amsterdam", "Rotterdam", "La Haye",
  "Lisbonne", "Porto",
  "Luxembourg",
];

export interface DestinationItem {
  name: string;
  country: string;
}

export const POPULAR_DESTINATIONS: DestinationItem[] = [
  { name: "Casablanca", country: "Maroc" },
  { name: "Rabat", country: "Maroc" },
  { name: "Marrakech", country: "Maroc" },
  { name: "Tanger", country: "Maroc" },
  { name: "Paris", country: "France" },
  { name: "Bruxelles", country: "Belgique" },
  { name: "Genève", country: "Suisse" },
  { name: "Madrid", country: "Espagne" },
  { name: "Lyon", country: "France" },
  { name: "Marseille", country: "France" },
  { name: "Fès", country: "Maroc" },
  { name: "Agadir", country: "Maroc" },
];

const normalizeStr = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export const searchDestinations = (query: string, limit = 8): DestinationItem[] => {
  if (!query || query.trim() === "") {
    return POPULAR_DESTINATIONS.slice(0, limit);
  }

  const cleanQ = normalizeStr(query);
  const results: Array<{ name: string; country: string }> = [];

  // Recherche dans les villes marocaines
  for (const city of MOROCCAN_CITIES) {
    if (normalizeStr(city).includes(cleanQ)) {
      results.push({ name: city, country: "Maroc" });
      if (results.length >= limit) return results;
    }
  }

  // Recherche dans les villes européennes
  for (const city of EUROPEAN_CITIES) {
    if (normalizeStr(city).includes(cleanQ) && !results.some((r) => r.name === city)) {
      results.push({ name: city, country: "Europe" });
      if (results.length >= limit) return results;
    }
  }

  return results;
};
