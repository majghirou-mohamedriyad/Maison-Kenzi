/**
 * Types & Modèles de Données — Système de Promotions Maison Kenzi
 *
 * Définition des structures de données pour les codes promotionnels,
 * les résultats de validation, les réductions directes et la traçabilité des utilisations.
 * Conforme aux règles d'ingénierie : zéro emoji, typage strict TypeScript.
 */

export type PromoType = "percentage" | "fixed" | "free_shipping";

export type PromoTargetType = "all" | "category" | "products";

export type PromoCategoryTarget = "all" | "parfums" | "cosmetiques" | "artisanat" | "bazar-chic" | string;

/**
 * Entité représentant un code promotionnel ou coupon
 */
export interface PromoCode {
  id: string;
  code: string;                     // Code en majuscules (ex: "KENZI10", "BIENVENUE15")
  description?: string;             // Description ou motif de l'offre
  type: PromoType;                  // Pourcentage, Montant fixe en € ou Livraison offerte
  value: number;                    // Valeur de la réduction (ex: 10 pour 10% ou 10€, 0 si livraison offerte)
  min_order_amount?: number;        // Montant minimum d'achat en € pour être éligible (0 par défaut)
  max_uses?: number | null;         // Nombre maximal d'utilisations globales (null = illimité)
  current_uses: number;             // Compteur d'utilisations effectuées
  once_per_customer: boolean;       // Restreindre à 1 seule utilisation par client (email / tél)
  is_active: boolean;               // Statut actif / inactif
  start_date?: string | null;       // Date ISO de début de validité
  end_date?: string | null;         // Date ISO de fin de validité / expiration
  target_type?: PromoTargetType;    // Type de ciblage : "all" (tout), "category" (par univers), "products" (sélection précise)
  target_category?: PromoCategoryTarget; // Catégorie ciblée si target_type === "category"
  target_products?: string[];       // Liste des identifiants / noms des produits éligibles si target_type === "products"
  target_product_names?: string[]; // Libellés des produits ciblés pour affichage fluide
  created_at?: string;
  updated_at?: string;
}

/**
 * Résultat du calcul et de la validation d'un code promotionnel
 */
export interface PromoValidationResult {
  isValid: boolean;
  promo?: PromoCode;
  discountAmount: number;           // Montant de la remise calculé en €
  finalAmount: number;              // Montant après remise en €
  freeShippingApplied?: boolean;    // Indicateur si la livraison offerte a été appliquée
  errorMessage?: string;            // Motif du refus en français clair si non valide
}

/**
 * Enregistrement de l'utilisation d'une promotion par un client
 */
export interface PromotionRedemption {
  id: string;
  promo_id: string;
  promo_code: string;
  order_number?: string;
  customer_phone?: string;
  customer_email?: string;
  discount_applied: number;
  created_at?: string;
}
