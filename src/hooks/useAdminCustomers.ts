import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Customer, Order } from "@/types/database";

export type EnrichedCustomer = Customer & {
  last_order_date?: string;
  city?: string;
  orders?: Order[];
  average_basket?: number;
};

const getHiddenCustomerKeys = (): Set<string> => {
  try {
    const raw = localStorage.getItem("tabat_hidden_customers");
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    // ignore
  }
  return new Set();
};

const saveHiddenCustomerKey = (keys: string[]) => {
  try {
    const existing = getHiddenCustomerKeys();
    keys.forEach((k) => {
      if (k) existing.add(k.trim().toLowerCase());
    });
    localStorage.setItem("tabat_hidden_customers", JSON.stringify(Array.from(existing)));
  } catch {
    // ignore
  }
};

export const useAdminCustomers = () => {
  const [customers, setCustomers] = useState<EnrichedCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const hidden = getHiddenCustomerKeys();

      // 1. Fetch customers table
      const { data: dbCustomers, error: custErr } = await supabase
        .from("customers")
        .select("*")
        .order("created_at", { ascending: false });

      // 2. Fetch orders table to aggregate real purchases and history
      const { data: dbOrders, error: ordErr } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      const ordersList = (dbOrders ?? []) as unknown as Order[];
      const customersMap = new Map<string, EnrichedCustomer>();

      // Populate from customers table
      if (!custErr && dbCustomers) {
        dbCustomers.forEach((c) => {
          const rawPhone = c.phone ? c.phone.replace(/[^0-9]/g, "") : "";
          const key = rawPhone || c.email?.toLowerCase() || c.name?.toLowerCase();
          
          // Check if hidden/deleted
          if (key && !hidden.has(key) && !hidden.has(c.id) && !(c.phone && hidden.has(c.phone.toLowerCase())) && !(c.name && hidden.has(c.name.toLowerCase()))) {
            customersMap.set(key, {
              ...c,
              total_orders: Number(c.total_orders || 0),
              total_spent: Number(c.total_spent || 0),
              orders: [],
            });
          }
        });
      }

      // Aggregate from all orders (even express checkout orders that didn't create a customer row yet)
      ordersList.forEach((ord) => {
        const rawPhone = ord.customer_phone ? ord.customer_phone.replace(/[^0-9]/g, "") : "";
        const emailKey = ord.customer_email && !ord.customer_email.endsWith("@client.tabat.ma") ? ord.customer_email.toLowerCase() : "";
        const nameKey = ord.customer_name?.trim().toLowerCase() || "client";
        const key = rawPhone || emailKey || nameKey;

        // Skip if customer was deleted by admin
        if (hidden.has(key) || (ord.customer_phone && hidden.has(ord.customer_phone.toLowerCase())) || (ord.customer_name && hidden.has(ord.customer_name.toLowerCase())) || (rawPhone && hidden.has(rawPhone))) {
          return;
        }

        const existing = customersMap.get(key);
        const orderAmount = Number(ord.total_amount || 0);

        if (existing) {
          existing.orders = existing.orders || [];
          if (!existing.orders.some((o) => o.id === ord.id)) {
            existing.orders.push(ord);
          }
          if (!existing.phone && ord.customer_phone) existing.phone = ord.customer_phone;
          if (!existing.address && ord.customer_address) existing.address = ord.customer_address;
          if (!existing.name && ord.customer_name) existing.name = ord.customer_name;
          if (!existing.last_order_date || new Date(ord.created_at) > new Date(existing.last_order_date)) {
            existing.last_order_date = ord.created_at;
          }
        } else {
          customersMap.set(key, {
            id: `cust_${key}`,
            name: ord.customer_name || "Client Maison Kenzi",
            email: ord.customer_email || `${nameKey.replace(/[^a-z0-9]/g, "") || "client"}@client.tabat.ma`,
            phone: ord.customer_phone,
            address: ord.customer_address,
            total_orders: 1,
            total_spent: orderAmount,
            created_at: ord.created_at,
            last_order_date: ord.created_at,
            orders: [ord],
          });
        }
      });

      // Recalculate totals and average basket based on actual orders
      const list: EnrichedCustomer[] = Array.from(customersMap.values()).map((c) => {
        const custOrders = c.orders || [];
        const nonCancelled = custOrders.filter((o) => o.status !== "annulee");
        const realTotalOrders = custOrders.length > 0 ? custOrders.length : c.total_orders;
        const realTotalSpent = custOrders.length > 0
          ? nonCancelled.reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
          : Number(c.total_spent || 0);
        const avg = realTotalOrders > 0 ? Math.round(realTotalSpent / realTotalOrders) : realTotalSpent;

        return {
          ...c,
          total_orders: realTotalOrders,
          total_spent: realTotalSpent,
          average_basket: avg,
        };
      });

      // Sort by total spent desc
      list.sort((a, b) => b.total_spent - a.total_spent);
      setCustomers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des clients");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addCustomer = async (cust: Partial<Customer>) => {
    // Un-blacklist in case they were previously deleted
    try {
      const hidden = getHiddenCustomerKeys();
      if (cust.name) hidden.delete(cust.name.toLowerCase());
      if (cust.phone) {
        hidden.delete(cust.phone.toLowerCase());
        hidden.delete(cust.phone.replace(/[^0-9]/g, ""));
      }
      if (cust.email) hidden.delete(cust.email.toLowerCase());
      localStorage.setItem("tabat_hidden_customers", JSON.stringify(Array.from(hidden)));
    } catch {
      // ignore
    }

    const safeEmail = cust.email && cust.email.trim().length > 0
      ? cust.email.trim().toLowerCase()
      : `client_${Date.now()}_${Math.random().toString(36).slice(2, 7)}@tabat.ma`;

    const { error: err } = await supabase.from("customers").insert([
      {
        name: cust.name?.trim(),
        email: safeEmail,
        phone: cust.phone?.trim() || null,
        address: cust.address?.trim() || null,
        total_orders: 0,
        total_spent: 0,
      },
    ]);

    if (err) {
      if (err.message.includes("customers_email_key") || err.message.includes("duplicate key")) {
        return { error: "Un client avec cette adresse email existe déjà dans votre base de données." };
      }
      if (err.message.includes("customers_phone_key")) {
        return { error: "Un client avec ce numéro de téléphone existe déjà." };
      }
      return { error: err.message };
    }

    await load();
    return { ok: true };
  };

  const deleteCustomer = async (cust: EnrichedCustomer | string): Promise<{ ok: boolean; error?: string }> => {
    const customerObj = typeof cust === "string" ? customers.find((c) => c.id === cust) : cust;
    const customerId = typeof cust === "string" ? cust : cust.id;

    // Collect keys to blacklist locally
    const keysToBlacklist: string[] = [customerId];
    if (customerObj) {
      if (customerObj.id) keysToBlacklist.push(customerObj.id);
      if (customerObj.name) keysToBlacklist.push(customerObj.name.toLowerCase());
      if (customerObj.phone) {
        keysToBlacklist.push(customerObj.phone.toLowerCase());
        keysToBlacklist.push(customerObj.phone.replace(/[^0-9]/g, ""));
      }
      if (customerObj.email) keysToBlacklist.push(customerObj.email.toLowerCase());
    }

    saveHiddenCustomerKey(keysToBlacklist);

    // Instant local state optimistic removal
    setCustomers((prev) => prev.filter((c) => c.id !== customerId && (customerObj ? c.name !== customerObj.name : true)));

    // Try deleting from database if exists in `customers` table
    try {
      if (!customerId.startsWith("cust_")) {
        await supabase.from("customers").delete().eq("id", customerId);
      }
      if (customerObj?.phone) {
        await supabase.from("customers").delete().eq("phone", customerObj.phone);
      }
      if (customerObj?.name) {
        await supabase.from("customers").delete().eq("name", customerObj.name);
      }
    } catch (e) {
      console.warn("Could not delete from Supabase customers table:", e);
    }

    await load();
    return { ok: true };
  };

  return { customers, loading, error, refetch: load, addCustomer, deleteCustomer };
};
