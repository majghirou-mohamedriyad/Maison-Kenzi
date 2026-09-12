/**
 * Fonction Serverless Vercel — Passerelle Sécurisée DeepL API
 *
 * Relaye les requêtes de traduction vers l'API DeepL officielle :
 * - api-free.deepl.com (pour les clés gratuites se terminant par ':fx')
 * - api.deepl.com (pour les clés professionnelles)
 *
 * Élimine les restrictions CORS et protège les clés d'API.
 */

const OFFICIAL_DEEPL_KEY = "77993c1b-141d-4362-b6d2-4eaae702d6d5:fx";

export default async function handler(req, res) {
  // En-têtes CORS universels
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Api-Key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const apiKey = (
    req.body?.apiKey ||
    req.headers["x-api-key"] ||
    req.query?.apiKey ||
    process.env.DEEPL_API_KEY ||
    OFFICIAL_DEEPL_KEY
  ).trim();

  // Test de diagnostic / Quota de la clé DeepL
  if (req.method === "GET" || req.query?.action === "usage" || req.body?.action === "usage") {
    if (!apiKey) {
      return res.status(400).json({ ok: false, error: "Clé API DeepL manquante." });
    }

    const isFreeKey = apiKey.endsWith(":fx");
    const baseUrl = isFreeKey ? "https://api-free.deepl.com/v2" : "https://api.deepl.com/v2";

    try {
      const usageRes = await fetch(`${baseUrl}/usage`, {
        headers: {
          Authorization: `DeepL-Auth-Key ${apiKey}`,
        },
      });

      if (!usageRes.ok) {
        const errText = await usageRes.text();
        return res.status(usageRes.status).json({
          ok: false,
          error: `Erreur d'authentification DeepL (${usageRes.status}): ${errText}`,
        });
      }

      const usageData = await usageRes.json();
      return res.status(200).json({
        ok: true,
        isFreeKey,
        character_count: usageData.character_count || 0,
        character_limit: usageData.character_limit || 500000,
      });
    } catch (err) {
      return res.status(500).json({
        ok: false,
        error: `Impossible de contacter DeepL: ${err.message || String(err)}`,
      });
    }
  }

  // Traitement de la traduction POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée. Utilisez POST." });
  }

  const text = req.body?.text;
  const targetLang = (req.body?.target_lang || "EN").toUpperCase();
  const sourceLang = req.body?.source_lang ? req.body.source_lang.toUpperCase() : undefined;

  if (!apiKey) {
    return res.status(400).json({
      success: false,
      error: "Clé API DeepL non configurée. Veuillez renseigner votre clé dans Paramètres Admin.",
    });
  }

  if (!text) {
    return res.status(400).json({
      success: false,
      error: "Le texte à traduire est requis.",
    });
  }

  const isFreeKey = apiKey.endsWith(":fx");
  const endpoint = isFreeKey
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";

  const textsToTranslate = Array.isArray(text) ? text : [text];

  try {
    const payload = {
      text: textsToTranslate,
      target_lang: targetLang === "EN" ? "EN-US" : targetLang,
    };
    if (sourceLang) {
      payload.source_lang = sourceLang;
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return res.status(response.status).json({
        success: false,
        error: `Erreur DeepL (${response.status}): ${errorBody}`,
      });
    }

    const data = await response.json();
    const translations = (data.translations || []).map((t) => t.text);

    return res.status(200).json({
      success: true,
      translations,
      translatedText: Array.isArray(text) ? translations : translations[0] || "",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: `Erreur serveur lors de la traduction DeepL: ${error.message || String(error)}`,
    });
  }
}
