/**
 * Définition des Types & Données Parfums — Maison Kenzi
 *
 * Catalogue initialisé à vide. Les parfums sont gérés dynamiquement via la base de données
 * Supabase (schéma maisonkenzi) et le tableau de bord administrateur.
 */

export type Gender = 'Homme' | 'Femme' | 'Mixte';
export type CollectionCategory = 'homme' | 'femme' | 'deodorants-stick' | 'packs';

export type ParfumSize = '5ml' | '10ml' | 'full';

export type ProductTier = {
  quantity: number;
  price: number;
  label?: string;
};

export type Parfum = {
  id: string;
  name: string;
  name_en?: string;
  maison: string;
  gender: Gender;
  category?: CollectionCategory;
  description: string;
  description_en?: string;
  notes: { tete: string[]; coeur: string[]; fond: string[] };
  notes_en?: string | { tete?: string[]; coeur?: string[]; fond?: string[] };
  prices: { '5ml': number; '10ml': number; '100ml'?: number };
  imageLabel: string;
  image_label_en?: string;
  image_url?: string | null;
  images?: string[];
  isNew?: boolean;
  isBestseller?: boolean;
  seasons?: string[];
  sale_mode?: 'decant' | 'full_bottle';
  full_bottle_price?: number | null;
  has_tiers?: boolean;
  quantity_tiers?: ProductTier[];
};

export const SIZE_META: Record<ParfumSize, { label: string; sub: string }> = {
  '5ml':  { label: '5 ml',  sub: 'Découverte' },
  '10ml': { label: '10 ml', sub: 'Voyage' },
  'full': { label: 'Flacon complet', sub: 'Flacon scellé' },
};

/**
 * Catalogue vide par défaut pour alimentation exclusive via la base de données Supabase
 */
export const parfums: Parfum[] = [];
