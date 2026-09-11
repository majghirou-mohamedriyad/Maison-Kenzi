/**
 * Hook de Suivi de Commande en Temps Réel — Maison Kenzi
 *
 * Permet aux clients de consulter le statut de leur commande à partir de leur
 * code généré automatiquement (ex: MK-849201).
 * Intègre la synchronisation en direct (Realtime) dès que l'administrateur
 * modifie le statut dans le panneau d'administration.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { Order } from "@/types/database";

const LAST_ORDER_KEY = "mk_last_order_number";

export const saveLastOrderNumber = (orderNumber: string) => {
  try {
    if (orderNumber) {
      localStorage.setItem(LAST_ORDER_KEY, orderNumber.trim().toUpperCase());
    }
  } catch (e) {
    console.warn("Impossible de sauvegarder le code de commande:", e);
  }
};

export const getLastOrderNumber = (): string | null => {
  try {
    return localStorage.getItem(LAST_ORDER_KEY);
  } catch (e) {
    return null;
  }
};

export const useOrderTracking = (initialOrderNumber?: string) => {
  const [orderNumberInput, setOrderNumberInput] = useState(initialOrderNumber || "");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const fetchOrder = useCallback(async (code: string) => {
    const raw = code.trim().toUpperCase();
    if (!raw) {
      setOrder(null);
      setError("Veuillez saisir un numéro de commande.");
      setSearched(true);
      return;
    }

    // Normaliser avec ou sans préfixe MK-
    const normalizedCode = raw.startsWith("MK-") ? raw : `MK-${raw}`;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const { data, error: dbError } = await supabase
        .from("orders")
        .select("*")
        .or(`order_number.ilike.${normalizedCode},order_number.ilike.${raw}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (dbError) {
        console.error("Erreur recherche commande Supabase:", dbError);
        setError("Une erreur est survenue lors de la recherche. Veuillez réessayer.");
        setOrder(null);
      } else if (!data) {
        setError(`Aucune commande trouvée avec la référence « ${raw} ». Vérifiez votre code ou contactez notre conciergerie.`);
        setOrder(null);
      } else {
        const orderData = data as unknown as Order;
        setOrder(orderData);
        saveLastOrderNumber(orderData.order_number);
      }
    } catch (err) {
      console.warn("Exception recherche commande:", err);
      setError("Impossible de contacter le service de suivi. Veuillez réessayer.");
      setOrder(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Recherche automatique si un code initial est fourni ou trouvé en mémoire
  useEffect(() => {
    if (initialOrderNumber) {
      setOrderNumberInput(initialOrderNumber);
      fetchOrder(initialOrderNumber);
    }
  }, [initialOrderNumber, fetchOrder]);

  // Écouteur Supabase Realtime pour mettre à jour la commande dès que l'admin change son statut
  useEffect(() => {
    if (!order?.id) return;

    const channel = supabase
      .channel(`order_tracking_${order.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "maisonkenzi",
          table: "orders",
          filter: `id=eq.${order.id}`,
        },
        (payload) => {
          if (payload.new) {
            setOrder((prev) => (prev ? { ...prev, ...(payload.new as unknown as Order) } : (payload.new as unknown as Order)));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order?.id]);

  return {
    orderNumberInput,
    setOrderNumberInput,
    order,
    loading,
    error,
    searched,
    fetchOrder,
    lastSavedOrderNumber: getLastOrderNumber(),
  };
};
