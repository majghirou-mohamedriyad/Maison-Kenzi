import { useCallback, useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import type { Gender, Parfum } from "@/types/database";
import { useProducts, getProducts, setProducts, type AdminParfum } from "@/store/useProductStore";
import { getParfumSeasons } from "@/lib/seasonsStore";
import { getParfumImages } from "@/lib/productImages";
import { getParfumCategories, isParfumInCategory } from "@/lib/productCategories";

export type ParfumFilter = {
  gender?: Gender;
  isNew?: boolean;
  isBestseller?: boolean;
  isActive?: boolean;
  category?: string;
};

// Convertit les produits de la base de données Supabase vers le type Parfum de l'UI
export const mapRowToParfum = (row: any): Parfum => {
  const isFull = (row.sale_mode ?? "decant") === "full_bottle" || row.category === "packs" || row.category === "deodorants-stick";
  const fullStock = Number(row.full_bottle_stock ?? 0);
  const decantStock = Number(row.stock_5ml ?? 0) + Number(row.stock_10ml ?? 0);
  const totalStock = isFull ? fullStock : decantStock;
  const inStock = (row.is_active ?? true) && (totalStock > 0 || row.stock_status === "actif");
  const images = getParfumImages(row);
  const primaryImg = images[0] || row.image_url || null;
  const categoriesList = getParfumCategories(row);

  return {
    id: row.id,
    name: row.name,
    maison: row.maison,
    gender: row.gender as Gender,
    category: row.category || categoriesList[0] || "",
    categories: categoriesList,
    seasons: getParfumSeasons(row),
    description: row.description || "",
    notes_tete: row.notes_tete ?? [],
    notes_coeur: row.notes_coeur ?? [],
    notes_fond: row.notes_fond ?? [],
    price_5ml: Number(row.price_5ml ?? 0),
    price_10ml: Number(row.price_10ml ?? 0),
    image_label: row.image_label || row.id,
    image_url: primaryImg,
    images: images,
    is_active: inStock,
    is_new: !!row.is_new,
    is_bestseller: !!row.is_bestseller,
    stock_status: inStock ? "actif" : "rupture",
    sale_mode: isFull ? "full_bottle" : (row.sale_mode ?? "decant"),
    full_bottle_price: row.full_bottle_price ? Number(row.full_bottle_price) : null,
    full_bottle_volume_ml: row.full_bottle_volume_ml ? Number(row.full_bottle_volume_ml) : (row.sale_mode === "full_bottle" ? 50 : null),
    full_bottle_stock: fullStock,
    stock_5ml: Number(row.stock_5ml ?? 0),
    stock_10ml: Number(row.stock_10ml ?? 0),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
};

export const mapLocalToParfum = (p: AdminParfum): Parfum => {
  const isFull = (p.sale_mode ?? "decant") === "full_bottle" || p.category === "packs" || p.category === "deodorants-stick";
  const fullStock = p.full_bottle_stock ?? 0;
  const decantStock = (p.stock_5ml ?? 0) + (p.stock_10ml ?? 0);
  const totalStock = isFull ? fullStock : decantStock;
  const inStock = (p.active ?? true) && totalStock > 0;
  const images = getParfumImages(p);
  const primaryImg = images[0] || p.image_url || null;
  const categoriesList = getParfumCategories(p);

  return {
    id: p.id,
    name: p.name,
    maison: p.maison,
    gender: p.gender,
    category: p.category || categoriesList[0] || "",
    categories: categoriesList,
    seasons: Array.isArray(p.seasons) ? p.seasons : [],
    description: p.description,
    notes_tete: p.notes?.tete ?? [],
    notes_coeur: p.notes?.coeur ?? [],
    notes_fond: p.notes?.fond ?? [],
    price_5ml: p.prices?.["5ml"] ?? 0,
    price_10ml: p.prices?.["10ml"] ?? 0,
    image_label: p.imageLabel,
    image_url: primaryImg,
    images: images,
    is_active: inStock,
    is_new: !!p.isNew,
    is_bestseller: !!p.isBestseller,
    stock_status: inStock ? "actif" : "rupture",
    sale_mode: isFull ? "full_bottle" : (p.sale_mode ?? "decant"),
    full_bottle_price: p.full_bottle_price ?? null,
    full_bottle_volume_ml: p.full_bottle_volume_ml ?? null,
    full_bottle_stock: fullStock,
    stock_5ml: p.stock_5ml ?? 0,
    stock_10ml: p.stock_10ml ?? 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

export const refreshProductsFromSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from("parfums")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      const currentLocal = getProducts();
      const adminProducts: AdminParfum[] = data.map((r: any) => {
        const localMatch = currentLocal.find((lp) => lp.id === r.id);
        const parsedSeasons = Array.isArray(r.seasons)
          ? r.seasons
          : typeof r.seasons === "string"
          ? (() => {
              try {
                return JSON.parse(r.seasons);
              } catch {
                return r.seasons.split(",").map((s: string) => s.trim()).filter(Boolean);
              }
            })()
          : (localMatch?.seasons ?? []);

        const rawLabel = typeof r.image_label === "string" ? r.image_label.trim() : "";
        const isJsonLabel = rawLabel.startsWith("[") && rawLabel.endsWith("]");
        let extractedImagesFromLabel: string[] = [];
        if (isJsonLabel) {
          try {
            const parsed = JSON.parse(rawLabel);
            if (Array.isArray(parsed)) extractedImagesFromLabel = parsed.filter(Boolean);
          } catch {}
        }

        const remoteImages = Array.isArray(r.images) && r.images.length > 0
          ? r.images
          : (extractedImagesFromLabel.length > 0
            ? extractedImagesFromLabel
            : (r.image_url ? [r.image_url] : []));

        const finalImages = remoteImages.length > 0 ? remoteImages : (localMatch?.images ?? []);

        const cleanImageLabel = !isJsonLabel && rawLabel
          ? rawLabel
          : (localMatch?.imageLabel && !localMatch.imageLabel.startsWith("[") ? localMatch.imageLabel : "");

        return {
          id: r.id,
          name: r.name,
          name_en: r.name_en || localMatch?.name_en || "",
          maison: r.maison,
          gender: r.gender,
          category: r.category ?? localMatch?.category,
          categories: Array.isArray(r.categories) && r.categories.length > 0 ? r.categories : (r.category ? [r.category] : []),
          seasons: parsedSeasons,
          description: r.description || "",
          description_en: r.description_en || localMatch?.description_en || "",
          notes_en: r.notes_en || localMatch?.notes_en || "",
          image_label_en: r.image_label_en || localMatch?.image_label_en || "",
          notes: {
            tete: r.notes_tete ?? localMatch?.notes?.tete ?? [],
            coeur: r.notes_coeur ?? localMatch?.notes?.coeur ?? [],
            fond: r.notes_fond ?? localMatch?.notes?.fond ?? [],
          },
          prices: {
            "5ml": Number(r.price_5ml ?? localMatch?.prices?.["5ml"] ?? 0),
            "10ml": Number(r.price_10ml ?? localMatch?.prices?.["10ml"] ?? 0),
          },
          imageLabel: cleanImageLabel,
          image_url: finalImages[0] || r.image_url || localMatch?.image_url || null,
          images: finalImages,
          isNew: !!r.is_new,
          isBestseller: !!r.is_bestseller,
          sale_mode: r.sale_mode ?? localMatch?.sale_mode ?? "full_bottle",
          full_bottle_price: r.full_bottle_price ? Number(r.full_bottle_price) : localMatch?.full_bottle_price ?? null,
          full_bottle_volume_ml: r.full_bottle_volume_ml ? Number(r.full_bottle_volume_ml) : localMatch?.full_bottle_volume_ml ?? null,
          full_bottle_stock: Number(r.full_bottle_stock ?? localMatch?.full_bottle_stock ?? 0),
          full_bottle_limited: !!r.full_bottle_limited,
          stock_5ml: Number(r.stock_5ml ?? localMatch?.stock_5ml ?? 0),
          stock_10ml: Number(r.stock_10ml ?? localMatch?.stock_10ml ?? 0),
          active: r.is_active ?? localMatch?.active ?? true,
          weight_value: r.weight_value || localMatch?.weight_value,
          weight_unit: r.weight_unit || localMatch?.weight_unit || "g",
          volume_value: r.volume_value || localMatch?.volume_value,
          volume_unit: r.volume_unit || localMatch?.volume_unit || "ml",
        };
      });
      setProducts(adminProducts);
    }
  } catch {}
};

export const useParfums = (filter?: ParfumFilter) => {
  const products = useProducts();
  const [loading, setLoading] = useState<boolean>(() => products.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshProductsFromSupabase().finally(() => setLoading(false));
  }, []);

  const data = useMemo(() => {
    let list = products.map(mapLocalToParfum);
    if (!filter) return list;

    if (filter.gender) {
      list = list.filter((p) => p.gender === filter.gender);
    }
    if (filter.isNew !== undefined) {
      list = list.filter((p) => p.is_new === filter.isNew);
    }
    if (filter.isActive !== undefined) {
      list = list.filter((p) => p.is_active === filter.isActive);
    }
    if (filter.category) {
      list = list.filter((p) => isParfumInCategory(p, filter.category));
    }
    if (filter.isBestseller) {
      list = list.filter((p) => p.is_bestseller);
    }
    return list;
  }, [
    products,
    filter?.gender,
    filter?.isNew,
    filter?.isActive,
    filter?.category,
    filter?.isBestseller,
  ]);

  return { data, loading, error, refetch: refreshProductsFromSupabase };
};

export const useParfum = (id?: string) => {
  const products = useProducts();

  useEffect(() => {
    if (products.length === 0) {
      refreshProductsFromSupabase();
    }
  }, [products.length]);

  const data = useMemo(() => {
    if (!id) return null;
    const match = products.find((p) => p.id === id);
    return match ? mapLocalToParfum(match) : null;
  }, [products, id]);

  return { data, loading: false, error: null, refetch: refreshProductsFromSupabase };
};
