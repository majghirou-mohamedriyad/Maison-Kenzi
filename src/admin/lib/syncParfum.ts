import { supabase } from "@/integrations/supabase/client";
import type { AdminParfum } from "@/store/useProductStore";
import { persistParfumSeasons } from "@/lib/seasonsStore";

const STORAGE_BUCKET = "product-images";
const BUCKETS_TO_TRY = ["product-images", "parfums", "products", "images"];
// 10 years
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 10;

/**
 * Compresse une image côté client au format WebP optimisé (max 800px de large, ~30-40 Ko)
 * Garantit un enregistrement immédiat sans saturation de bande passante ni rejet HTTP 413.
 */
export const compressImageToDataUrl = (file: File, maxWidth = 800, quality = 0.78): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Conversion en WebP léger
        const dataUrl = canvas.toDataURL("image/webp", quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

/**
 * Téléverse l'image du produit vers Supabase Storage avec repli optimisé
 */
export const uploadProductImage = async (productId: string, file: File): Promise<string> => {
  const ext = (file.name.split(".").pop() || "webp").toLowerCase();
  const safeId = (productId || "product").replace(/[^a-zA-Z0-9_-]/g, "_");
  const path = `${safeId}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

  // 1. Tentative d'upload vers Supabase Storage
  for (const bucket of BUCKETS_TO_TRY) {
    try {
      const { data: uploadData, error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          upsert: true,
          contentType: file.type || "image/jpeg",
          cacheControl: "31536000",
        });

      if (!upErr && uploadData?.path) {
        const { data: pubData } = supabase.storage.from(bucket).getPublicUrl(uploadData.path);
        if (pubData?.publicUrl) {
          return pubData.publicUrl;
        }

        const { data: signData, error: signErr } = await supabase.storage
          .from(bucket)
          .createSignedUrl(uploadData.path, SIGNED_URL_TTL);
        if (!signErr && signData?.signedUrl) {
          return signData.signedUrl;
        }
      }
    } catch (err) {
      console.warn(`Supabase Storage upload vers '${bucket}' non disponible:`, err);
    }
  }

  // 2. Repli de secours : Compression WebP légère pour stockage direct
  console.info("Utilisation du repli optimisé WebP pour l'image");
  return await compressImageToDataUrl(file);
};

/**
 * Synchronisation des Parfums avec Supabase & Persistance Multi-Photos
 */
export const upsertParfumToSupabase = async (
  p: AdminParfum,
  imageUrl: string | null,
  images?: string[]
) => {
  const isFull =
    (p.sale_mode ?? "decant") === "full_bottle" ||
    p.category === "packs" ||
    p.category === "deodorants-stick";
  const fullStock = Number(p.full_bottle_stock ?? p.stock ?? 0);
  const decantStock = Number(p.stock_5ml ?? 0) + Number(p.stock_10ml ?? 0);
  const currentSeasons =
    Array.isArray(p.seasons) && p.seasons.length > 0 ? p.seasons : ["Printemps", "Été"];
  
  persistParfumSeasons(p.id, currentSeasons);
  persistParfumSeasons(p.name, currentSeasons);

  const allImages =
    Array.isArray(images) && images.length > 0
      ? images
      : Array.isArray(p.images) && p.images.length > 0
      ? p.images
      : imageUrl
      ? [imageUrl]
      : [];

  const primaryImageUrl = allImages[0] || imageUrl || null;
  const imageLabelValue = allImages.length > 0 ? JSON.stringify(allImages) : p.imageLabel || p.id;

  const numPrice = Number(p.full_bottle_price ?? p.prices?.["5ml"] ?? p.prices?.["100ml"] ?? 0);

  const row: Record<string, any> = {
    id: p.id,
    name: p.name.trim(),
    maison: p.maison.trim(),
    gender: p.gender || "Mixte",
    category: p.category || null,
    seasons: currentSeasons,
    images: allImages,
    description: p.description || "",
    notes_tete: Array.isArray(p.notes?.tete) ? p.notes.tete : [],
    notes_coeur: Array.isArray(p.notes?.coeur) ? p.notes.coeur : [],
    notes_fond: Array.isArray(p.notes?.fond) ? p.notes.fond : [],
    price_5ml: Number(p.prices?.["5ml"] ?? numPrice),
    price_10ml: Number(p.prices?.["10ml"] ?? numPrice),
    price_20ml: Number(p.prices?.["100ml"] ?? numPrice),
    image_label: imageLabelValue,
    image_url: primaryImageUrl,
    is_active: p.active ?? true,
    is_new: !!p.isNew,
    is_bestseller: !!p.isBestseller,
    sale_mode: p.sale_mode ?? "full_bottle",
    full_bottle_volume_ml: p.full_bottle_volume_ml ? Number(p.full_bottle_volume_ml) : null,
    full_bottle_price: p.full_bottle_price ? Number(p.full_bottle_price) : numPrice,
    full_bottle_stock: fullStock,
    full_bottle_limited: !!p.full_bottle_limited,
    stock_status: ((isFull ? fullStock : decantStock) > 0 ? "actif" : "rupture") as "actif" | "rupture",
  };

  // 1. Tentative avec toutes les colonnes modernes (images, seasons incluses)
  const { error } = await supabase.from("parfums").upsert(row as any, { onConflict: "id" });
  if (error) {
    console.warn("Supabase upsert - tentative sans colonnes additionnelles:", error.message);
    // 2. Repli de compatibilité sans les colonnes `seasons` ou `images` si non encore migrées sur le VPS
    const { seasons: _sea, images: _img, ...fallbackRow } = row;
    const { error: err2 } = await supabase.from("parfums").upsert(fallbackRow as any, { onConflict: "id" });
    if (err2) {
      console.error("Erreur critique Supabase parfums upsert:", err2);
      throw err2;
    }
  }
};

export const deleteParfumFromSupabase = async (id: string) => {
  await supabase.from("parfums").delete().eq("id", id);
  for (const bucket of BUCKETS_TO_TRY) {
    try {
      const { data: list } = await supabase.storage.from(bucket).list(id);
      if (list?.length) {
        await supabase.storage.from(bucket).remove(list.map((f) => `${id}/${f.name}`));
      }
    } catch (err) {
      console.warn(`Storage cleanup warning for bucket '${bucket}':`, err);
    }
  }
};
