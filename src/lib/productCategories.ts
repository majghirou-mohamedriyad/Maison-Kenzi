/**
 * Utilitaires de Gestion Multi-Catégories & Univers Olfactifs — Maison Kenzi
 *
 * Fournit l'extraction sûre, le typage et le filtrage des parfums
 * associés à une ou plusieurs catégories simultanément.
 */

/**
 * Extrait la liste des slugs de catégories d'un parfum
 */
export const getParfumCategories = (p?: {
  category?: string | null;
  categories?: string[] | null;
  category_slugs?: string[] | null;
}): string[] => {
  if (!p) return [];
  if (Array.isArray(p.categories) && p.categories.length > 0) {
    return p.categories.filter(Boolean);
  }
  if (Array.isArray(p.category_slugs) && p.category_slugs.length > 0) {
    return p.category_slugs.filter(Boolean);
  }
  if (typeof p.category === "string" && p.category.trim()) {
    if (p.category.startsWith("[") && p.category.endsWith("]")) {
      try {
        const parsed = JSON.parse(p.category);
        if (Array.isArray(parsed)) return parsed.filter(Boolean);
      } catch {}
    }
    if (p.category.includes(",")) {
      return p.category.split(",").map((c) => c.trim()).filter(Boolean);
    }
    return [p.category.trim()];
  }
  return [];
};

/**
 * Vérifie si un parfum appartient à une catégorie donnée
 */
export const isParfumInCategory = (
  p?: {
    category?: string | null;
    categories?: string[] | null;
    gender?: string | null;
    id?: string;
  },
  categorySlug?: string
): boolean => {
  if (!p || !categorySlug) return false;
  const target = categorySlug.toLowerCase().trim();
  if (target === "toutes" || target === "all") return true;

  const cats = getParfumCategories(p).map((c) => c.toLowerCase().trim());
  if (cats.includes(target)) return true;

  // Catégorie générale Parfums / Parfum
  if (target === "parfums" || target === "parfum") {
    if (cats.includes("parfums") || cats.includes("parfum")) return true;
    const isSpecializedOtherCategory = cats.some((c) => 
      c.includes("deodorant") || 
      c.includes("cosmetique") || 
      c.includes("artisanal") || 
      c.includes("antique")
    );
    // Si ce n'est pas un produit d'une autre catégorie spécifique (déodorants, cosmétiques, antiquités...), c'est un parfum
    if (!isSpecializedOtherCategory) return true;
  }

  // Rapprochement par genre si la catégorie correspond à un genre
  if (target === "homme" && p.gender?.toLowerCase() === "homme") return true;
  if (target === "femme" && p.gender?.toLowerCase() === "femme") return true;
  if (target === "mixte" && (p.gender?.toLowerCase() === "mixte" || p.gender?.toLowerCase() === "unisexe")) return true;

  // Déodorants et Packs
  if (target.includes("deodorant") && (cats.some((c) => c.includes("deodorant")) || p.id?.includes("old-spice"))) return true;
  if (target.includes("pack") && (cats.some((c) => c.includes("pack")) || p.id?.includes("pack"))) return true;

  // Cosmétiques, Artisanat, Bazar Chic et Antiquités (tolérance singulier/pluriel)
  if (target.includes("cosmetique") && cats.some((c) => c.includes("cosmetique"))) return true;
  if ((target.includes("artisanal") || target.includes("artisanat") || target.includes("artisanaux")) && cats.some((c) => c.includes("artisanal") || c.includes("artisanat") || c.includes("artisanaux"))) return true;
  if ((target.includes("bazar") || target.includes("chic") || target.includes("antique") || target.includes("antiquite") || target.includes("antiquités")) && cats.some((c) => c.includes("bazar") || c.includes("chic") || c.includes("antique") || c.includes("antiquite") || c.includes("antiquités"))) return true;

  return false;
};

/**
 * Vérifie formellement si un produit est un parfum (et non un cosmétique, déodorant, artisanat, pack, bazar chic, etc.)
 * Seuls les parfums possèdent les attributs de genre (mixte, homme, femme) et de saisons d'utilisation.
 */
export const isParfumProduct = (p?: {
  category?: string | null;
  categories?: string[] | null;
  category_slugs?: string[] | null;
  id?: string;
  weight_value?: string | null;
  volume_value?: string | null;
  has_custom_options?: boolean;
  custom_options?: any;
}): boolean => {
  if (!p) return false;
  if ((p as any).has_custom_options || (Array.isArray((p as any).custom_options) && (p as any).custom_options.length > 0)) {
    return false;
  }
  const cats = getParfumCategories(p).map((c) => c.toLowerCase().trim());
  
  // Tout produit rattaché explicitement à un univers non-parfum
  const isOther = cats.some((c) =>
    c.includes("cosmetique") ||
    c.includes("soin") ||
    c.includes("deodorant") ||
    c.includes("artisanal") ||
    c.includes("artisanat") ||
    c.includes("artisanaux") ||
    c.includes("bazar") ||
    c.includes("chic") ||
    c.includes("antique") ||
    c.includes("antiquite") ||
    c.includes("antiquités") ||
    c.includes("pack") ||
    c.includes("livre")
  );
  if (isOther) return false;

  // Si le produit possède des attributs de poids ou volume cosmétiques
  if (p.weight_value || p.volume_value) {
    if (cats.length === 0 || cats.some((c) => c.includes("cosmetique") || c.includes("soin"))) {
      return false;
    }
  }

  return true;
};

export type ProductGroupKey = "parfums" | "cosmetiques" | "artisanat" | "bazar-chic" | "antiques" | "autres";

/**
 * Détermine l'ordre de priorité strict pour l'affichage de la collection complète (/collection/all) :
 * 1. Parfums en premier
 * 2. Produits Cosmétiques en second
 * 3. Produits Artisanaux en troisième
 * 4. Bazar Chic & Décoration en quatrième
 * 5. Autres créations en dernier
 */
export const getProductCategoryOrder = (p?: {
  category?: string | null;
  categories?: string[] | null;
  category_slugs?: string[] | null;
  id?: string;
  weight_value?: string | null;
  volume_value?: string | null;
  gender?: string | null;
  notes?: any;
}): number => {
  if (!p) return 99;
  const cats = getParfumCategories(p).map((c) => c.toLowerCase().trim());
  const catStr = (p.category || "").toLowerCase().trim();
  const allCats = [...cats, catStr].join(" ");

  // 4. Bazar Chic & Décoration / Antiques
  if (allCats.includes("bazar") || allCats.includes("chic") || allCats.includes("antique") || allCats.includes("antiquit")) {
    return 4;
  }

  // 3. Produits Artisanaux
  if (
    allCats.includes("artisanal") ||
    allCats.includes("artisanat") ||
    allCats.includes("artisanaux")
  ) {
    return 3;
  }

  // 2. Produits Cosmétiques & Soins
  if (
    allCats.includes("cosmetique") ||
    allCats.includes("soin") ||
    allCats.includes("deodorant") ||
    ((p.weight_value || p.volume_value) && !isParfumProduct(p))
  ) {
    return 2;
  }

  // 1. Parfums (Parfums de Niche, Décants, Flacons)
  if (
    isParfumProduct(p) ||
    allCats.includes("parfum") ||
    Boolean(p.gender)
  ) {
    return 1;
  }

  return 5;
};

/**
 * Retourne la clé de groupe principale d'un produit
 */
export const getProductGroupKey = (p?: {
  category?: string | null;
  categories?: string[] | null;
  category_slugs?: string[] | null;
  id?: string;
  weight_value?: string | null;
  volume_value?: string | null;
  gender?: string | null;
  notes?: any;
}): ProductGroupKey => {
  const order = getProductCategoryOrder(p);
  switch (order) {
    case 1:
      return "parfums";
    case 2:
      return "cosmetiques";
    case 3:
      return "artisanat";
    case 4:
      return "antiques";
    default:
      return "autres";
  }
};

/**
 * Retourne le libellé éditorial bilingue pour chaque groupe de produits
 */
export const getProductGroupLabel = (groupKey: ProductGroupKey, language: string = "fr"): string => {
  switch (groupKey) {
    case "parfums":
      return language === "en" ? "Fragrances & Perfumes" : "Parfums d'Exception";
    case "cosmetiques":
      return language === "en" ? "Cosmetics & Skincare" : "Produits Cosmétiques";
    case "artisanat":
      return language === "en" ? "Handcrafted Creations" : "Produits Artisanaux";
    case "antiques":
      return language === "en" ? "Rare Antiques & Treasures" : "Antiques & Pièces Rares";
    default:
      return language === "en" ? "Other Creations" : "Autres Créations";
  }
};

/**
 * Ordonne les slugs de catégories pour l'affichage des onglets/filtres
 */
export const getCategorySlugOrder = (slug: string): number => {
  const s = slug.toLowerCase().trim();
  if (s === "toutes" || s === "all") return 0;
  if (s.includes("parfum") || s === "homme" || s === "femme" || s === "mixte") return 1;
  if (s.includes("cosmetique") || s.includes("soin") || s.includes("deodorant")) return 2;
  if (s.includes("artisanal") || s.includes("artisanat") || s.includes("artisanaux")) return 3;
  if (s.includes("antique") || s.includes("antiquit")) return 4;
  return 5;
};
