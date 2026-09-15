/**
 * Gestionnaire & Normalisation d'Images — Maison Kenzi
 *
 * Fournit les utilitaires pour extraire la galerie complète des images,
 * l'image principale (couverture) et l'image secondaire (survol vitrine),
 * avec normalisation automatique des URLs HTTP du VPS vers le proxy HTTPS sécurisé sur Vercel.
 */

/**
 * Normalise une URL d'image pour assurer son chargement en environnement sécurisé (HTTPS / Vercel)
 */
export const normalizeImageUrl = (url?: string | null): string => {
  if (!url || typeof url !== "string") return "/placeholder.svg";
  let trimmed = url.trim();
  if (!trimmed) return "/placeholder.svg";

  // Conserver les data:image directement
  if (trimmed.startsWith("data:image")) return trimmed;

  if (typeof window !== "undefined") {
    const origin = window.location.origin;
    const isHttps = window.location.protocol === "https:";

    // 1. Si l'URL est relative vers Supabase Storage (ex: /storage/v1/object/public/...)
    if (trimmed.startsWith("/storage/")) {
      return `${origin}/api/supabase${trimmed}`;
    }

    // 2. Si l'URL pointe vers Supabase Port 8000 (IP, localhost ou nom de domaine)
    if (trimmed.includes(":8000/")) {
      trimmed = trimmed.replace(/^https?:\/\/[^/]+:8000/, `${origin}/api/supabase`);
    }

    // 3. Si l'URL pointe vers OpenWA Port 2785
    if (trimmed.includes(":2785/")) {
      trimmed = trimmed.replace(/^https?:\/\/[^/]+:2785/, `${origin}/api/openwa`);
    }

    // 4. Si l'URL pointe vers l'IP brute du VPS (185.197.249.4)
    if (trimmed.includes("185.197.249.4")) {
      if (trimmed.includes(":8000")) {
        trimmed = trimmed.replace(/^https?:\/\/185\.197\.249\.4:8000/, `${origin}/api/supabase`);
      } else if (trimmed.includes(":2785")) {
        trimmed = trimmed.replace(/^https?:\/\/185\.197\.249\.4:2785/, `${origin}/api/openwa`);
      } else {
        trimmed = trimmed.replace(/^https?:\/\/185\.197\.249\.4/, origin);
      }
    }

    // 5. Si l'URL pointe vers localhost ou 127.0.0.1 alors qu'on est sur le domaine public HTTPS
    if (isHttps && (trimmed.includes("localhost") || trimmed.includes("127.0.0.1"))) {
      trimmed = trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, origin);
    }

    // 6. En environnement HTTPS, sécuriser toutes les URLs HTTP restantes (anti-mixed content)
    if (isHttps && trimmed.startsWith("http://")) {
      trimmed = trimmed.replace(/^http:\/\//, "https://");
    }
  }

  return trimmed;
};

export const getParfumImages = (parfum?: any): string[] => {
  if (!parfum) return [];

  let rawList: string[] = [];

  // 1. Tableau d'images direct (store local ou objet enrichi)
  if (Array.isArray(parfum.images) && parfum.images.length > 0) {
    const valid = parfum.images.filter(
      (img: any) => typeof img === "string" && img.trim().length > 0
    );
    if (valid.length > 0) rawList = valid;
  }

  // 2. Format JSON stocké dans image_label / imageLabel
  if (rawList.length === 0) {
    const rawLabel = parfum.image_label || parfum.imageLabel;
    if (typeof rawLabel === "string" && rawLabel.startsWith("[")) {
      try {
        const parsed = JSON.parse(rawLabel);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const valid = parsed.filter(
            (img: any) => typeof img === "string" && img.trim().length > 0
          );
          if (valid.length > 0) rawList = valid;
        }
      } catch {}
    }
  }

  // 3. Image unique de repli (image_url ou imageUrl)
  if (rawList.length === 0) {
    const single = parfum.image_url || parfum.imageUrl;
    if (typeof single === "string" && single.trim().length > 0) {
      rawList = [single];
    }
  }

  return rawList.map((img) => normalizeImageUrl(img));
};

/**
 * Récupère l'image principale (première photo affichée sur la vitrine)
 */
export const getPrimaryImage = (parfum?: any): string | null => {
  const list = getParfumImages(parfum);
  if (list.length > 0) return list[0];
  const fallback = parfum?.image_url || parfum?.imageUrl || null;
  return fallback ? normalizeImageUrl(fallback) : null;
};

/**
 * Récupère la deuxième image du produit pour l'effet de transition au survol
 */
export const getSecondaryImage = (parfum?: any): string | null => {
  const list = getParfumImages(parfum);
  if (list.length > 1) return list[1];
  return null;
};
