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

export const OFFICIAL_DEEPL_KEY = "77993c1b-141d-4362-b6d2-4eaae702d6d5:fx";

/**
 * Récupère la clé API configurée (dans AppSettings, localStorage ou officielle)
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
  return OFFICIAL_DEEPL_KEY;
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

  const isFreeKey = apiKey.endsWith(":fx");

  // 1. Essai via le relais Serverless Vercel /api/deepl (et middleware Vite local)
  try {
    const response = await fetch("/api/deepl?action=usage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey, action: "usage" }),
    });

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      if (response.ok && data.ok) {
        return {
          ok: true,
          isFreeKey: data.isFreeKey ?? isFreeKey,
          character_count: data.character_count || 0,
          character_limit: data.character_limit || 500000,
        };
      } else if (data.error) {
        return { ok: false, error: data.error };
      }
    }
  } catch (err: any) {
    // Si l'appel /api/deepl échoue
  }

  // 2. Essai via le proxy direct Vite local (/api/deepl-free ou /api/deepl-pro)
  try {
    const proxyEndpoint = isFreeKey ? "/api/deepl-free/usage" : "/api/deepl-pro/usage";
    const proxyRes = await fetch(proxyEndpoint, {
      method: "GET",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
      },
    });

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      return {
        ok: true,
        isFreeKey,
        character_count: data.character_count || 0,
        character_limit: data.character_limit || 500000,
      };
    }
  } catch {
    // Si échec du proxy direct
  }

  // 3. Repli Direct vers DeepL API
  try {
    const baseUrl = isFreeKey ? "https://api-free.deepl.com/v2" : "https://api.deepl.com/v2";

    const res = await fetch(`${baseUrl}/usage`, {
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
      },
    });

    if (!res.ok) {
      return { ok: false, error: `Erreur DeepL (${res.status}): Clé invalide ou quota dépassé.` };
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

  const isFreeKey = apiKey.endsWith(":fx");

  // 1. Tentative via le relais Serverless Vercel /api/deepl (et middleware Vite local)
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

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const data = await response.json();
      if (response.ok && data.success) {
        const translated = data.translatedText || (data.translations && data.translations[0]) || "";
        if (translated && typeof window !== "undefined") {
          sessionStorage.setItem(cacheKey, translated);
        }
        return { success: true, translatedText: translated };
      } else if (data.error) {
        return { success: false, error: data.error };
      }
    }
  } catch {
    // Repli
  }

  // 2. Essai via le proxy direct Vite local
  try {
    const proxyEndpoint = isFreeKey ? "/api/deepl-free/translate" : "/api/deepl-pro/translate";
    const proxyRes = await fetch(proxyEndpoint, {
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

    if (proxyRes.ok) {
      const data = await proxyRes.json();
      const translated = data.translations?.[0]?.text || "";
      if (translated && typeof window !== "undefined") {
        sessionStorage.setItem(cacheKey, translated);
      }
      return { success: true, translatedText: translated };
    }
  } catch {
    // Repli direct
  }

  // 3. Repli Direct API DeepL
  try {
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
