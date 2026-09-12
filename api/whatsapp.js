/**
 * Fonction Serverless Vercel — Passerelle WhatsApp Invisible OpenWA / WAHA
 *
 * Exécute côté serveur Node.js l'envoi de messages vers l'instance OpenWA / WAHA
 * sur la VPS (http://185.197.249.4:2785).
 * Envoie des payloads DTO stricts (chatId, text) pour éliminer les erreurs 400 Bad Request.
 */

const HARDCODED_OPENWA_KEY = "owa_k1_8e8d1dad118d422c4b0bcc77723a9719eca52913e6813b2f84e32fb479f223cf";
const VPS_BASE_URL = "http://185.197.249.4:2785";

const formatWhatsAppChatId = (phone) => {
  if (!phone) return "";
  let cleaned = String(phone).replace(/[^0-9]/g, "");
  if (cleaned.startsWith("00")) {
    cleaned = cleaned.substring(2);
  }
  if ((cleaned.startsWith("06") || cleaned.startsWith("07") || cleaned.startsWith("05")) && cleaned.length === 10) {
    cleaned = "212" + cleaned.substring(1);
  } else if ((cleaned.startsWith("6") || cleaned.startsWith("7")) && cleaned.length === 9) {
    cleaned = "212" + cleaned;
  }
  return cleaned.includes("@c.us") ? cleaned : `${cleaned}@c.us`;
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Api-Key");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const apiKey = (req.body?.apiKey || req.query?.apiKey || HARDCODED_OPENWA_KEY).trim();
  const session = (req.body?.session || req.query?.session || "e8fe5adf-cd3b-4470-8cf7-6a85504430ff").trim();
  const phone = req.body?.phone || req.query?.phone;
  const message = req.body?.message || req.query?.message;

  // Endpoint de santé / diagnostic
  if (req.method === "GET" || req.query?.action === "status") {
    return res.status(200).json({ ok: true, session, status: "ready" });
  }

  if (!phone || !message) {
    return res.status(400).json({ success: false, error: "Numéro de téléphone et message requis." });
  }

  const chatId = formatWhatsAppChatId(phone);
  const rawCleanPhone = chatId.replace("@c.us", "");

  const sessionCandidates = Array.from(new Set([
    session,
    "e8fe5adf-cd3b-4470-8cf7-6a85504430ff",
    "default",
    "maison-kenzi",
  ])).filter(Boolean);

  const authQuery = `?api_key=${encodeURIComponent(apiKey)}&apiKey=${encodeURIComponent(apiKey)}&key=${encodeURIComponent(apiKey)}`;

  const headersVariants = [
    {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "X-API-KEY": apiKey,
      "Authorization": `Bearer ${apiKey}`,
    },
    {
      "Content-Type": "application/json",
      "api_key": apiKey,
    },
  ];

  let lastErrors = [];

  for (const sessKey of sessionCandidates) {
    // Différents schémas DTO stricts supportés par WAHA / OpenWA
    const payloadVariants = [
      // 1. Standard WAHA pur (chatId + text)
      { chatId, text: message },
      // 2. Standard WAHA avec session explicite
      { chatId, text: message, session: sessKey },
      // 3. Format phone brut
      { phone: rawCleanPhone, message },
      // 4. Format to + body
      { to: chatId, body: message },
      // 5. Format to + content
      { to: chatId, content: message },
    ];

    const targetUrlTemplates = [
      `${VPS_BASE_URL}/api/sessions/${encodeURIComponent(sessKey)}/messages/send-text${authQuery}`,
      `${VPS_BASE_URL}/api/sessions/${encodeURIComponent(sessKey)}/messages/send-text`,
      `${VPS_BASE_URL}/api/sendText${authQuery}`,
      `${VPS_BASE_URL}/api/sendText`,
      `${VPS_BASE_URL}/sessions/${encodeURIComponent(sessKey)}/messages/send-text${authQuery}`,
      `${VPS_BASE_URL}/api/sessions/${encodeURIComponent(sessKey)}/sendText${authQuery}`,
      `${VPS_BASE_URL}/sendText${authQuery}`,
    ];

    for (const payload of payloadVariants) {
      for (const headers of headersVariants) {
        for (const url of targetUrlTemplates) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(url, {
              method: "POST",
              headers,
              body: JSON.stringify(payload),
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok || response.status === 200 || response.status === 201 || response.status === 202) {
              const data = await response.json().catch(() => ({ status: "sent" }));
              console.info("[WhatsApp Serverless VPS Succès]", url, data);
              return res.status(200).json({ success: true, url, data });
            } else {
              const errText = await response.text().catch(() => "");
              lastErrors.push(`${url} [${response.status}]: ${errText.slice(0, 150)}`);
            }
          } catch (err) {
            lastErrors.push(`${url} [ERR]: ${err.message}`);
          }
        }
      }
    }
  }

  return res.status(502).json({
    success: false,
    error: "Échec de l'envoi après test de tous les formats DTO",
    details: lastErrors.slice(0, 5),
  });
}
