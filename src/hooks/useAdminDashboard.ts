import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { OrderItem } from "@/types/database";

type Kpis = {
  revenueThisMonth: number;
  revenueLastMonth: number;
  ordersThisMonth: number;
  ordersInProgress: number;
  activeParfums: number;
  rupture: number;
  customers: number;
  customersThisMonth: number;
};

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

export const useDashboardKPIs = () => {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const now = new Date();
        const thisStart = startOfMonth(now).toISOString();
        const lastStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1, 1)).toISOString();
        const lastEnd = thisStart;

        const [activeRes, ruptureRes, ordersThisRes, ordersLastRes, inProgressRes, allOrdersRes, dbCustomersRes] =
          await Promise.all([
            supabase.from("parfums").select("id", { count: "exact", head: true }).eq("is_active", true),
            supabase.from("parfums").select("id", { count: "exact", head: true }).eq("stock_status", "rupture"),
            supabase.from("orders").select("total_amount, created_at").neq("status", "annulee").gte("created_at", thisStart),
            supabase.from("orders").select("total_amount").neq("status", "annulee").gte("created_at", lastStart).lt("created_at", lastEnd),
            supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "en_attente"),
            supabase.from("orders").select("customer_phone, customer_email, customer_name, created_at"),
            supabase.from("customers").select("id, phone, email, name, created_at"),
          ]);

        const sum = (rows: { total_amount: number }[] | null) =>
          (rows ?? []).reduce((acc, r) => acc + Number(r.total_amount ?? 0), 0);

        // Aggregate unique clients from both orders and customers table
        const clientKeys = new Set<string>();
        const clientMonthKeys = new Set<string>();

        (dbCustomersRes.data ?? []).forEach((c) => {
          const rawPhone = c.phone ? c.phone.replace(/[^0-9]/g, "") : "";
          const key = rawPhone || c.email?.toLowerCase() || c.name?.toLowerCase();
          if (key) {
            clientKeys.add(key);
            if (c.created_at && new Date(c.created_at) >= new Date(thisStart)) {
              clientMonthKeys.add(key);
            }
          }
        });

        (allOrdersRes.data ?? []).forEach((o) => {
          const rawPhone = o.customer_phone ? o.customer_phone.replace(/[^0-9]/g, "") : "";
          const emailKey = o.customer_email && !o.customer_email.endsWith("@client.tabat.ma") ? o.customer_email.toLowerCase() : "";
          const nameKey = o.customer_name?.trim().toLowerCase() || "client";
          const key = rawPhone || emailKey || nameKey;
          if (key) {
            clientKeys.add(key);
            if (o.created_at && new Date(o.created_at) >= new Date(thisStart)) {
              clientMonthKeys.add(key);
            }
          }
        });

        if (!alive) return;
        setKpis({
          activeParfums: activeRes.count ?? 0,
          rupture: ruptureRes.count ?? 0,
          revenueThisMonth: sum(ordersThisRes.data as { total_amount: number }[] | null),
          revenueLastMonth: sum(ordersLastRes.data as { total_amount: number }[] | null),
          ordersThisMonth: (ordersThisRes.data ?? []).length,
          ordersInProgress: inProgressRes.count ?? 0,
          customers: clientKeys.size,
          customersThisMonth: clientMonthKeys.size,
        });
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Erreur de chargement");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { kpis, loading, error };
};

export type RevenuePoint = { month: string; revenue: number };

const MONTHS_FR = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];

export const useRevenueChart = () => {
  const [data, setData] = useState<RevenuePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      const now = new Date();
      const start = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 5, 1));
      const { data: rows, error: err } = await supabase
        .from("orders")
        .select("total_amount, created_at")
        .neq("status", "annulee")
        .gte("created_at", start.toISOString());
      if (!alive) return;
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      const buckets = new Map<string, number>();
      for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
        buckets.set(`${d.getFullYear()}-${d.getMonth()}`, 0);
      }
      (rows ?? []).forEach((r) => {
        const d = new Date(r.created_at);
        const k = `${d.getFullYear()}-${d.getMonth()}`;
        buckets.set(k, (buckets.get(k) ?? 0) + Number(r.total_amount || 0));
      });
      const points: RevenuePoint[] = Array.from(buckets.entries()).map(([k, v]) => {
        const [, m] = k.split("-").map(Number);
        return { month: MONTHS_FR[m], revenue: v };
      });
      setData(points);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { data, loading, error };
};

export type TopProduct = { parfum_name: string; size: string; qty: number; revenue: number };

export const useTopProducts = () => {
  const [data, setData] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      const { data: rows, error: err } = await supabase
        .from("orders")
        .select("items")
        .neq("status", "annulee");

      if (!alive) return;
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      const agg = new Map<string, TopProduct>();
      (rows ?? []).forEach((r) => {
        const items = (r.items ?? []) as (OrderItem & { name?: string; price?: number })[];
        items.forEach((it) => {
          const parfumName = it.parfum_name || it.name || "Parfum Maison Kenzi";
          const sizeStr = it.size || "10ml";
          const qty = Number(it.quantity || 1);

          // Calculate line total accurately without resulting in NaN
          const itemPrice = Number(it.price || it.unit_price || 0);
          const lineTotal = Number(it.subtotal ?? (itemPrice * qty));

          const key = `${parfumName}|${sizeStr}`;
          const cur = agg.get(key);
          if (cur) {
            cur.qty += qty;
            cur.revenue += lineTotal;
          } else {
            agg.set(key, {
              parfum_name: parfumName,
              size: sizeStr,
              qty: qty,
              revenue: lineTotal,
            });
          }
        });
      });

      setData(Array.from(agg.values()).sort((a, b) => b.qty - a.qty).slice(0, 5));
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  return { data, loading, error };
};
