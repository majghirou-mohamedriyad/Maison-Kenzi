/**
 * Service Métier des Promotions — Maison Kenzi
 *
 * Fonctions de gestion, calcul et validation des codes promotionnels et coupons.
 * Assure la communication avec Supabase et la persistance locale en cas de mode hors-ligne.
 * Conforme aux règles d'ingénierie : zéro emoji, commentaires en français.
 */

import { supabase } from "@/lib/supabase";
import type { PromoCode, PromoValidationResult, PromotionRedemption } from "@/types/promotions";

const STORAGE_KEY_PROMOS = "mk_custom_promotions";
const STORAGE_KEY_REDEMPTIONS = "mk_promotion_redemptions";

// Promotions par défaut pour initialiser le système
export const DEFAULT_PROMOTIONS: PromoCode[] = [
  {
    id: "promo-kenzi-10",
    code: "KENZI10",
    description: "Offre Privilège Maison Kenzi — 10% de remise dès 50 €",
    type: "percentage",
    value: 10,
    min_order_amount: 50,
    max_uses: null,
    current_uses: 0,
    once_per_customer: true,
    is_active: true,
    start_date: new Date().toISOString(),
    end_date: null,
    target_category: "all",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "promo-bienvenue-15",
    code: "BIENVENUE15",
    description: "Offre d'accueil Nouveaux Clients — 15% de remise dès 80 €",
    type: "percentage",
    value: 15,
    min_order_amount: 80,
    max_uses: 500,
    current_uses: 0,
    once_per_customer: true,
    is_active: true,
    start_date: new Date().toISOString(),
    end_date: null,
    target_category: "all",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "promo-livraison-gratuite",
    code: "LIVRAISON",
    description: "Frais de livraison offerts dès 60 € d'achat",
    type: "free_shipping",
    value: 0,
    min_order_amount: 60,
    max_uses: null,
    current_uses: 0,
    once_per_customer: false,
    is_active: true,
    start_date: new Date().toISOString(),
    end_date: null,
    target_category: "all",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Récupère les codes promotionnels locaux
 */
export const getLocalPromotions = (): PromoCode[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROMOS);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn("Erreur lecture promotions locales :", err);
  }
  return [];
};

/**
 * Sauvegarde les codes promotionnels dans le stockage local
 */
export const saveLocalPromotions = (promos: PromoCode[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_PROMOS, JSON.stringify(promos));
  } catch (err) {
    console.warn("Erreur écriture promotions locales :", err);
  }
};

/**
 * Récupère l'ensemble des promotions depuis Supabase (avec repli local automatique)
 */
export const fetchAllPromotions = async (): Promise<PromoCode[]> => {
  try {
    const { data, error } = await supabase
      .from("promotions")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      saveLocalPromotions(data as PromoCode[]);
      return data as PromoCode[];
    }
  } catch (err) {
    console.warn("Table promotions Supabase non disponible ou hors-ligne, utilisation du cache local :", err);
  }
  return getLocalPromotions();
};

/**
 * Supprime l'ensemble des promotions et rédemptions (Vider la table)
 */
export const clearAllPromotions = async (): Promise<{ success: boolean; error?: string }> => {
  saveLocalPromotions([]);
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY_REDEMPTIONS);
      localStorage.removeItem("mk_applied_promo_code");
    } catch {}
  }
  try {
    await supabase.from("promotion_redemptions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("promotions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    return { success: true };
  } catch (err: any) {
    console.warn("Erreur suppression globale Supabase :", err);
    return { success: false, error: err.message };
  }
};

/**
 * Crée ou met à jour une promotion
 */
export const upsertPromotion = async (promo: PromoCode): Promise<PromoCode> => {
  const currentPromos = getLocalPromotions();
  const index = currentPromos.findIndex((p) => p.id === promo.id || p.code.toUpperCase() === promo.code.toUpperCase());

  const updatedPromo: PromoCode = {
    ...promo,
    code: promo.code.trim().toUpperCase(),
    updated_at: new Date().toISOString(),
  };

  let updatedList: PromoCode[];
  if (index >= 0) {
    updatedList = [...currentPromos];
    updatedList[index] = updatedPromo;
  } else {
    updatedList = [updatedPromo, ...currentPromos];
  }
  saveLocalPromotions(updatedList);

  try {
    await supabase.from("promotions").upsert(updatedPromo);
  } catch (err) {
    console.warn("Erreur synchronisation Supabase promotion :", err);
  }

  return updatedPromo;
};

/**
 * Supprime une promotion
 */
export const deletePromotion = async (id: string): Promise<void> => {
  const currentPromos = getLocalPromotions();
  const filtered = currentPromos.filter((p) => p.id !== id);
  saveLocalPromotions(filtered);

  try {
    await supabase.from("promotions").delete().eq("id", id);
  } catch (err) {
    console.warn("Erreur suppression promotion Supabase :", err);
  }
};

/**
 * Vérifie si un client a déjà utilisé ce code promotionnel
 */
export const checkCustomerAlreadyUsed = async (
  promoCode: string,
  customerPhone?: string,
  customerEmail?: string
): Promise<boolean> => {
  const cleanCode = promoCode.trim().toUpperCase();
  const cleanPhone = customerPhone ? customerPhone.trim().replace(/\s+/g, "") : null;
  const cleanEmail = customerEmail ? customerEmail.trim().toLowerCase() : null;

  // 1. Vérification locale
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_REDEMPTIONS);
      if (raw) {
        const redemptions: PromotionRedemption[] = JSON.parse(raw);
        const match = redemptions.some((r) => {
          if (r.promo_code.toUpperCase() !== cleanCode) return false;
          if (cleanPhone && r.customer_phone && r.customer_phone.replace(/\s+/g, "") === cleanPhone) return true;
          if (cleanEmail && r.customer_email && r.customer_email.toLowerCase() === cleanEmail) return true;
          return false;
        });
        if (match) return true;
      }
    } catch (err) {
      console.warn("Erreur vérification redemptions locales :", err);
    }
  }

  // 2. Vérification Supabase
  try {
    let query = supabase.from("promotion_redemptions").select("id").eq("promo_code", cleanCode);
    if (cleanPhone && cleanEmail) {
      query = query.or(`customer_phone.eq.${cleanPhone},customer_email.eq.${cleanEmail}`);
    } else if (cleanPhone) {
      query = query.eq("customer_phone", cleanPhone);
    } else if (cleanEmail) {
      query = query.eq("customer_email", cleanEmail);
    } else {
      return false;
    }

    const { data, error } = await query.limit(1);
    if (!error && data && data.length > 0) {
      return true;
    }
  } catch (err) {
    console.warn("Erreur vérification Supabase redemption :", err);
  }

  return false;
};

/**
 * Enregistre l'utilisation d'une promotion
 */
export const recordPromotionRedemption = async (redemption: Omit<PromotionRedemption, "id" | "created_at">): Promise<void> => {
  const newRedemption: PromotionRedemption = {
    ...redemption,
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `red-${Date.now()}`,
    promo_code: redemption.promo_code.toUpperCase(),
    created_at: new Date().toISOString(),
  };

  // Sauvegarde locale
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_REDEMPTIONS);
      const list: PromotionRedemption[] = raw ? JSON.parse(raw) : [];
      list.push(newRedemption);
      localStorage.setItem(STORAGE_KEY_REDEMPTIONS, JSON.stringify(list));
    } catch (err) {
      console.warn("Erreur sauvegarde locale redemption :", err);
    }
  }

  // Incrémentation du compteur de la promo
  const currentPromos = getLocalPromotions();
  const updated = currentPromos.map((p) => {
    if (p.code.toUpperCase() === redemption.promo_code.toUpperCase()) {
      return { ...p, current_uses: (p.current_uses || 0) + 1 };
    }
    return p;
  });
  saveLocalPromotions(updated);

  // Sauvegarde Supabase
  try {
    await supabase.from("promotion_redemptions").insert(newRedemption);
    await supabase.rpc("increment_promo_usage", { promo_code_arg: redemption.promo_code.toUpperCase() });
  } catch (err) {
    console.warn("Erreur enregistrement redemption Supabase :", err);
  }
};

/**
 * Valide un code promotionnel par rapport à un panier donné
 */
export const validatePromoCode = async (
  inputCode: string,
  subtotal: number,
  cartItems: Array<{ price: number; quantity: number; category?: string }>,
  customerPhone?: string,
  customerEmail?: string
): Promise<PromoValidationResult> => {
  const cleanCode = inputCode.trim().toUpperCase();

  if (!cleanCode) {
    return {
      isValid: false,
      discountAmount: 0,
      finalAmount: subtotal,
      errorMessage: "Veuillez saisir un code promotionnel.",
    };
  }

  const allPromos = await fetchAllPromotions();
  const promo = allPromos.find((p) => p.code.toUpperCase() === cleanCode);

  if (!promo) {
    return {
      isValid: false,
      discountAmount: 0,
      finalAmount: subtotal,
      errorMessage: "Ce code promotionnel n'existe pas ou n'est plus valide.",
    };
  }

  // 1. Vérification activation
  if (!promo.is_active) {
    return {
      isValid: false,
      discountAmount: 0,
      finalAmount: subtotal,
      errorMessage: "Ce code promotionnel est actuellement inactif.",
    };
  }

  const now = new Date();

  // 2. Vérification date de début
  if (promo.start_date && new Date(promo.start_date) > now) {
    return {
      isValid: false,
      discountAmount: 0,
      finalAmount: subtotal,
      errorMessage: `Cette offre promotionnelle débutera le ${new Date(promo.start_date).toLocaleDateString("fr-FR")}.`,
    };
  }

  // 3. Vérification date d'expiration
  if (promo.end_date && new Date(promo.end_date) < now) {
    return {
      isValid: false,
      discountAmount: 0,
      finalAmount: subtotal,
      errorMessage: `Ce code promotionnel a expiré le ${new Date(promo.end_date).toLocaleDateString("fr-FR")}.`,
    };
  }

  // 4. Vérification montant minimum de commande
  const minAmount = promo.min_order_amount || 0;
  if (minAmount > 0 && subtotal < minAmount) {
    return {
      isValid: false,
      discountAmount: 0,
      finalAmount: subtotal,
      errorMessage: `Ce code nécessite un panier minimum de ${minAmount.toFixed(2)} € (Panier actuel : ${subtotal.toFixed(2)} €).`,
    };
  }

  // 5. Vérification quota global d'utilisations
  if (promo.max_uses !== null && promo.max_uses !== undefined && promo.max_uses > 0) {
    if ((promo.current_uses || 0) >= promo.max_uses) {
      return {
        isValid: false,
        discountAmount: 0,
        finalAmount: subtotal,
        errorMessage: "Ce code promotionnel a atteint sa limite maximale d'utilisations.",
      };
    }
  }

  // 6. Vérification utilisation unique par client
  if (promo.once_per_customer && (customerPhone || customerEmail)) {
    const alreadyUsed = await checkCustomerAlreadyUsed(cleanCode, customerPhone, customerEmail);
    if (alreadyUsed) {
      return {
        isValid: false,
        discountAmount: 0,
        finalAmount: subtotal,
        errorMessage: "Vous avez déjà utilisé ce code promotionnel avec ce compte ou numéro.",
      };
    }
  }

  // 7. Calcul du montant de réduction
  let discountAmount = 0;
  let freeShippingApplied = false;

  if (promo.type === "percentage") {
    discountAmount = Math.round((subtotal * (promo.value / 100)) * 100) / 100;
  } else if (promo.type === "fixed") {
    discountAmount = Math.min(promo.value, subtotal);
  } else if (promo.type === "free_shipping") {
    freeShippingApplied = true;
    discountAmount = 0;
  }

  const finalAmount = Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100);

  return {
    isValid: true,
    promo,
    discountAmount,
    finalAmount,
    freeShippingApplied,
  };
};
