import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Order, OrderStatus } from "@/types/database";

export const useAdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setOrders((data ?? []) as unknown as Order[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    // 1. Update status of target order
    const { error: err } = await supabase.from("orders").update({ status }).eq("id", id);
    if (err) return { error: err.message };

    // 2. If status is set to "livree" (Delivered), automatically create or update Customer in customers table
    if (status === "livree") {
      const targetOrder = orders.find((o) => o.id === id);
      if (targetOrder) {
        const clientEmail =
          targetOrder.customer_email ||
          `${targetOrder.customer_name.toLowerCase().replace(/[^a-z0-9]/g, "") || "client"}@client.maisonkenzi.ma`;
        const clientPhone = targetOrder.customer_phone?.trim() || "";

        try {
          // Check if customer already exists in database
          let query = supabase.from("customers").select("*");
          if (clientPhone) {
            query = query.or(`phone.eq.${clientPhone},email.eq.${clientEmail}`);
          } else {
            query = query.eq("email", clientEmail);
          }
          const { data: existingCustomer } = await query.maybeSingle();

          if (existingCustomer) {
            await supabase
              .from("customers")
              .update({
                name: targetOrder.customer_name,
                phone: targetOrder.customer_phone || existingCustomer.phone,
                address: targetOrder.customer_address || existingCustomer.address,
                total_orders: (existingCustomer.total_orders || 0) + 1,
                total_spent: Number(existingCustomer.total_spent || 0) + Number(targetOrder.total_amount || 0),
              })
              .eq("id", existingCustomer.id);
          } else {
            await supabase.from("customers").insert([
              {
                email: clientEmail,
                name: targetOrder.customer_name,
                phone: targetOrder.customer_phone,
                address: targetOrder.customer_address,
                total_orders: 1,
                total_spent: Number(targetOrder.total_amount || 0),
              },
            ]);
          }
        } catch (cErr) {
          console.warn("Automated customer upsert on order delivery:", cErr);
        }
      }
    }

    await load();
    return { ok: true };
  };

  const updateMultipleOrderStatus = async (ids: string[], status: OrderStatus) => {
    if (ids.length === 0) return { ok: true };
    const { error: err } = await supabase
      .from("orders")
      .update({ status })
      .in("id", ids);
    if (err) return { error: err.message };

    // Si le statut est "livree", synchroniser les clients concernes
    if (status === "livree") {
      for (const id of ids) {
        const targetOrder = orders.find((o) => o.id === id);
        if (targetOrder) {
          const clientEmail =
            targetOrder.customer_email ||
            `${targetOrder.customer_name.toLowerCase().replace(/[^a-z0-9]/g, "") || "client"}@client.maisonkenzi.ma`;
          const clientPhone = targetOrder.customer_phone?.trim() || "";

          try {
            let query = supabase.from("customers").select("*");
            if (clientPhone) {
              query = query.or(`phone.eq.${clientPhone},email.eq.${clientEmail}`);
            } else {
              query = query.eq("email", clientEmail);
            }
            const { data: existingCustomer } = await query.maybeSingle();

            if (existingCustomer) {
              await supabase
                .from("customers")
                .update({
                  name: targetOrder.customer_name,
                  phone: targetOrder.customer_phone || existingCustomer.phone,
                  address: targetOrder.customer_address || existingCustomer.address,
                  total_orders: (existingCustomer.total_orders || 0) + 1,
                  total_spent: Number(existingCustomer.total_spent || 0) + Number(targetOrder.total_amount || 0),
                })
                .eq("id", existingCustomer.id);
            } else {
              await supabase.from("customers").insert([
                {
                  email: clientEmail,
                  name: targetOrder.customer_name,
                  phone: targetOrder.customer_phone,
                  address: targetOrder.customer_address,
                  total_orders: 1,
                  total_spent: Number(targetOrder.total_amount || 0),
                },
              ]);
            }
          } catch (cErr) {
            console.warn("Automated customer upsert on bulk delivery:", cErr);
          }
        }
      }
    }

    await load();
    return { ok: true };
  };

  const deleteMultipleOrders = async (ids: string[]) => {
    if (ids.length === 0) return { ok: true };
    const { error: err } = await supabase.from("orders").delete().in("id", ids);
    if (err) return { error: err.message };
    await load();
    return { ok: true };
  };

  const deleteOrder = async (id: string) => {
    const { error: err } = await supabase.from("orders").delete().eq("id", id);
    if (err) return { error: err.message };
    await load();
    return { ok: true };
  };

  return {
    orders,
    loading,
    error,
    refetch: load,
    updateOrderStatus,
    updateMultipleOrderStatus,
    deleteOrder,
    deleteMultipleOrders,
  };
};
