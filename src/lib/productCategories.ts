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

  // Cosmétiques, Artisanat et Antiquités (tolérance singulier/pluriel)
  if (target.includes("cosmetique") && cats.some((c) => c.includes("cosmetique"))) return true;
  if ((target.includes("artisanal") || target.includes("artisanat") || target.includes("artisanaux")) && cats.some((c) => c.includes("artisanal") || c.includes("artisanat") || c.includes("artisanaux"))) return true;
  if ((target.includes("antique") || target.includes("antiquite") || target.includes("antiquités")) && cats.some((c) => c.includes("antique") || c.includes("antiquite") || c.includes("antiquités"))) return true;

  return false;
};
