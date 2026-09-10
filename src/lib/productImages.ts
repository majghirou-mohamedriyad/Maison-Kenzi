/**
 * Gestionnaire d'Images Multiples des Parfums — Maison Kenzi
 *
 * Fournit les utilitaires pour extraire la galerie complète des images,
 * l'image principale (couverture) et l'image secondaire (survol vitrine).
 */

export const getParfumImages = (parfum?: any): string[] => {
  if (!parfum) return [];

  // 1. Tableau d'images direct (store local ou objet enrichi)
  if (Array.isArray(parfum.images) && parfum.images.length > 0) {
    const valid = parfum.images.filter(
      (img: any) => typeof img === "string" && img.trim().length > 0
    );
    if (valid.length > 0) return valid;
  }

  // 2. Format JSON stocké dans image_label / imageLabel
  const rawLabel = parfum.image_label || parfum.imageLabel;
  if (typeof rawLabel === "string" && rawLabel.startsWith("[")) {
    try {
      const parsed = JSON.parse(rawLabel);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const valid = parsed.filter(
          (img: any) => typeof img === "string" && img.trim().length > 0
        );
        if (valid.length > 0) return valid;
      }
    } catch {}
  }

  // 3. Image unique de repli (image_url ou imageUrl)
  const single = parfum.image_url || parfum.imageUrl;
  if (typeof single === "string" && single.trim().length > 0) {
    return [single];
  }

  return [];
};

/**
 * Récupère l'image principale (première photo affichée sur la vitrine)
 */
export const getPrimaryImage = (parfum?: any): string | null => {
  const list = getParfumImages(parfum);
  if (list.length > 0) return list[0];
  return parfum?.image_url || parfum?.imageUrl || null;
};

/**
 * Récupère la deuxième image du produit pour l'effet de transition au survol
 */
export const getSecondaryImage = (parfum?: any): string | null => {
  const list = getParfumImages(parfum);
  if (list.length > 1) return list[1];
  return null;
};
