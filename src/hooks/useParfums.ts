/**
 * Hook de Récupération des Parfums — Maison Kenzi
 *
 * Charge les parfums en temps réel depuis le schéma maisonkenzi de Supabase
 * et synchronise l'affichage avec l'espace administrateur.
 */

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Gender, Parfum } from "@/types/database";
import { getProducts, setProducts, type AdminParfum } from "@/store/useProductStore";
import { getParfumSeasons } from "@/lib/seasonsStore";

export type ParfumFilter = {
  gender?: Gender;
  isNew?: boolean;
  isBestseller?: boolean;
  isActive?: boolean;
  category?: string;
};

// Convertit les produits de la base de données Supabase vers le type Parfum de l'UI
const mapRowToParfum = (row: any): Parfum => {
  const isFull = (row.sale_mode ?? "decant") === "full_bottle" || row.category === "packs" || row.category === "deodorants-stick";
  const fullStock = Number(row.full_bottle_stock ?? 0);
  const decantStock = Number(row.stock_5ml ?? 0) + Number(row.stock_10ml ?? 0);
  const totalStock = isFull ? fullStock : decantStock;
  const inStock = (row.is_active ?? true) && (totalStock > 0 || (row.stock_status === 'actif'));

  return {
    id: row.id,
    name: row.name,
    maison: row.maison,
    gender: row.gender as Gender,
    category: row.category,
    seasons: getParfumSeasons(row),
    description: row.description || "",
    notes_tete: row.notes_tete ?? [],
    notes_coeur: row.notes_coeur ?? [],
    notes_fond: row.notes_fond ?? [],
    price_5ml: Number(row.price_5ml ?? 0),
    price_10ml: Number(row.price_10ml ?? 0),
    image_label: row.image_label || row.id,
    image_url: row.image_url ?? null,
    is_active: inStock,
    is_new: !!row.is_new,
    is_bestseller: !!row.is_bestseller,
    stock_status: inStock ? 'actif' : 'rupture',
    sale_mode: isFull ? 'full_bottle' : (row.sale_mode ?? 'decant'),
    full_bottle_price: row.full_bottle_price ? Number(row.full_bottle_price) : null,
    full_bottle_volume_ml: row.full_bottle_volume_ml ? Number(row.full_bottle_volume_ml) : (row.sale_mode === 'full_bottle' ? 50 : null),
    full_bottle_stock: fullStock,
    stock_5ml: Number(row.stock_5ml ?? 0),
    stock_10ml: Number(row.stock_10ml ?? 0),
    created_at: row.created_at || new Date().toISOString(),
    updated_at: row.updated_at || new Date().toISOString(),
  };
};

const mapLocalToParfum = (p: AdminParfum): Parfum => {
  const isFull = (p.sale_mode ?? "decant") === "full_bottle" || p.category === "packs" || p.category === "deodorants-stick";
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
    seasons: Array.isArray(p.seasons) ? p.seasons : [],
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
    full_bottle_price: p.full_bottle_price ?? null,
    full_bottle_volume_ml: p.full_bottle_volume_ml ?? null,
    full_bottle_stock: fullStock,
    stock_5ml: p.stock_5ml ?? 0,
    stock_10ml: p.stock_10ml ?? 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
};

export const useParfums = (filter?: ParfumFilter) => {
  const [data, setData] = useState<Parfum[]>(() => {
    const local = getProducts().map(mapLocalToParfum);
    if (!filter) return local;
    let res = local;
    if (filter.gender) res = res.filter((p) => p.gender === filter.gender);
    if (filter.isNew !== undefined) res = res.filter((p) => p.is_new === filter.isNew);
    if (filter.isActive !== undefined) res = res.filter((p) => p.is_active === filter.isActive);
    if (filter.category) res = res.filter((p) => p.category === filter.category);
    if (filter.isBestseller) res = res.filter((p) => p.is_bestseller);
    return res;
  });
  const [loading, setLoading] = useState<boolean>(() => data.length === 0);
  const [error, setError] = useState<string | null>(null);

  const key = JSON.stringify(filter ?? {});

  const load = useCallback(async () => {
    // Si on a déjà des données locales, ne pas afficher de loader bloquant
    if (data.length === 0) {
      setLoading(true);
    }
    setError(null);

    try {
      let q = supabase.from("parfums").select("*").order("created_at", { ascending: false });
      if (filter?.gender) q = q.eq("gender", filter.gender);
      if (filter?.isNew !== undefined) q = q.eq("is_new", filter.isNew);
      if (filter?.isActive !== undefined) q = q.eq("is_active", filter.isActive);
      if (filter?.category) q = q.eq("category", filter.category);

      // Timeout de sécurité de 3.5s
      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error("Timeout") }), 3500)
      );

      const res = await Promise.race([q, timeoutPromise]);
      const rows = res.data;
      const err = res.error;

      if (!err && Array.isArray(rows)) {
        const mapped = rows.map(mapRowToParfum);
        let filtered = mapped;
        if (filter?.isBestseller) {
          filtered = filtered.filter((p) => p.is_bestseller);
        }
        setData(filtered);

        if (!filter) {
          const currentLocal = getProducts();
          const adminProducts: AdminParfum[] = rows.map((r: any) => {
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

            return {
              id: r.id,
              name: r.name,
              maison: r.maison,
              gender: r.gender,
              category: r.category ?? localMatch?.category,
              seasons: parsedSeasons,
              description: r.description || "",
              notes: {
                tete: r.notes_tete ?? localMatch?.notes?.tete ?? [],
                coeur: r.notes_coeur ?? localMatch?.notes?.coeur ?? [],
                fond: r.notes_fond ?? localMatch?.notes?.fond ?? [],
              },
              prices: {
                '5ml': Number(r.price_5ml ?? localMatch?.prices?.['5ml'] ?? 0),
                '10ml': Number(r.price_10ml ?? localMatch?.prices?.['10ml'] ?? 0),
              },
              imageLabel: r.image_label || localMatch?.imageLabel || r.id,
              image_url: r.image_url ?? localMatch?.image_url ?? null,
              isNew: !!r.is_new,
              isBestseller: !!r.is_bestseller,
              sale_mode: r.sale_mode ?? localMatch?.sale_mode ?? 'full_bottle',
              full_bottle_price: r.full_bottle_price ? Number(r.full_bottle_price) : localMatch?.full_bottle_price ?? null,
              full_bottle_volume_ml: r.full_bottle_volume_ml ? Number(r.full_bottle_volume_ml) : localMatch?.full_bottle_volume_ml ?? null,
              full_bottle_stock: Number(r.full_bottle_stock ?? localMatch?.full_bottle_stock ?? 0),
              full_bottle_limited: !!r.full_bottle_limited,
              stock_5ml: Number(r.stock_5ml ?? localMatch?.stock_5ml ?? 0),
              stock_10ml: Number(r.stock_10ml ?? localMatch?.stock_10ml ?? 0),
              active: r.is_active ?? localMatch?.active ?? true,
            };
          });
          setProducts(adminProducts);
        }
      } else {
        // Fallback local
        let local = getProducts().map(mapLocalToParfum);
        if (filter?.gender) local = local.filter((p) => p.gender === filter.gender);
        if (filter?.isNew !== undefined) local = local.filter((p) => p.is_new === filter.isNew);
        if (filter?.isActive !== undefined) local = local.filter((p) => p.is_active === filter.isActive);
        if (filter?.category) local = local.filter((p) => p.category === filter.category);
        if (filter?.isBestseller) local = local.filter((p) => p.is_bestseller);
        setData(local);
      }
    } catch (e: any) {
      // Conserver les données locales en cas d'erreur
      const local = getProducts().map(mapLocalToParfum);
      if (local.length > 0) {
        setData(local);
      } else {
        setError(e?.message || "Erreur de chargement");
      }
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  // Synchronisation temps réel via écouteur d'événements
  useEffect(() => {
    const handleUpdate = () => load();
    window.addEventListener("maisonkenzi_products_updated", handleUpdate);
    return () => window.removeEventListener("maisonkenzi_products_updated", handleUpdate);
  }, [load]);

  return { data, loading, error, refetch: load };
};

export const useParfum = (id?: string) => {
  const [data, setData] = useState<Parfum | null>(() => {
    if (!id) return null;
    const local = getProducts().find((p) => p.id === id);
    return local ? mapLocalToParfum(local) : null;
  });
  const [loading, setLoading] = useState(() => !data);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) {
      setData(null);
      setLoading(false);
      return;
    }

    // Si on a déjà une version locale en cache, on ne bloque pas l'écran
    const localCached = getProducts().find((p) => p.id === id);
    if (localCached) {
      setData(mapLocalToParfum(localCached));
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const fetchPromise = supabase
        .from("parfums")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error("Timeout") }), 3500)
      );

      const res = await Promise.race([fetchPromise, timeoutPromise]);
      const row = res.data;
      const err = res.error;

      if (!err && row) {
        setData(mapRowToParfum(row));
      } else {
        const local = getProducts().find((p) => p.id === id);
        setData(local ? mapLocalToParfum(local) : null);
      }
    } catch (e: any) {
      const local = getProducts().find((p) => p.id === id);
      if (local) {
        setData(mapLocalToParfum(local));
      } else {
        setError(e?.message || "Erreur lors du chargement du parfum");
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, refetch: load };
};
