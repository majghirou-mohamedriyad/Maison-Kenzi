import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { OrderItem, Size } from "@/types/database";

export type FlaconRow = {
  size: Size;
  stock: number;
  low_threshold: number;
  updated_at: string;
};

export type FlaconStats = {
  size: Size;
  label: string;
  initialStock: number;
  stock: number; // net remaining available = initialStock - used
  used: number;
  low_threshold: number;
  isLow: boolean;
};

const LABELS: Record<Size, string> = {
  "5ml": "Flacons 5ml",
  "10ml": "Flacons 10ml",
  full: "Bouteilles complètes",
};

/** Normalize format size string (e.g. "10 ML", "10ml", "5 ml") to strict Size key */
const normalizeSize = (rawSize?: string): Size | null => {
  if (!rawSize) return null;
  const s = rawSize.toLowerCase().replace(/\s+/g, "");
  if (s.includes("5ml")) return "5ml";
  if (s.includes("10ml")) return "10ml";
  if (s.includes("full") || s.includes("bouteille")) return "full";
  return null;
};

export const useFlaconnage = () => {
  const [rows, setRows] = useState<FlaconRow[]>([]);
  const [used, setUsed] = useState<Record<Size, number>>({ "5ml": 0, "10ml": 0, full: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [flaconRes, ordersRes] = await Promise.all([
        supabase.from("flaconnage").select("*").order("size"),
        supabase.from("orders").select("items, status").neq("status", "annulee"),
      ]);
      if (flaconRes.error) {
        console.warn("Table flaconnage indisponible ou vide:", flaconRes.error.message);
      }
      if (ordersRes.error) {
        console.warn("Table orders indisponible:", ordersRes.error.message);
      }

      const acc: Record<Size, number> = { "5ml": 0, "10ml": 0, full: 0 };
      (ordersRes.data ?? []).forEach((o) => {
        const items = (o.items ?? []) as OrderItem[];
        items.forEach((it) => {
          const key = normalizeSize(it.size);
          if (key && key in acc) {
            acc[key] += Number(it.quantity || 1);
          }
        });
      });

      const defaultRows: FlaconRow[] = [
        { size: "5ml", stock: 100, low_threshold: 15, updated_at: new Date().toISOString() },
        { size: "10ml", stock: 80, low_threshold: 15, updated_at: new Date().toISOString() },
        { size: "full", stock: 50, low_threshold: 10, updated_at: new Date().toISOString() },
      ];

      const validRows =
        flaconRes.data && flaconRes.data.length > 0
          ? ((flaconRes.data as FlaconRow[]).filter((r) => (r.size as string) !== "20ml"))
          : defaultRows;

      setRows(validRows);
      setUsed(acc);
    } catch (e) {
      console.error("Erreur flaconnage:", e);
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const update = async (size: Size, patch: Partial<Pick<FlaconRow, "stock" | "low_threshold">>) => {
    const { error: err } = await supabase.from("flaconnage").update(patch).eq("size", size);
    if (err) return { error: err.message };
    await load();
    return { ok: true };
  };

  const stats: FlaconStats[] = rows.map((r) => {
    const usedQty = used[r.size] ?? 0;
    const remainingStock = Math.max(0, r.stock - usedQty);

    return {
      size: r.size,
      label: LABELS[r.size] ?? r.size,
      initialStock: r.stock,
      stock: remainingStock,
      used: usedQty,
      low_threshold: r.low_threshold,
      isLow: remainingStock <= r.low_threshold,
    };
  });

  return { stats, loading, error, refetch: load, update };
};
