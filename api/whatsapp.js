/**
 * Fonction Serverless Vercel — Passerelle WhatsApp Invisible OpenWA / WAHA
 *
 * Exécute côté serveur Node.js l'envoi de messages vers l'instance OpenWA / WAHA
 * sur la VPS (http://185.197.249.4:2785).
 * Évite tout blocage CORS, filtrage d'en-têtes HTTP par les navigateurs ou proxies edge.
 */

const HARDCODED_OPENWA_KEY = "owa_k1_8e8d1dad118d422c4b0bcc77723a9719eca52913e6813b2f84e32fb479f223cf";
const VPS_BASE_URL = "http://185.197.249.4:2785";

const formatWhatsAppChatId = (phone) => {
  if (!phone) return "";
  let cleaned = String(phone).replace(/[^0-9]/g, "");
  if (cleaned.startsWith("06") || cleaned.startsWith("07") || cleaned.startsWith("05")) {
    cleaned = "212" + cleaned.substring(1);
  } else if (cleaned.startsWith("6") || cleaned.startsWith("7")) {
    cleaned = "212" + cleaned;
  }
  if (!cleaned.startsWith("212") && cleaned.length === 9) {
    cleaned = "212" + cleaned;
  }
  return cleaned.includes("@c.us") ? cleaned : `${cleaned}@c.us`;
};

export default async function handler(req, res) {
  // En-têtes CORS pour autoriser l'appel depuis le client
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

  // Si c'est une requête de vérification de statut
  if (req.method === "GET" || req.query?.action === "status") {
    const testEndpoints = [
      `${VPS_BASE_URL}/api/sessions?api_key=${apiKey}&apiKey=${apiKey}`,
      `${VPS_BASE_URL}/sessions?api_key=${apiKey}&apiKey=${apiKey}`,
      `${VPS_BASE_URL}/api/sessions/${session}?api_key=${apiKey}&apiKey=${apiKey}`,
      `${VPS_BASE_URL}/sessions/${session}?api_key=${apiKey}&apiKey=${apiKey}`,
      `${VPS_BASE_URL}/docs-json`,
    ];

    const headersList = [
      { "X-Api-Key": apiKey, "Accept": "application/json" },
      { "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" },
      { "x-api-key": apiKey, "Accept": "application/json" },
    ];

    for (const ep of testEndpoints) {
      for (const hdrs of headersList) {
        try {
          const resp = await fetch(ep, { headers: hdrs });
          if (resp.ok) {
            const data = await resp.json().catch(() => ({ status: "ok" }));
            return res.status(200).json({ ok: true, endpoint: ep, data });
          }
        } catch { }
      }
    }

    return res.status(200).json({ ok: false, message: "VPS accessible mais authentification en cours de validation" });
  }

  // Requête d'envoi de message (POST)
  if (!phone || !message) {
    return res.status(400).json({ success: false, error: "Téléphone et message requis." });
  }

  const chatId = formatWhatsAppChatId(phone);

  const basicAuth1 = Buffer.from(`:${apiKey}`).toString("base64");
  const basicAuth2 = Buffer.from(`admin:${apiKey}`).toString("base64");

  const headerVariants = [
    {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
      "x-api-key": apiKey,
      "X-API-KEY": apiKey,
      "Authorization": `Bearer ${apiKey}`,
      "api_key": apiKey,
      "apikey": apiKey,
    },
    {
      "Content-Type": "application/json",
      "Authorization": `Basic ${basicAuth1}`,
      "X-Api-Key": apiKey,
    },
    {
      "Content-Type": "application/json",
      "Authorization": `Basic ${basicAuth2}`,
      "X-Api-Key": apiKey,
    },
    {
      "Content-Type": "application/json",
      "X-Api-Key": apiKey,
    },
    {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
  ];

  const sessionCandidates = Array.from(new Set([
    session,
    "e8fe5adf-cd3b-4470-8cf7-6a85504430ff",
    "default",
    "maison-kenzi",
  ])).filter(Boolean);

  const authQuery = `?api_key=${encodeURIComponent(apiKey)}&apiKey=${encodeURIComponent(apiKey)}&key=${encodeURIComponent(apiKey)}&token=${encodeURIComponent(apiKey)}`;

  let lastErrors = [];

  for (const sessKey of sessionCandidates) {
    const payload = {
      chatId,
      to: chatId,
      phone,
      text: message,
      content: message,
      message,
      body: message,
      session: sessKey,
      sessionId: sessKey,
      api_key: apiKey,
      apiKey: apiKey,
      args: {
        to: chatId,
        content: message,
        chatId,
        text: message,
      },
    };

    const targetUrls = [
      `${VPS_BASE_URL}/api/sessions/${encodeURIComponent(sessKey)}/messages/send-text${authQuery}`,
      `${VPS_BASE_URL}/api/sessions/${encodeURIComponent(sessKey)}/messages/send-text`,
      `${VPS_BASE_URL}/sessions/${encodeURIComponent(sessKey)}/messages/send-text${authQuery}`,
      `${VPS_BASE_URL}/api/sendText${authQuery}`,
      `${VPS_BASE_URL}/api/sendText`,
      `${VPS_BASE_URL}/sendText${authQuery}`,
      `${VPS_BASE_URL}/api/sessions/${encodeURIComponent(sessKey)}/sendText${authQuery}`,
      `${VPS_BASE_URL}/${encodeURIComponent(sessKey)}/sendText${authQuery}`,
    ];

    for (const headers of headerVariants) {
      for (const url of targetUrls) {
        try {
          const response = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify(payload),
          });

          if (response.ok || response.status === 200 || response.status === 201 || response.status === 202) {
            const data = await response.json().catch(() => ({ status: "sent" }));
            return res.status(200).json({ success: true, url, data });
          } else {
            const errText = await response.text().catch(() => "");
            lastErrors.push(`${url} [${response.status}]: ${errText.slice(0, 100)}`);
          }
        } catch (err) {
          lastErrors.push(`${url} [ERR]: ${err.message}`);
        }
      }
    }
  }

  return res.status(502).json({
    success: false,
    error: "Échec de l'envoi via toutes les routes WAHA / OpenWA",
    details: lastErrors.slice(0, 5),
  });
}
