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

  // 1. Si on est en local/Vite, utiliser le proxy /api/openwa en priorité pour contourner le CORS navigateur
  if (typeof window !== "undefined") {
    urls.push("/api/openwa");
  }

  // 2. URL directe configurée
  if (!urls.includes(cleaned)) {
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
export const sendOpenWaMessage = async (
  recipientPhone: string,
  messageText: string,
  overrideConfig?: Partial<AppSettings>
): Promise<{ success: boolean; messageId?: string; error?: string; details?: any }> => {
  const currentSettings = { ...getAppSettings(), ...overrideConfig };
  const rawUrl = (currentSettings.openwa_url || "http://185.197.249.4:2785").trim().replace(/\/+$/, "");
  const session = (currentSettings.openwa_session || "default").trim();
  const apiKey = (currentSettings.openwa_api_key || "").trim();

  const chatId = formatWhatsAppChatId(recipientPhone);
  if (!chatId || chatId === "@c.us") {
    return { success: false, error: "Numéro de téléphone invalide." };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept": "application/json, text/plain, */*",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
    headers["api_key"] = apiKey;
  }

  const baseUrls = getTargetBaseUrls(rawUrl);
  let lastError = "Impossible de joindre le serveur OpenWA.";
  let receivedServerResponse = false;

  for (const base of baseUrls) {
    const attempts = [
      // 1. Format OpenWA /session/sendText avec args
      {
        url: `${base}/${encodeURIComponent(session)}/sendText`,
        payload: { args: { to: chatId, content: messageText } },
      },
      // 2. Format OpenWA /session/sendText plat
      {
        url: `${base}/${encodeURIComponent(session)}/sendText`,
        payload: { to: chatId, content: messageText, chatId: chatId, text: messageText },
      },
      // 3. Format OpenWA /sendText direct avec session
      {
        url: `${base}/sendText`,
        payload: { args: { to: chatId, content: messageText }, session: session, to: chatId, content: messageText, chatId: chatId, text: messageText },
      },
      // 4. Format OpenWA /session/sendMessage
      {
        url: `${base}/${encodeURIComponent(session)}/sendMessage`,
        payload: { to: chatId, message: messageText, text: messageText, content: messageText },
      },
      // 5. Format OpenWA /api/sendText
      {
        url: `${base}/api/sendText`,
        payload: { session: session, to: chatId, content: messageText },
      },
    ];

    for (const attempt of attempts) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 12000);

        const response = await fetch(attempt.url, {
          method: "POST",
          headers,
          body: JSON.stringify(attempt.payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json().catch(() => ({ status: "sent" }));
          return { success: true, details: data };
        } else {
          receivedServerResponse = true;
          const errorText = await response.text().catch(() => response.statusText);
          lastError = `Erreur OpenWA (HTTP ${response.status}) sur ${attempt.url} : ${errorText || response.statusText}`;
        }
      } catch (err: any) {
        if (!receivedServerResponse) {
          if (err.name === "AbortError") {
            lastError = "Délai d'attente dépassé (Timeout 12s) lors de l'envoi WhatsApp.";
          } else {
            lastError = err.message || String(err);
          }
        }
      }
    }

    // Si le proxy local a répondu (même avec une erreur HTTP 4xx/5xx explicite), ne pas écraser par un CORS TypeError
    if (receivedServerResponse) {
      break;
    }
  }

  return { success: false, error: lastError };
};

/**
 * Vérifie l'état de connexion de la session OpenWA sur le serveur VPS
 */
export const checkOpenWaSessionStatus = async (
  overrideConfig?: Partial<AppSettings>
): Promise<{ ok: boolean; status: string; raw?: any; error?: string; sessions?: string[] }> => {
  const currentSettings = { ...getAppSettings(), ...overrideConfig };
  const rawUrl = (currentSettings.openwa_url || "http://185.197.249.4:2785").trim().replace(/\/+$/, "");
  const session = (currentSettings.openwa_session || "default").trim();
  const apiKey = (currentSettings.openwa_api_key || "").trim();

  const headers: Record<string, string> = {
    "Accept": "application/json, text/html, */*",
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
    headers["api_key"] = apiKey;
  }

  const baseUrls = getTargetBaseUrls(rawUrl);

  for (const base of baseUrls) {
    const endpointsToTest = [
      `${base}/sessions`,
      `${base}/${encodeURIComponent(session)}/getConnectionState`,
      `${base}/${encodeURIComponent(session)}/getMe`,
      `${base}/getConnectionState`,
      `${base}/`,
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
          let detectedSessions: string[] = [];

          if (contentType.includes("application/json")) {
            data = await res.json().catch(() => ({ status: "online" }));
            if (Array.isArray(data)) {
              detectedSessions = data.map((s: any) => typeof s === "string" ? s : s.id || s.name || s.session).filter(Boolean);
            } else if (data && typeof data === "object") {
              if (Array.isArray(data.sessions)) {
                detectedSessions = data.sessions.map((s: any) => typeof s === "string" ? s : s.id || s.name).filter(Boolean);
              }
            }
          }

          let statusMsg = "Serveur VPS Joint & Connecté";
          if (detectedSessions.length > 0) {
            statusMsg += ` (Sessions actives: ${detectedSessions.join(", ")})`;
          }

          return {
            ok: true,
            status: statusMsg,
            raw: data,
            sessions: detectedSessions,
          };
        }
      } catch (err: any) {
        // Continuer sur le point suivant
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
  const adminPhone = settings.openwa_admin_phone || settings.whatsapp_phone || "212752850156";
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
