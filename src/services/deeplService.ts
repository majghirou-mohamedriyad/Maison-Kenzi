/**
 * Service de Traduction Intelligente DeepL — Maison Kenzi
 *
 * Fournit une interface simple et robuste pour la traduction neuronale :
 * - Traduction de textes unitaires et par lots (descriptions, notes, noms de parfums)
 * - Mise en cache locale des traductions pour optimiser les quotas de l'API
 * - Relais via /api/deepl (Serverless Vercel) avec repli direct sécurisé
 */

import { getAppSettings } from "@/hooks/useAppSettings";

export interface DeepLUsageResult {
  ok: boolean;
  isFreeKey?: boolean;
  character_count?: number;
  character_limit?: number;
  error?: string;
}

export interface TranslationResult {
  success: boolean;
  translatedText?: string;
  translations?: string[];
  error?: string;
}

const CACHE_PREFIX = "mk_deepl_cache_";

/**
 * Génère une clé de hachage simple pour le cache
 */
const getCacheKey = (text: string, targetLang: string) => {
  return `${CACHE_PREFIX}${targetLang}_${text.trim().toLowerCase().slice(0, 80)}_${text.length}`;
};

/**
 * Récupère la clé API configurée (dans AppSettings ou localStorage)
 */
export const getActiveDeeplApiKey = (): string => {
  const settings = getAppSettings();
  if (settings.deepl_api_key && settings.deepl_api_key.trim()) {
    return settings.deepl_api_key.trim();
  }
  if (typeof window !== "undefined") {
    const local = localStorage.getItem("mk_deepl_api_key");
    if (local && local.trim()) return local.trim();
  }
  return "";
};

/**
 * Enregistre la clé API DeepL dans le stockage local
 */
export const setActiveDeeplApiKey = (apiKey: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("mk_deepl_api_key", apiKey.trim());
  }
};

/**
 * Teste la validité de la clé API DeepL et renvoie l'état du quota
 */
export const checkDeeplUsage = async (customApiKey?: string): Promise<DeepLUsageResult> => {
  const apiKey = (customApiKey || getActiveDeeplApiKey()).trim();
  if (!apiKey) {
    return { ok: false, error: "Aucune clé API DeepL renseignée." };
  }

  // 1. Essai via le relais Serverless Vercel /api/deepl
  try {
    const response = await fetch("/api/deepl?action=usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, action: "usage" }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        ok: true,
        isFreeKey: data.isFreeKey,
        character_count: data.character_count || 0,
        character_limit: data.character_limit || 500000,
      };
    }
  } catch {
    // Si l'environnement de dev local n'a pas encore le endpoint /api/deepl actif, repli direct
  }

  // 2. Repli Direct vers DeepL API
  try {
    const isFreeKey = apiKey.endsWith(":fx");
    const baseUrl = isFreeKey ? "https://api-free.deepl.com/v2" : "https://api.deepl.com/v2";

    const res = await fetch(`${baseUrl}/usage`, {
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
      },
    });

    if (!res.ok) {
      return { ok: false, error: `Erreur DeepL (${res.status}): Clé invalide ou expirée.` };
    }

    const data = await res.json();
    return {
      ok: true,
      isFreeKey,
      character_count: data.character_count || 0,
      character_limit: data.character_limit || 500000,
    };
  } catch (err: any) {
    return { ok: false, error: `Erreur de connexion DeepL: ${err.message || String(err)}` };
  }
};

/**
 * Traduit un texte avec DeepL (avec mise en cache)
 */
export const translateWithDeepl = async (
  text: string,
  targetLang: "EN" | "FR" = "EN",
  sourceLang?: "EN" | "FR",
  customApiKey?: string
): Promise<TranslationResult> => {
  if (!text || !text.trim()) {
    return { success: true, translatedText: "" };
  }

  const cacheKey = getCacheKey(text, targetLang);
  if (typeof window !== "undefined") {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      return { success: true, translatedText: cached };
    }
  }

  const apiKey = (customApiKey || getActiveDeeplApiKey()).trim();
  if (!apiKey) {
    return {
      success: false,
      error: "Veuillez renseigner votre clé API DeepL dans les Paramètres.",
    };
  }

  // 1. Tentative via /api/deepl
  try {
    const response = await fetch("/api/deepl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        text,
        target_lang: targetLang,
        source_lang: sourceLang,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const translated = data.translatedText || (data.translations && data.translations[0]) || "";
      if (translated && typeof window !== "undefined") {
        sessionStorage.setItem(cacheKey, translated);
      }
      return { success: true, translatedText: translated };
    }
  } catch {
    // Repli direct
  }

  // 2. Repli Direct API DeepL
  try {
    const isFreeKey = apiKey.endsWith(":fx");
    const endpoint = isFreeKey
      ? "https://api-free.deepl.com/v2/translate"
      : "https://api.deepl.com/v2/translate";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: [text],
        target_lang: targetLang === "EN" ? "EN-US" : targetLang,
        ...(sourceLang ? { source_lang: sourceLang } : {}),
      }),
    });

    if (!res.ok) {
      const errTxt = await res.text();
      return { success: false, error: `Erreur DeepL (${res.status}): ${errTxt}` };
    }

    const data = await res.json();
    const translated = data.translations?.[0]?.text || "";
    if (translated && typeof window !== "undefined") {
      sessionStorage.setItem(cacheKey, translated);
    }
    return { success: true, translatedText: translated };
  } catch (err: any) {
    return { success: false, error: `Erreur de traduction: ${err.message || String(err)}` };
  }
};

/**
 * Traduit un lot de textes avec DeepL en une seule requête
 */
export const translateBatchWithDeepl = async (
  texts: string[],
  targetLang: "EN" | "FR" = "EN",
  customApiKey?: string
): Promise<string[]> => {
  const validTexts = texts.filter((t) => t && t.trim());
  if (validTexts.length === 0) return texts;

  const apiKey = (customApiKey || getActiveDeeplApiKey()).trim();
  if (!apiKey) return texts;

  try {
    const response = await fetch("/api/deepl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey,
        text: validTexts,
        target_lang: targetLang,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.translations && Array.isArray(data.translations)) {
        return data.translations;
      }
    }
  } catch {
    // Si échec de la requête par lot, traduire élément par élément avec fallback
  }

  const results: string[] = [];
  for (const t of texts) {
    const res = await translateWithDeepl(t, targetLang, undefined, apiKey);
    results.push(res.translatedText || t);
  }
  return results;
};
