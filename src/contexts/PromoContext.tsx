/**
 * Contexte & Store Global des Promotions — Maison Kenzi
 *
 * Gère l'état global des promotions actives, le code promotionnel appliqué au panier en cours,
 * le calcul dynamique des remises et les opérations d'administration.
 * Conforme aux règles strictes : zéro emoji, typage strict TypeScript, commentaires en français.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { PromoCode, PromoValidationResult } from "@/types/promotions";
import {
  fetchAllPromotions,
  upsertPromotion,
  deletePromotion,
  validatePromoCode,
  getLocalPromotions,
} from "@/services/promoService";
import { toast } from "sonner";

export interface PromoCartItem {
  id?: string;
  name?: string;
  price: number;
  quantity: number;
  category?: string;
}

interface PromoContextType {
  promotions: PromoCode[];
  appliedPromo: PromoCode | null;
  discountAmount: number;
  freeShippingApplied: boolean;
  isLoading: boolean;
  applyPromo: (
    code: string,
    subtotal: number,
    cartItems: PromoCartItem[],
    customerPhone?: string,
    customerEmail?: string
  ) => Promise<PromoValidationResult>;
  removePromo: () => void;
  recalculateDiscount: (
    subtotal: number,
    cartItems: PromoCartItem[]
  ) => void;
  refreshPromotions: () => Promise<void>;
  savePromo: (promo: PromoCode) => Promise<PromoCode>;
  removePromoById: (id: string) => Promise<void>;
  togglePromoActive: (id: string) => Promise<void>;
  clearAllPromotions: () => Promise<void>;
}

const PromoContext = createContext<PromoContextType | undefined>(undefined);

const APPLIED_PROMO_STORAGE_KEY = "mk_applied_promo_code";

export const PromoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [promotions, setPromotions] = useState<PromoCode[]>(() => getLocalPromotions());
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [freeShippingApplied, setFreeShippingApplied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Chargement initial des promotions
  const refreshPromotions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllPromotions();
      setPromotions(data);
    } catch (err) {
      console.warn("Erreur chargement promotions :", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshPromotions();
  }, [refreshPromotions]);

  // Recalcul du montant de remise si le sous-total ou les articles du panier changent
  const recalculateDiscount = useCallback(
    (subtotal: number, cartItems: PromoCartItem[]) => {
      if (!appliedPromo) {
        setDiscountAmount(0);
        setFreeShippingApplied(false);
        return;
      }

      const minAmount = appliedPromo.min_order_amount || 0;
      if (minAmount > 0 && subtotal < minAmount) {
        setAppliedPromo(null);
        setDiscountAmount(0);
        setFreeShippingApplied(false);
        try {
          localStorage.removeItem(APPLIED_PROMO_STORAGE_KEY);
        } catch {}
        toast.info("Code promotionnel retiré", {
          description: `Le montant de votre panier est repassé sous le seuil minimum de ${minAmount} € requis pour l'offre ${appliedPromo.code}.`,
        });
        return;
      }

      // Détermination des articles éligibles selon le ciblage
      let eligibleItems = cartItems || [];
      let isTargeted = false;

      // Ciblage par produits
      if (
        (appliedPromo.target_type === "products" || (!appliedPromo.target_type && appliedPromo.target_products && appliedPromo.target_products.length > 0)) &&
        Array.isArray(appliedPromo.target_products) &&
        appliedPromo.target_products.length > 0
      ) {
        isTargeted = true;
        const targetedList = appliedPromo.target_products.map((t) => t.trim().toLowerCase());

        eligibleItems = (cartItems || []).filter((item) => {
          if (!item) return false;
          const itemId = (item.id || "").trim().toLowerCase();
          const itemName = (item.name || "").trim().toLowerCase();

          return targetedList.some((target) => {
            if (!target) return false;
            return (
              (itemId && itemId === target) ||
              (itemName && itemName === target) ||
              (itemName && target.length > 3 && itemName.includes(target)) ||
              (itemId && target.length > 3 && itemId.includes(target))
            );
          });
        });

        if (eligibleItems.length === 0 && (cartItems || []).length > 0) {
          setAppliedPromo(null);
          setDiscountAmount(0);
          setFreeShippingApplied(false);
          try {
            localStorage.removeItem(APPLIED_PROMO_STORAGE_KEY);
          } catch {}
          toast.info("Code promotionnel retiré", {
            description: "Les articles éligibles à cette promotion ne sont plus dans votre panier.",
          });
          return;
        }
      }
      // Ciblage par catégorie
      else if (
        appliedPromo.target_type === "category" &&
        appliedPromo.target_category &&
        appliedPromo.target_category !== "all"
      ) {
        isTargeted = true;
        const targetCat = appliedPromo.target_category.toLowerCase();
        eligibleItems = (cartItems || []).filter((item) => {
          if (!item) return false;
          const cat = (item.category || "").toLowerCase();
          return cat && cat === targetCat;
        });

        if (eligibleItems.length === 0 && (cartItems || []).some((i) => i.category)) {
          setAppliedPromo(null);
          setDiscountAmount(0);
          setFreeShippingApplied(false);
          try {
            localStorage.removeItem(APPLIED_PROMO_STORAGE_KEY);
          } catch {}
          toast.info("Code promotionnel retiré", {
            description: "Les articles de la catégorie éligible ne sont plus dans votre panier.",
          });
          return;
        }
        if (eligibleItems.length === 0) {
          eligibleItems = cartItems || [];
        }
      }

      const eligibleSubtotal = isTargeted
        ? eligibleItems.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0)
        : subtotal;

      if (appliedPromo.type === "percentage") {
        const discount = Math.round((eligibleSubtotal * (appliedPromo.value / 100)) * 100) / 100;
        setDiscountAmount(discount);
        setFreeShippingApplied(false);
      } else if (appliedPromo.type === "fixed") {
        const discount = Math.min(appliedPromo.value, eligibleSubtotal);
        setDiscountAmount(discount);
        setFreeShippingApplied(false);
      } else if (appliedPromo.type === "free_shipping") {
        setDiscountAmount(0);
        setFreeShippingApplied(true);
      }
    },
    [appliedPromo]
  );

  // Appliquer un code promotionnel
  const applyPromo = useCallback(
    async (
      code: string,
      subtotal: number,
      cartItems: PromoCartItem[],
      customerPhone?: string,
      customerEmail?: string
    ): Promise<PromoValidationResult> => {
      setIsLoading(true);
      try {
        const result = await validatePromoCode(code, subtotal, cartItems, customerPhone, customerEmail);

        if (result.isValid && result.promo) {
          setAppliedPromo(result.promo);
          setDiscountAmount(result.discountAmount);
          setFreeShippingApplied(!!result.freeShippingApplied);

          try {
            localStorage.setItem(APPLIED_PROMO_STORAGE_KEY, result.promo.code);
          } catch {}

          toast.success("Code promotionnel appliqué !", {
            description:
              result.promo.type === "free_shipping"
                ? "La livraison offerte a été appliquée à votre commande."
                : `Une remise de ${result.discountAmount.toFixed(2)} € a été déduite de votre panier.`,
          });
        } else {
          toast.error("Code promotionnel non valide", {
            description: result.errorMessage || "Vérifiez votre code et réessayez.",
          });
        }

        return result;
      } catch (err) {
        console.error("Erreur application promo :", err);
        const errorResult: PromoValidationResult = {
          isValid: false,
          discountAmount: 0,
          finalAmount: subtotal,
          errorMessage: "Une erreur est survenue lors de la vérification du code.",
        };
        toast.error("Erreur de vérification", { description: errorResult.errorMessage });
        return errorResult;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Retirer le code promotionnel en cours
  const removePromo = useCallback(() => {
    setAppliedPromo(null);
    setDiscountAmount(0);
    setFreeShippingApplied(false);
    try {
      localStorage.removeItem(APPLIED_PROMO_STORAGE_KEY);
    } catch {}
    toast.info("Code promotionnel retiré");
  }, []);

  // Enregistrer ou modifier une promotion (Administration)
  const savePromo = useCallback(async (promo: PromoCode): Promise<PromoCode> => {
    const saved = await upsertPromotion(promo);
    setPromotions((prev) => {
      const idx = prev.findIndex((p) => p.id === saved.id || p.code.toUpperCase() === saved.code.toUpperCase());
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    return saved;
  }, []);

  // Supprimer une promotion (Administration)
  const removePromoById = useCallback(async (id: string): Promise<void> => {
    await deletePromotion(id);
    setPromotions((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Activer ou désactiver une promotion en 1 clic
  const togglePromoActive = useCallback(
    async (id: string): Promise<void> => {
      const target = promotions.find((p) => p.id === id);
      if (!target) return;
      const updated: PromoCode = { ...target, is_active: !target.is_active };
      await savePromo(updated);
    },
    [promotions, savePromo]
  );

  // Vider complètement la table des promotions
  const clearAllPromotionsHandler = useCallback(async (): Promise<void> => {
    setPromotions([]);
    setAppliedPromo(null);
    setDiscountAmount(0);
    setFreeShippingApplied(false);
    const { clearAllPromotions: clearService } = await import("@/services/promoService");
    await clearService();
  }, []);

  return (
    <PromoContext.Provider
      value={{
        promotions,
        appliedPromo,
        discountAmount,
        freeShippingApplied,
        isLoading,
        applyPromo,
        removePromo,
        recalculateDiscount,
        refreshPromotions,
        savePromo,
        removePromoById,
        togglePromoActive,
        clearAllPromotions: clearAllPromotionsHandler,
      }}
    >
      {children}
    </PromoContext.Provider>
  );
};

export const usePromo = (): PromoContextType => {
  const context = useContext(PromoContext);
  if (!context) {
    throw new Error("usePromo doit être utilisé à l'intérieur d'un PromoProvider");
  }
  return context;
};

// Alias compatible avec le store Zustand mentionné dans promotions.md
export const usePromoStore = usePromo;
