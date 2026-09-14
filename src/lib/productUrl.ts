/**
 * Utilitaire de Gestion des Slugs et URLs Produits — Maison Kenzi
 *
 * Ce module permet de générer des identifiants d'URL conviviaux (slugs)
 * pour le référencement naturel (SEO) et de résoudre les fiches produits
 * indifféremment par leur identifiant technique (UUID) ou leur slug lisible.
 */

/**
 * Nettoie une chaîne de caractères pour en faire un slug URL standardisé.
 * Supprime les accents, convertit en minuscules, remplace les caractères spéciaux par des tirets.
 */
export const slugify = (text?: string | null): string => {
  if (!text) return "";
  return text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Suppression des diacritiques/accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // Remplacement des caractères non alphanumériques par un tiret
    .replace(/^-+|-+$/g, ""); // Nettoyage des tirets de début et de fin
};

/**
 * Génère un slug propre pour un produit à partir de son nom et éventuellement de sa maison.
 * Format privilégié : "nom-du-parfum-maison" ou "nom-du-parfum"
 */
export const getParfumSlug = (
  parfum: { id: string; name?: string | null; maison?: string | null },
  allProducts?: Array<{ id: string; name?: string | null; maison?: string | null }>
): string => {
  if (!parfum) return "";

  const namePart = (parfum.name || "").trim();
  const maisonPart = (parfum.maison || "").trim();

  // Si le nom contient déjà la maison, éviter la répétition
  let combined = namePart;
  if (maisonPart && !namePart.toLowerCase().includes(maisonPart.toLowerCase())) {
    combined = `${namePart} ${maisonPart}`;
  }

  const baseSlug = slugify(combined) || slugify(namePart);

  // Si le slug est vide (cas extrême), repli sur l'UUID
  if (!baseSlug) return parfum.id;

  // Détection des doublons potentiels si la liste complète des produits est fournie
  if (allProducts && allProducts.length > 0) {
    const hasCollision = allProducts.some(
      (other) =>
        other.id !== parfum.id &&
        (slugify(`${other.name || ""} ${other.maison || ""}`.trim()) === baseSlug ||
          slugify(other.name || "") === baseSlug)
    );

    if (hasCollision && parfum.id) {
      // En cas de conflit, ajout d'un court suffixe unique (6 premiers caractères de l'ID)
      const shortSuffix = parfum.id.replace(/-/g, "").slice(0, 6);
      return `${baseSlug}-${shortSuffix}`;
    }
  }

  return baseSlug;
};

/**
 * Retourne le chemin URL complet vers la fiche du parfum.
 * Exemple : "/parfum/aventus-creed"
 */
export const getParfumUrl = (
  parfum: { id: string; name?: string | null; maison?: string | null },
  allProducts?: Array<{ id: string; name?: string | null; maison?: string | null }>
): string => {
  const slug = getParfumSlug(parfum, allProducts);
  return `/parfum/${slug || parfum.id}`;
};

/**
 * Recherche et résout un parfum dans une collection à partir d'un identifiant ou d'un slug.
 * Compatible à 100% avec les anciens identifiants UUID et les nouveaux slugs textuels.
 */
export const findParfumByIdOrSlug = <T extends { id: string; name?: string | null; maison?: string | null }>(
  products: T[],
  identifierOrSlug?: string | null
): T | null => {
  if (!identifierOrSlug || !products || products.length === 0) return null;

  const target = identifierOrSlug.trim().toLowerCase();

  // 1. Correspondance exacte par ID (UUID complet)
  const byExactId = products.find((p) => p.id.toLowerCase() === target);
  if (byExactId) return byExactId;

  // 2. Correspondance par slug calculé (nom + maison)
  const byFullSlug = products.find((p) => getParfumSlug(p, products).toLowerCase() === target);
  if (byFullSlug) return byFullSlug;

  // 3. Correspondance par slug simple du nom seul
  const byNameSlug = products.find((p) => slugify(p.name).toLowerCase() === target);
  if (byNameSlug) return byNameSlug;

  // 4. Correspondance souple avec suffixe ID
  const bySuffix = products.find((p) => {
    const cleanId = p.id.replace(/-/g, "").toLowerCase();
    return target.endsWith(cleanId.slice(0, 6)) || target.includes(p.id.toLowerCase());
  });
  if (bySuffix) return bySuffix;

  return null;
};
