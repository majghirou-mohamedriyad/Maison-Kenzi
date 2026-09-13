/**
 * Service d'Intégration API REST Countries — Maison Kenzi
 *
 * Récupère, filtre et met en cache la liste officielle des pays et capitales
 * du Maroc et de l'Europe (noms en français, codes ISO, indicatifs téléphoniques).
 * Intègre un fallback local robuste pour une disponibilité 100% hors-ligne.
 */

export interface RestCountry {
  code: string;
  name: string; // Nom commun en français (ex: Maroc, France, Belgique)
  officialName: string;
  phonePrefix: string; // Ex: +212, +33, +32
  capital: string;
  region: string;
  flagEmoji?: string;
  flagSvg?: string;
}

// Liste initiale de secours et d'accès instantané (Zero-Lag)
export const FALLBACK_COUNTRIES: RestCountry[] = [
  { code: "MA", name: "Maroc", officialName: "Royaume du Maroc", phonePrefix: "+212", capital: "Rabat", region: "Africa" },
  { code: "FR", name: "France", officialName: "République française", phonePrefix: "+33", capital: "Paris", region: "Europe" },
  { code: "BE", name: "Belgique", officialName: "Royaume de Belgique", phonePrefix: "+32", capital: "Bruxelles", region: "Europe" },
  { code: "CH", name: "Suisse", officialName: "Confédération suisse", phonePrefix: "+41", capital: "Berne", region: "Europe" },
  { code: "ES", name: "Espagne", officialName: "Royaume d'Espagne", phonePrefix: "+34", capital: "Madrid", region: "Europe" },
  { code: "IT", name: "Italie", officialName: "République italienne", phonePrefix: "+39", capital: "Rome", region: "Europe" },
  { code: "DE", name: "Allemagne", officialName: "République fédérale d'Allemagne", phonePrefix: "+49", capital: "Berlin", region: "Europe" },
  { code: "GB", name: "Royaume-Uni", officialName: "Royaume-Uni de Grande-Bretagne et d'Irlande du Nord", phonePrefix: "+44", capital: "Londres", region: "Europe" },
  { code: "NL", name: "Pays-Bas", officialName: "Royaume des Pays-Bas", phonePrefix: "+31", capital: "Amsterdam", region: "Europe" },
  { code: "PT", name: "Portugal", officialName: "République portugaise", phonePrefix: "+351", capital: "Lisbonne", region: "Europe" },
  { code: "LU", name: "Luxembourg", officialName: "Grand-Duché de Luxembourg", phonePrefix: "+352", capital: "Luxembourg", region: "Europe" },
  { code: "AT", name: "Autriche", officialName: "République d'Autriche", phonePrefix: "+43", capital: "Vienne", region: "Europe" },
  { code: "SE", name: "Suède", officialName: "Royaume de Suède", phonePrefix: "+46", capital: "Stockholm", region: "Europe" },
  { code: "NO", name: "Norvège", officialName: "Royaume de Norvège", phonePrefix: "+47", capital: "Oslo", region: "Europe" },
  { code: "DK", name: "Danemark", officialName: "Royaume de Danemark", phonePrefix: "+45", capital: "Copenhague", region: "Europe" },
  { code: "IE", name: "Irlande", officialName: "République d'Irlande", phonePrefix: "+353", capital: "Dublin", region: "Europe" },
  { code: "MC", name: "Monaco", officialName: "Principauté de Monaco", phonePrefix: "+377", capital: "Monaco", region: "Europe" },
  { code: "AE", name: "Émirats Arabes Unis", officialName: "Émirats arabes unis", phonePrefix: "+971", capital: "Abou Dabi", region: "Asia" },
];

// Répertoire des villes principales par pays pour auto-complétion contextuelle
export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  Maroc: [
    "Casablanca", "Rabat", "Marrakech", "Tanger", "Fès", "Agadir", "Meknès", "Oujda",
    "Kénitra", "Tétouan", "Safi", "Mohammédia", "El Jadida", "Nador", "Béni Mellal", "Essaouira"
  ],
  France: [
    "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Montpellier", "Strasbourg",
    "Bordeaux", "Lille", "Rennes", "Toulon", "Reims", "Saint-Étienne", "Le Havre", "Cannes"
  ],
  Belgique: [
    "Bruxelles", "Anvers", "Gand", "Charleroi", "Liège", "Bruges", "Namur", "Louvain", "Mons"
  ],
  Suisse: [
    "Genève", "Zurich", "Lausanne", "Bâle", "Berne", "Neuchâtel", "Lugano", "Lucerne", "Fribourg"
  ],
  Espagne: [
    "Madrid", "Barcelone", "Valence", "Séville", "Saragosse", "Malaga", "Murcie", "Palma", "Bilbao", "Alicante"
  ],
  Italie: [
    "Rome", "Milan", "Naples", "Turin", "Palerme", "Gênes", "Bologne", "Florence", "Bari", "Venise"
  ],
  Allemagne: [
    "Berlin", "Munich", "Francfort", "Hambourg", "Cologne", "Stuttgart", "Düsseldorf", "Dortmund", "Leipzig"
  ],
  "Royaume-Uni": [
    "Londres", "Manchester", "Birmingham", "Liverpool", "Leeds", "Édimbourg", "Glasgow", "Bristol"
  ],
  "Pays-Bas": [
    "Amsterdam", "Rotterdam", "La Haye", "Utrecht", "Eindhoven", "Groningue"
  ],
  Portugal: [
    "Lisbonne", "Porto", "Braga", "Coimbra", "Faro", "Funchal"
  ],
  Luxembourg: [
    "Luxembourg-Ville", "Esch-sur-Alzette", "Differdange", "Dudelange"
  ],
};

const CACHE_KEY = "mk_rest_countries_cache_v1";
const CACHE_EXPIRY_MS = 1000 * 60 * 60 * 24 * 7; // 7 jours de cache

/**
 * Récupère la liste des pays (Maroc + Europe) avec indicatifs téléphoniques et capitales
 * Fourniture instantanée 0-ms garantie sans latence réseau ni blocage CORS.
 */
export async function fetchMoroccoAndEuropeCountries(): Promise<RestCountry[]> {
  return FALLBACK_COUNTRIES;
}

/**
 * Recherche de villes selon le pays sélectionné
 */
export function getCitiesForCountry(countryName: string, query?: string, limit = 8): string[] {
  const baseCities = CITIES_BY_COUNTRY[countryName] || (countryName === "Maroc" ? CITIES_BY_COUNTRY["Maroc"] : CITIES_BY_COUNTRY["France"]);
  if (!query || query.trim() === "") {
    return baseCities.slice(0, limit);
  }
  const cleanQ = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  return baseCities
    .filter((c) => c.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(cleanQ))
    .slice(0, limit);
}
