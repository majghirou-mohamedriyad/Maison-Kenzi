import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Gender, Parfum } from "@/types/database";
import { getProducts } from "@/store/useProductStore";

export type ParfumFilter = {
  gender?: Gender;
  isNew?: boolean;
  isBestseller?: boolean;
  isActive?: boolean;
  category?: string;
};

// Convert products from useProductStore to database Parfum format with live images and stock
const formatStaticParfums = (): Parfum[] => {
  const products = getProducts();
  return products.map((p) => {
    const isFull = (p.sale_mode ?? "decant") === "full_bottle" || p.category === "deodorants-stick" || p.category === "packs";
    const fullStock = p.full_bottle_stock ?? 0;
    const decantStock = (p.stock_5ml ?? 0) + (p.stock_10ml ?? 0);
    const totalStock = isFull ? fullStock : decantStock;
    const inStock = (p.active ?? true) && totalStock > 0;

    return {
      id: p.id,
      name: p.name,
      maison: p.maison,
      gender: p.gender,
      category: p.category,
      description: p.description,
      notes_tete: p.notes?.tete ?? [],
      notes_coeur: p.notes?.coeur ?? [],
      notes_fond: p.notes?.fond ?? [],
      price_5ml: p.prices?.['5ml'] ?? 0,
      price_10ml: p.prices?.['10ml'] ?? 0,
      image_label: p.imageLabel,
      image_url: p.image_url ?? null,
      is_active: inStock,
      is_new: !!p.isNew,
      is_bestseller: !!p.isBestseller,
      stock_status: inStock ? 'actif' : 'rupture',
      sale_mode: isFull ? 'full_bottle' : (p.sale_mode ?? 'decant'),
      full_bottle_price: p.full_bottle_price ?? p.prices?.['5ml'] ?? null,
      full_bottle_volume_ml: p.full_bottle_volume_ml ?? (p.sale_mode === 'full_bottle' ? 50 : null),
      full_bottle_stock: fullStock,
      stock_5ml: p.stock_5ml ?? 0,
      stock_10ml: p.stock_10ml ?? 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  });
};

const getActiveBestsellerIds = (): string[] => {
  try {
    const saved = localStorage.getItem("tabat_bestseller_ids");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [
    '9-pm-night-out-afnan',
    'le-beau-le-parfum',
    'valentino-born-in-roma-intense',
    'stronger-with-you-intensely',
  ];
};

export const useParfums = (filter?: ParfumFilter) => {
  const [data, setData] = useState<Parfum[]>(() => formatStaticParfums());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = JSON.stringify(filter ?? {});

  const load = useCallback(async () => {
    setError(null);
    const bestsellerIds = getActiveBestsellerIds();
    const localParfums = formatStaticParfums();

    // Immediately update with local items synchronously for 0ms delay
    let immediate = localParfums;
    if (filter?.gender) immediate = immediate.filter((p) => p.gender === filter.gender);
    if (filter?.isNew !== undefined) immediate = immediate.filter((p) => p.is_new === filter.isNew);
    if (filter?.isActive !== undefined) immediate = immediate.filter((p) => p.is_active === filter.isActive);
    if (filter?.category) immediate = immediate.filter((p) => p.category === filter.category);
    if (filter?.isBestseller) {
      immediate = immediate
        .filter((p) => bestsellerIds.includes(p.id))
        .sort((a, b) => bestsellerIds.indexOf(a.id) - bestsellerIds.indexOf(b.id));
    }
    setData(immediate);

    try {
      let q = supabase.from("parfums").select("*").order("created_at", { ascending: false });
      if (filter?.gender) q = q.eq("gender", filter.gender);
      if (filter?.isNew !== undefined) q = q.eq("is_new", filter.isNew);
      if (filter?.isActive !== undefined) q = q.eq("is_active", filter.isActive);
      const { data: rows, error: err } = await q;

      const localMap = new Map(localParfums.map((p) => [p.id, p]));
      let merged: Parfum[] = [];

      if (!err && rows && rows.length > 0) {
        const supabaseRows = rows as unknown as Parfum[];
        const processedIds = new Set<string>();

        supabaseRows.forEach((row) => {
          const localOverride = localMap.get(row.id);
          if (localOverride) {
            merged.push({
              ...row,
              ...localOverride,
              image_url: localOverride.image_url || row.image_url,
            });
            processedIds.add(row.id);
          } else {
            merged.push(row);
            processedIds.add(row.id);
          }
        });

        localParfums.forEach((p) => {
          if (!processedIds.has(p.id)) {
            merged.push(p);
          }
        });
      } else {
        merged = localParfums;
      }

      let result = merged;

      if (filter?.gender) result = result.filter((p) => p.gender === filter.gender);
      if (filter?.isNew !== undefined) result = result.filter((p) => p.is_new === filter.isNew);
      if (filter?.isActive !== undefined) result = result.filter((p) => p.is_active === filter.isActive);
      if (filter?.category) result = result.filter((p) => p.category === filter.category);

      if (filter?.isBestseller) {
        result = result
          .filter((p) => bestsellerIds.includes(p.id))
          .sort((a, b) => bestsellerIds.indexOf(a.id) - bestsellerIds.indexOf(b.id));
      }

      setData(result);
    } catch {
      setData(immediate);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Live real-time update listeners across tabs and components
  useEffect(() => {
    const handleUpdate = () => load();
    window.addEventListener("tabat_bestsellers_updated", handleUpdate);
    window.addEventListener("tabat_products_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    // Unique Supabase Realtime channel topic per component instance
    const channelTopic = `parfums_live_${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelTopic)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "parfums" },
        () => {
          load();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener("tabat_bestsellers_updated", handleUpdate);
      window.removeEventListener("tabat_products_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      supabase.removeChannel(channel);
    };
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
};

export const useParfum = (id?: string) => {
  const [data, setData] = useState<Parfum | null>(() => {
    if (!id) return null;
    const statics = formatStaticParfums();
    return statics.find((p) => p.id === id) ?? null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItem = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }
    setError(null);
    const statics = formatStaticParfums();
    const localFound = statics.find((p) => p.id === id) ?? null;

    // Immediately update with local item for instant 0ms feedback
    if (localFound) {
      setData(localFound);
    }

    try {
      const { data: row, error: err } = await supabase
        .from("parfums")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!err && row) {
        const dbParfum = row as unknown as Parfum;
        if (localFound) {
          setData({
            ...dbParfum,
            ...localFound,
            image_url: localFound.image_url || dbParfum.image_url,
          });
        } else {
          setData(dbParfum);
        }
      } else {
        setData(localFound);
      }
    } catch {
      setData(localFound);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  useEffect(() => {
    if (!id) return;
    const handleUpdate = () => fetchItem();
    window.addEventListener("tabat_products_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    const channelTopic = `parfum_live_${id}_${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(channelTopic)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "parfums", filter: `id=eq.${id}` },
        () => {
          fetchItem();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener("tabat_products_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      supabase.removeChannel(channel);
    };
  }, [fetchItem, id]);

  return { data, loading, error, refetch: fetchItem };
};

/** Helper to fetch parfums by id list (for cart & checkout display) */
export const fetchParfumsByIds = async (ids: string[]): Promise<Parfum[]> => {
  if (!ids.length) return [];
  const statics = formatStaticParfums();
  const staticMap = new Map(statics.map((p) => [p.id, p]));

  try {
    const { data, error } = await supabase.from("parfums").select("*").in("id", ids);
    if (!error && data && data.length > 0) {
      return (data as unknown as Parfum[]).map((row) => {
        const local = staticMap.get(row.id);
        return local ? { ...row, ...local, image_url: local.image_url || row.image_url } : row;
      });
    }
  } catch {
    // fallback
  }

  return statics.filter((p) => ids.includes(p.id));
};
