/**
 * Service de Gestion des Clients — Maison Kenzi
 *
 * Fournit les fonctions d'interrogation, synchronisation, agrégation des commandes
 * et gestion CRUD des profils clients (Nom, Prénom, Email, Téléphone, Date de Naissance).
 * Combine les enregistrements de la table 'customers', les commandes et les métadonnées auth.
 */

import { supabase } from "@/lib/supabase";
import type { CustomerProfile } from "@/types/customer";

export interface AdminCustomerItem extends CustomerProfile {
  orders_count: number;
  total_spent: number;
  last_order_date?: string;
  source: "compte" | "commande" | "local";
}

const LOCAL_CUSTOMERS_KEY = "mk_admin_local_customers";

/**
 * Récupère tous les clients avec agrégation de leurs statistiques de commandes
 */
export async function fetchAdminCustomers(): Promise<AdminCustomerItem[]> {
  const customerMap = new Map<string, AdminCustomerItem>();

  // 1. Récupération des clients enregistrés dans la table 'customers'
  try {
    const { data: dbCustomers, error } = await supabase
      .from("customers")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(dbCustomers)) {
      dbCustomers.forEach((c: any) => {
        const emailKey = (c.email || "").trim().toLowerCase();
        if (emailKey) {
          customerMap.set(emailKey, {
            id: c.id,
            email: c.email,
            first_name: c.first_name || "",
            last_name: c.last_name || "",
            phone: c.phone || "",
            birth_date: c.birth_date || "",
            address: c.address || "",
            city: c.city || "",
            country: c.country || "Belgique",
            created_at: c.created_at || new Date().toISOString(),
            updated_at: c.updated_at,
            orders_count: 0,
            total_spent: 0,
            source: "compte",
          });
        }
      });
    }
  } catch (err) {
    console.warn("Erreur lors de la lecture de la table customers :", err);
  }

  // 2. Récupération des clients sauvegardés localement (mode hors-ligne ou fallback)
  if (typeof window !== "undefined") {
    try {
      const singleProfile = localStorage.getItem("mk_customer_profile");
      if (singleProfile) {
        const p = JSON.parse(singleProfile);
        if (p && p.email) {
          const emailKey = p.email.trim().toLowerCase();
          if (!customerMap.has(emailKey)) {
            customerMap.set(emailKey, {
              id: p.id || `local_${Date.now()}`,
              email: p.email,
              first_name: p.first_name || "",
              last_name: p.last_name || "",
              phone: p.phone || "",
              birth_date: p.birth_date || "",
              address: p.address || "",
              city: p.city || "",
              country: p.country || "Belgique",
              created_at: p.created_at || new Date().toISOString(),
              orders_count: 0,
              total_spent: 0,
              source: "local",
            });
          }
        }
      }

      const multiProfiles = localStorage.getItem(LOCAL_CUSTOMERS_KEY);
      if (multiProfiles) {
        const list = JSON.parse(multiProfiles);
        if (Array.isArray(list)) {
          list.forEach((p) => {
            const emailKey = (p.email || "").trim().toLowerCase();
            if (emailKey && !customerMap.has(emailKey)) {
              customerMap.set(emailKey, {
                ...p,
                orders_count: 0,
                total_spent: 0,
                source: "local",
              });
            }
          });
        }
      }
    } catch {
      // Ignorer les erreurs de parsing localStorage
    }
  }

  // 3. Récupération et agrégation des commandes pour calculer le total dépensé et les commandes passées
  try {
    const { data: orders, error: ordersErr } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, customer_email, customer_phone, customer_address, total_amount, status, created_at")
      .order("created_at", { ascending: false });

    if (!ordersErr && Array.isArray(orders)) {
      orders.forEach((ord: any) => {
        const emailKey = (ord.customer_email || "").trim().toLowerCase();
        const amount = Number(ord.total_amount) || 0;
        const ordDate = ord.created_at;

        if (emailKey) {
          if (customerMap.has(emailKey)) {
            const current = customerMap.get(emailKey)!;
            current.orders_count += 1;
            current.total_spent += amount;
            if (!current.last_order_date || new Date(ordDate) > new Date(current.last_order_date)) {
              current.last_order_date = ordDate;
            }
            if (!current.phone && ord.customer_phone) {
              current.phone = ord.customer_phone;
            }
            if (!current.address && ord.customer_address) {
              current.address = ord.customer_address;
            }
          } else {
            // Client ayant commandé sans créer de compte formel préalable
            const nameParts = (ord.customer_name || "").trim().split(" ");
            const firstName = nameParts[0] || "";
            const lastName = nameParts.slice(1).join(" ") || "";

            customerMap.set(emailKey, {
              id: `order_client_${ord.id}`,
              email: ord.customer_email,
              first_name: firstName,
              last_name: lastName,
              phone: ord.customer_phone || "",
              birth_date: "",
              address: ord.customer_address || "",
              city: "",
              country: "Belgique",
              created_at: ordDate,
              orders_count: 1,
              total_spent: amount,
              last_order_date: ordDate,
              source: "commande",
            });
          }
        }
      });
    }
  } catch (ordersFetchErr) {
    console.warn("Note lecture commandes pour clients :", ordersFetchErr);
  }

  return Array.from(customerMap.values()).sort((a, b) => {
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
}

/**
 * Enregistre ou met à jour un client dans Supabase et le stockage local
 */
export async function saveCustomer(customer: Partial<CustomerProfile>): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = {
      email: customer.email?.trim().toLowerCase(),
      first_name: customer.first_name?.trim() || "",
      last_name: customer.last_name?.trim() || "",
      phone: customer.phone?.trim() || "",
      birth_date: customer.birth_date?.trim() || "",
      address: customer.address?.trim() || "",
      city: customer.city?.trim() || "",
      country: customer.country?.trim() || "Belgique",
      updated_at: new Date().toISOString(),
    };

    if (!payload.email) {
      return { success: false, error: "L'adresse email est requise." };
    }

    const { error } = await supabase.from("customers").upsert(payload, { onConflict: "email" });

    if (error) {
      console.warn("Erreur Supabase saveCustomer :", error);
    }

    // Sauvegarde miroir local
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(LOCAL_CUSTOMERS_KEY);
        let list: any[] = saved ? JSON.parse(saved) : [];
        const existingIdx = list.findIndex((c) => c.email?.toLowerCase() === payload.email);
        if (existingIdx >= 0) {
          list[existingIdx] = { ...list[existingIdx], ...payload };
        } else {
          list.push({ id: `cust_${Date.now()}`, ...payload, created_at: new Date().toISOString() });
        }
        localStorage.setItem(LOCAL_CUSTOMERS_KEY, JSON.stringify(list));
      } catch {
        // Ignorer
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Erreur lors de la sauvegarde du client." };
  }
}

/**
 * Supprime un client de la base de données
 */
export async function deleteCustomer(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();
    const { error } = await supabase.from("customers").delete().eq("email", cleanEmail);
    if (error) {
      console.warn("Erreur suppression Supabase :", error);
    }

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(LOCAL_CUSTOMERS_KEY);
        if (saved) {
          let list: any[] = JSON.parse(saved);
          list = list.filter((c) => c.email?.toLowerCase() !== cleanEmail);
          localStorage.setItem(LOCAL_CUSTOMERS_KEY, JSON.stringify(list));
        }
      } catch {
        // Ignorer
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Erreur lors de la suppression." };
  }
}
