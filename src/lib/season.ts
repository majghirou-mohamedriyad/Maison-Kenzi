export type SeasonKey = "summer" | "autumn" | "winter" | "spring";
export type SeasonMode = "auto" | SeasonKey;

export interface SeasonInfo {
  key: SeasonKey;
  label: string;
  badge: string;
  defaultTitle: string;
  defaultSubtitle: string;
  icon: string; // 'Sun' | 'Leaf' | 'Snowflake' | 'Sparkles'
}

export const SEASONS: Record<SeasonKey, SeasonInfo> = {
  summer: {
    key: "summer",
    label: "Été",
    badge: "La Sélection Estivale",
    defaultTitle: "Fragrances d'Été",
    defaultSubtitle: "Des compositions fraîches, solaires et lumineuses idéales pour les beaux jours.",
    icon: "Sun",
  },
  autumn: {
    key: "autumn",
    label: "Automne",
    badge: "Les Notes d'Automne",
    defaultTitle: "Élégance Automnale",
    defaultSubtitle: "Des accords boisés, ambrés et épicés pour accompagner la saison des feuilles dorées.",
    icon: "Leaf",
  },
  winter: {
    key: "winter",
    label: "Hiver",
    badge: "Collection Hivernale",
    defaultTitle: "Sillages d'Hiver",
    defaultSubtitle: "Des parfums intenses, réconfortants et envoûtants pour les journées fraîches.",
    icon: "Snowflake",
  },
  spring: {
    key: "spring",
    label: "Printemps",
    badge: "Éveil Printanier",
    defaultTitle: "Fragrances de Printemps",
    defaultSubtitle: "Des notes florales, vertes et pétillantes pour célébrer le renouveau.",
    icon: "Sparkles",
  },
};

export const getCurrentSeason = (): SeasonKey => {
  const month = new Date().getMonth(); // 0 = Jan, 11 = Dec
  if (month >= 5 && month <= 7) return "summer";   // June, July, Aug
  if (month >= 8 && month <= 10) return "autumn";  // Sept, Oct, Nov
  if (month === 11 || month === 0 || month === 1) return "winter"; // Dec, Jan, Feb
  return "spring"; // Mar, Apr, May
};

export interface SeasonalSettings {
  mode: SeasonMode;
  customTitle: string;
  customSubtitle: string;
  productIds: string[];
}

export const DEFAULT_SEASONAL_IDS: Record<SeasonKey, string[]> = {
  summer: [
    "le-beau-le-parfum",
    "9-pm-night-out-afnan",
    "valentino-born-in-roma-intense",
    "stronger-with-you-intensely",
  ],
  autumn: [
    "stronger-with-you-intensely",
    "valentino-born-in-roma-intense",
    "le-beau-le-parfum",
    "9-pm-night-out-afnan",
  ],
  winter: [
    "valentino-born-in-roma-intense",
    "stronger-with-you-intensely",
    "9-pm-night-out-afnan",
    "le-beau-le-parfum",
  ],
  spring: [
    "9-pm-night-out-afnan",
    "le-beau-le-parfum",
    "stronger-with-you-intensely",
    "valentino-born-in-roma-intense",
  ],
};

const STORAGE_KEY = "tabat_seasonal_settings";
export const SEASONAL_UPDATED_EVENT = "tabat_seasonal_updated";

export const getSavedSeasonalSettings = (): SeasonalSettings => {
  const currentSeason = getCurrentSeason();
  const defaults: SeasonalSettings = {
    mode: "auto",
    customTitle: "",
    customSubtitle: "",
    productIds: DEFAULT_SEASONAL_IDS[currentSeason],
  };

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        mode: parsed.mode || "auto",
        customTitle: parsed.customTitle || "",
        customSubtitle: parsed.customSubtitle || "",
        productIds: Array.isArray(parsed.productIds) && parsed.productIds.length > 0
          ? parsed.productIds
          : defaults.productIds,
      };
    }
  } catch {
    // fallback
  }
  return defaults;
};

export const saveSeasonalSettings = (settings: SeasonalSettings) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new Event(SEASONAL_UPDATED_EVENT));
};

export const resolveActiveSeason = (mode: SeasonMode): SeasonKey => {
  if (mode === "auto") {
    return getCurrentSeason();
  }
  return mode;
};
