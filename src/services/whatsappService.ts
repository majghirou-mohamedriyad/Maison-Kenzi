/**
 * Service de Messagerie WhatsApp OpenWA (VPS) — Maison Kenzi
 *
 * Connecteur HTTP pour l'instance OpenWA hébergée sur la VPS.
 * Gère le formatage automatique des numéros marocains (+212 / 06 / 07),
 * les modèles de messages éditoriaux de prestige (zéro emoji),
 * les confirmations automatiques de commande, les alertes d'administration
 * et les notifications de suivi en direct.
 */

import { getAppSettings, AppSettings } from "@/hooks/useAppSettings";

/**
 * Nettoie et formate un numéro de téléphone au standard international WhatsApp (@c.us)
 * Prend en charge les numéros marocains (06..., 07..., 212..., +212...).
 */
export const formatWhatsAppChatId = (phone: string): string => {
  if (!phone) return "";

  // Suppression de tous les caractères non numériques
  let cleaned = phone.replace(/[^0-9]/g, "");

  // Format marocain national débutant par 06 ou 07 ou 05
  if (cleaned.startsWith("06") || cleaned.startsWith("07") || cleaned.startsWith("05")) {
    cleaned = "212" + cleaned.substring(1);
  } else if (cleaned.startsWith("6") || cleaned.startsWith("7")) {
    cleaned = "212" + cleaned;
  }

  // Si le numéro ne comporte pas encore l'indicatif international
  if (!cleaned.startsWith("212") && cleaned.length === 9) {
    cleaned = "212" + cleaned;
  }

  return cleaned.includes("@c.us") ? cleaned : `${cleaned}@c.us`;
};

/**
 * Extrait le numéro brut nettoyé sans suffixe @c.us
 */
export const getCleanPhoneNumber = (phone: string): string => {
  return formatWhatsAppChatId(phone).replace("@c.us", "");
};

/**
 * Modèle de message : Confirmation de commande client
 */
export const buildOrderConfirmationMessage = (order: {
  order_number: string;
  customer_name: string;
  total_amount: number;
  shipping_address?: string;
  shipping_city?: string;
  items?: Array<{ name: string; quantity: number; price?: number; size?: string }>;
}): string => {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://maisonkenzi.ma";
  const trackingUrl = `${origin}/suivi-commande?code=${order.order_number}`;

  let itemsList = "";
  if (order.items && order.items.length > 0) {
    itemsList = order.items
      .map((item) => `- ${item.quantity}x ${item.name}${item.size ? ` (${item.size})` : ""}`)
      .join("\n");
  }

  return `*MAISON KENZI*
Haute Parfumerie & Objets d'Exception

Bonjour ${order.customer_name || "Cher(e) Client(e)"},

Nous avons le plaisir de vous confirmer la bonne reception de votre commande aupres de Maison Kenzi.

*Reference de Commande :* ${order.order_number}
*Montant Total :* ${order.total_amount} MAD
*Reglement :* Paiement a la livraison (especes a reception)

${itemsList ? `*Articles commandes :*\n${itemsList}\n` : ""}${order.shipping_city ? `*Destination :* ${order.shipping_city}${order.shipping_address ? `, ${order.shipping_address}` : ""}\n` : ""}
Vous pouvez suivre la preparation et l'acheminement de votre colis en temps reel a l'adresse suivante :
${trackingUrl}

Notre service client et notre conciergerie restent a votre entiere disposition pour toute question.

Maison Kenzi — L'Art du Parfum & de la Distinction`;
};

/**
 * Modèle de message : Mise à jour du statut de commande
 */
export const buildOrderStatusMessage = (order: {
  order_number: string;
  customer_name: string;
  status: string;
  shipping_city?: string;
}): string => {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://maisonkenzi.ma";
  const trackingUrl = `${origin}/suivi-commande?code=${order.order_number}`;

  let statusLabel = "Mise a jour de votre commande";
  let statusDetail = "Votre commande est actuellement en cours de traitement.";

  if (order.status === "confirmee") {
    statusLabel = "Commande Confirmee & En Preparation";
    statusDetail = "Votre colis a ete valide par notre atelier. Nos artisans preparent minutieusement vos flacons et votre conditionnement d'origine sous blister.";
  } else if (order.status === "livree") {
    statusLabel = "Commande Livree avec Succes";
    statusDetail = "Votre colis vous a ete remis en main propre. Nous vous remercions chaleureusement pour votre confiance et esperons que vos fragrances vous apporteront entiere satisfaction.";
  } else if (order.status === "annulee") {
    statusLabel = "Information concernant votre commande";
    statusDetail = "Votre commande a ete annulee. Si vous souhaitez des precisions, n'hesitez pas a contacter notre conciergerie.";
  }

  return `*MAISON KENZI*
Suivi de Commande

Bonjour ${order.customer_name || "Cher(e) Client(e)"},

*Statut actuel :* ${statusLabel}
*Reference :* ${order.order_number}

${statusDetail}

Suivre votre commande en temps reel :
${trackingUrl}

Maison Kenzi vous remercie pour votre fidelite.`;
};

/**
 * Modèle de message : Alerte nouvelle commande pour l'Administrateur
 */
export const buildAdminOrderAlertMessage = (order: {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  shipping_city?: string;
  shipping_address?: string;
  total_amount: number;
  items?: Array<{ name: string; quantity: number; price?: number; size?: string }>;
}): string => {
  let itemsList = "";
  if (order.items && order.items.length > 0) {
    itemsList = order.items
      .map((item) => `- ${item.quantity}x ${item.name}${item.size ? ` (${item.size})` : ""}`)
      .join("\n");
  }

  return `*NOUVELLE COMMANDE RECUE — MAISON KENZI*

Reference : ${order.order_number}
Montant : ${order.total_amount} MAD
Client : ${order.customer_name}
Telephone : ${order.customer_phone}
Ville : ${order.shipping_city || "Non specifiee"}
Adresse : ${order.shipping_address || "Non specifiee"}

*Articles commandes :*
${itemsList || "Consulter le tableau d'administration"}

Mode de paiement : Paiement a la livraison`;
};

/**
 * Envoie un message texte via l'API OpenWA sur la VPS
 */
/**
 * Obtient la liste des URL de base à tester (proxy local + direct)
 */
const getTargetBaseUrls = (rawUrl: string): string[] => {
  const cleaned = (rawUrl || "http://185.197.249.4:2785").trim().replace(/\/+$/, "");
  const urls: string[] = [];

  // En environnement navigateur, le proxy /api/openwa élimine tout blocage CORS
  if (typeof window !== "undefined") {
    urls.push("/api/openwa");
  } else {
    urls.push(cleaned);
  }

  return urls;
};

/**
 * Envoie un message texte via l'API OpenWA sur la VPS
 */
/**
 * Envoie un message texte via l'API OpenWA sur la VPS
 */
const HARDCODED_OPENWA_KEY = "owa_k1_8e8d1dad118d422c4b0bcc77723a9719eca52913e6813b2f84e32fb479f223cf";

const getAuthHeadersVariants = (key: string): Array<Record<string, string>> => {
  const basic1 = typeof btoa !== "undefined" ? btoa(`:${key}`) : "";
  const basic2 = typeof btoa !== "undefined" ? btoa(`admin:${key}`) : "";
  const basic3 = typeof btoa !== "undefined" ? btoa(`${key}:`) : "";
  const basic4 = typeof btoa !== "undefined" ? btoa(`${key}:${key}`) : "";

  return [
    {
      "Content-Type": "application/json",
      "Accept": "application/json, text/plain, */*",
      "X-Api-Key": key,
      "x-api-key": key,
      "X-API-KEY": key,
      "Authorization": `Bearer ${key}`,
      "api_key": key,
      "api-key": key,
      "apikey": key,
      "key": key,
      "secret-key": key,
    },
    {
      "Content-Type": "application/json",
      "Accept": "application/json, text/plain, */*",
      "Authorization": `Basic ${basic1}`,
      "x-api-key": key,
      "api_key": key,
    },
    {
      "Content-Type": "application/json",
      "Accept": "application/json, text/plain, */*",
      "Authorization": `Basic ${basic2}`,
      "x-api-key": key,
      "api_key": key,
    },
    {
      "Content-Type": "application/json",
      "Accept": "application/json, text/plain, */*",
      "Authorization": `Basic ${basic3}`,
      "x-api-key": key,
      "api_key": key,
    },
    {
      "Content-Type": "application/json",
      "Accept": "application/json, text/plain, */*",
      "Authorization": `Basic ${basic4}`,
      "x-api-key": key,
      "api_key": key,
    },
  ];
};

export const sendOpenWaMessage = async (
  recipientPhone: string,
  messageText: string,
  overrideConfig?: Partial<AppSettings>
): Promise<{ success: boolean; messageId?: string; error?: string; details?: any }> => {
  const currentSettings = { ...getAppSettings(), ...overrideConfig };
  const rawUrl = (currentSettings.openwa_url || "http://185.197.249.4:2785").trim().replace(/\/+$/, "");
  const session = (currentSettings.openwa_session || "e8fe5adf-cd3b-4470-8cf7-6a85504430ff").trim();
  const apiKey = (currentSettings.openwa_api_key && currentSettings.openwa_api_key.trim().length > 5)
    ? currentSettings.openwa_api_key.trim()
    : HARDCODED_OPENWA_KEY;

  const chatId = formatWhatsAppChatId(recipientPhone);
  if (!chatId || chatId === "@c.us") {
    return { success: false, error: "Numéro de téléphone invalide." };
  }

  // 0. Tentative prioritaire via la fonction Serverless Vercel /api/whatsapp
  try {
    const serverlessRes = await fetch("/api/whatsapp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: recipientPhone,
        message: messageText,
        session,
        apiKey,
      }),
    });

    if (serverlessRes.ok) {
      const sData = await serverlessRes.json();
      if (sData.success) {
        console.info("[WhatsApp Serverless Succès]", sData);
        return { success: true, messageId: sData.data?.messageId || "sent", details: sData };
      }
    }
  } catch {
    // Si la fonction serverless n'est pas disponible (ex: dev local pur), continuer avec le relai direct
  }

  const headerVariants = getAuthHeadersVariants(apiKey);
  const authQuery = apiKey
    ? `?api_key=${encodeURIComponent(apiKey)}&apiKey=${encodeURIComponent(apiKey)}&key=${encodeURIComponent(apiKey)}&token=${encodeURIComponent(apiKey)}&secret=${encodeURIComponent(apiKey)}`
    : "";
  const baseUrls = getTargetBaseUrls(rawUrl);
  let lastError = "Impossible de joindre le serveur OpenWA.";

  // 1. Récupération dynamique des sessions actives
  let discoveredSessionKeys: string[] = [];
  for (const base of baseUrls) {
    for (const headers of headerVariants.slice(0, 2)) {
      for (const ep of [`${base}/api/sessions${authQuery}`, `${base}/sessions${authQuery}`, `${base}/api/sessions`, `${base}/sessions`]) {
        try {
          const sessRes = await fetch(ep, { headers: { ...headers, "Accept": "application/json" } });
          if (sessRes.ok) {
            const sessList = await sessRes.json();
            if (Array.isArray(sessList)) {
              for (const s of sessList) {
                if (typeof s === "string") discoveredSessionKeys.push(s);
                if (s && typeof s === "object") {
                  if (s.id) discoveredSessionKeys.push(s.id);
                  if (s.sessionId) discoveredSessionKeys.push(s.sessionId);
                  if (s.name) discoveredSessionKeys.push(s.name);
                  if (s.session) discoveredSessionKeys.push(s.session);
                }
              }
            }
          }
        } catch { }
      }
    }
  }

  // Candidats d'identifiant de session
  const sessionCandidates = Array.from(new Set([
    session,
    ...discoveredSessionKeys,
    "e8fe5adf-cd3b-4470-8cf7-6a85504430ff",
    "default",
    "maison-kenzi",
  ])).filter(Boolean);

  for (const base of baseUrls) {
    for (const sessKey of sessionCandidates) {
      const fullPayload = {
        chatId: chatId,
        to: chatId,
        phone: recipientPhone,
        text: messageText,
        content: messageText,
        message: messageText,
        body: messageText,
        session: sessKey,
        sessionId: sessKey,
        api_key: apiKey,
        apiKey: apiKey,
        key: apiKey,
        token: apiKey,
        secret: apiKey,
        args: {
          to: chatId,
          content: messageText,
          chatId: chatId,
          text: messageText,
        },
      };

      const attempts = [
        // 1. Route WAHA / OpenWA REST v0.23+
        {
          url: `${base}/api/sessions/${encodeURIComponent(sessKey)}/messages/send-text${authQuery}`,
          payload: fullPayload,
          desc: `POST /api/sessions/${sessKey}/messages/send-text`,
        },
        // 2. Variante sans /api
        {
          url: `${base}/sessions/${encodeURIComponent(sessKey)}/messages/send-text${authQuery}`,
          payload: fullPayload,
          desc: `POST /sessions/${sessKey}/messages/send-text`,
        },
        // 3. Format direct /api/sendText
        {
          url: `${base}/api/sendText${authQuery}`,
          payload: fullPayload,
          desc: `POST /api/sendText`,
        },
        {
          url: `${base}/sendText${authQuery}`,
          payload: fullPayload,
          desc: `POST /sendText`,
        },
        // 4. Format session direct /api/sessions/:id/sendText
        {
          url: `${base}/api/sessions/${encodeURIComponent(sessKey)}/sendText${authQuery}`,
          payload: fullPayload,
          desc: `POST /api/sessions/${sessKey}/sendText`,
        },
        {
          url: `${base}/${encodeURIComponent(sessKey)}/sendText${authQuery}`,
          payload: fullPayload,
          desc: `POST /${sessKey}/sendText`,
        },
        // 5. Format sans query param mais avec headers
        {
          url: `${base}/api/sessions/${encodeURIComponent(sessKey)}/messages/send-text`,
          payload: fullPayload,
          desc: `POST /api/sessions/${sessKey}/messages/send-text (headers)`,
        },
        {
          url: `${base}/api/sendText`,
          payload: fullPayload,
          desc: `POST /api/sendText (headers)`,
        },
      ];

      for (const headers of headerVariants) {
        for (const attempt of attempts) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(attempt.url, {
              method: "POST",
              headers,
              body: JSON.stringify(attempt.payload),
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok || response.status === 201 || response.status === 200 || response.status === 202) {
              const data = await response.json().catch(() => ({ status: "sent" }));
              console.info("[OpenWA Succès] Message délivré via:", attempt.url, data);
              return { success: true, messageId: data.messageId, details: data };
            } else if (response.status === 401 || response.status === 403) {
              const errorJson = await response.json().catch(() => null);
              lastError = `Erreur d'authentification (${response.status}) sur ${attempt.desc} : ${errorJson?.message || ""}`;
              // Ne pas abort le loop, continuer d'essayer les autres variantes d'en-têtes / routes
            } else {
              const errorText = await response.text().catch(() => response.statusText);
              lastError = `Erreur OpenWA (${response.status}) sur ${attempt.desc} : ${errorText || response.statusText}`;
            }
          } catch (err: any) {
            if (err.name === "AbortError") {
              lastError = "Délai d'attente dépassé (Timeout 10s) lors de l'envoi WhatsApp.";
            } else {
              lastError = err.message || String(err);
            }
          }
        }
      }
    }
  }

  return { success: false, error: lastError };
};

/**
 * Vérifie l'état de connexion de la session OpenWA sur le serveur VPS et découvre les routes
 */
export const checkOpenWaSessionStatus = async (
  overrideConfig?: Partial<AppSettings>
): Promise<{
  ok: boolean;
  status: string;
  raw?: any;
  error?: string;
  sessions?: string[];
  suggestedRoutes?: string[];
}> => {
  const currentSettings = { ...getAppSettings(), ...overrideConfig };
  const rawUrl = (currentSettings.openwa_url || "http://185.197.249.4:2785").trim().replace(/\/+$/, "");
  const session = (currentSettings.openwa_session || "default").trim();
  const apiKey = (currentSettings.openwa_api_key || "owa_k1_8e8d1dad118d422c4b0bcc77723a9719eca52913e6813b2f84e32fb479f223cf").trim();

  const headers: Record<string, string> = {
    "Accept": "application/json, text/html, */*",
  };
  if (apiKey) {
    headers["X-Api-Key"] = apiKey;
    headers["x-api-key"] = apiKey;
    headers["X-API-Key"] = apiKey;
    headers["Authorization"] = `Bearer ${apiKey}`;
    headers["api_key"] = apiKey;
    headers["apikey"] = apiKey;
  }

  const authQuery = apiKey ? `?api_key=${encodeURIComponent(apiKey)}&apiKey=${encodeURIComponent(apiKey)}` : "";
  const baseUrls = getTargetBaseUrls(rawUrl);

  for (const base of baseUrls) {
    // 1. Tenter la découverte OpenAPI / Swagger
    const swaggerEndpoints = [
      `${base}/docs-json${authQuery}`,
      `${base}/swagger/json${authQuery}`,
      `${base}/api-docs/swagger.json${authQuery}`,
      `${base}/openapi.json${authQuery}`,
      `${base}/swagger.json${authQuery}`,
      `${base}/api/docs${authQuery}`,
      `${base}/docs/openapi.json${authQuery}`,
    ];

    for (const swEndpoint of swaggerEndpoints) {
      try {
        const swRes = await fetch(swEndpoint, { headers: { ...headers, "Accept": "application/json" } });
        if (swRes.ok) {
          const swData = await swRes.json();
          const paths = swData.paths ? Object.keys(swData.paths) : [];
          console.info("[OpenWA Discovery] Swagger paths:", paths);
          return {
            ok: true,
            status: `Swagger OpenAPI Détecté (${paths.length} routes disponibles)`,
            raw: swData,
            suggestedRoutes: paths,
          };
        }
      } catch { }
    }

    // 2. Tester les endpoints JSON de sessions
    const sessionEndpoints = [
      `${base}/api/sessions${authQuery}`,
      `${base}/sessions${authQuery}`,
      `${base}/api/sessions/e8fe5adf-cd3b-4470-8cf7-6a85504430ff${authQuery}`,
      `${base}/sessions/e8fe5adf-cd3b-4470-8cf7-6a85504430ff${authQuery}`,
      `${base}/api/sessions/maison-kenzi${authQuery}`,
      `${base}/sessions/maison-kenzi${authQuery}`,
    ];

    for (const sEndpoint of sessionEndpoints) {
      try {
        const sRes = await fetch(sEndpoint, { headers: { ...headers, "Accept": "application/json" } });
        const contentType = sRes.headers.get("content-type") || "";
        if (sRes.ok && contentType.includes("application/json")) {
          const data = await sRes.json();
          console.info("[OpenWA Discovery] Endpoint:", sEndpoint, "Data:", data);
          const detectedSessions: string[] = [];
          if (Array.isArray(data)) {
            data.forEach((item: any) => {
              if (typeof item === "string") detectedSessions.push(item);
              if (item && typeof item === "object") {
                if (item.id) detectedSessions.push(item.id);
                if (item.name) detectedSessions.push(item.name);
              }
            });
          }
          return {
            ok: true,
            status: `Session(s) active(s) : ${detectedSessions.join(", ") || "Connecté"}`,
            raw: data,
            sessions: detectedSessions,
          };
        }
      } catch { }
    }

    // 3. Tester les endpoints de status
    const endpointsToTest = [
      `${base}/sessions${authQuery}`,
      `${base}/${encodeURIComponent(session)}/getConnectionState${authQuery}`,
      `${base}/sessions/${encodeURIComponent(session)}/getConnectionState${authQuery}`,
      `${base}/${authQuery}`,
    ];

    for (const endpoint of endpointsToTest) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(endpoint, {
          method: "GET",
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const contentType = res.headers.get("content-type") || "";
          let data: any = { status: "online" };
          let detectedSessions: string[] = ["maison-kenzi", "e8fe5adf-cd3b-4470-8cf7-6a85504430ff"];

          if (contentType.includes("application/json")) {
            data = await res.json().catch(() => ({ status: "online" }));
            console.info("[OpenWA Discovery] JSON Response from", endpoint, data);
          }

          return {
            ok: true,
            status: `Serveur OpenWA Joint (${endpoint})`,
            raw: data,
            sessions: detectedSessions,
          };
        }
      } catch (err: any) {
        // Continuer
      }
    }
  }

  return {
    ok: false,
    status: "Inaccessible",
    error: `Impossible de contacter le serveur OpenWA sur ${rawUrl}. Assurez-vous que le conteneur Docker OpenWA est bien démarré sur le port 2785 de votre VPS.`,
  };
};

/**
 * Déclenche les notifications lors d'une nouvelle commande (Client + Administrateur)
 * Exécuté de manière asynchrone non-bloquante pour une fluidité absolue de la validation de commande.
 */
export const dispatchOrderCreatedWhatsAppNotifications = async (order: {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  shipping_address?: string;
  shipping_city?: string;
  items?: Array<{ name: string; quantity: number; price?: number; size?: string }>;
}) => {
  const settings = getAppSettings();

  // 1. Notification Client
  if (settings.openwa_auto_order_confirmation !== false && order.customer_phone) {
    const clientMsg = buildOrderConfirmationMessage(order);
    sendOpenWaMessage(order.customer_phone, clientMsg).catch((err) => {
      console.warn("Échec envoi WhatsApp client:", err);
    });
  }

  // 2. Notification Gérant Admin
  const adminPhone = settings.openwa_admin_phone || settings.whatsapp_phone || "212652535301";
  if (settings.openwa_admin_notification !== false && adminPhone) {
    const adminMsg = buildAdminOrderAlertMessage(order);
    sendOpenWaMessage(adminPhone, adminMsg).catch((err) => {
      console.warn("Échec envoi WhatsApp alerte admin:", err);
    });
  }
};

/**
 * Déclenche la notification lors de la mise à jour du statut d'une commande
 */
export const dispatchOrderStatusChangedWhatsAppNotification = async (order: {
  order_number: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  shipping_city?: string;
}) => {
  const settings = getAppSettings();

  if (settings.openwa_auto_status_update !== false && order.customer_phone) {
    const msg = buildOrderStatusMessage(order);
    return sendOpenWaMessage(order.customer_phone, msg);
  }

  return { success: false, error: "Notification de statut désactivée dans les paramètres." };
};
