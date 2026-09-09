import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Parfum } from "@/types/database";

export type ParfumInput = Omit<Parfum, "id" | "created_at" | "updated_at">;

export const useAdminParfums = () => {
  const [parfums, setParfums] = useState<Parfum[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("parfums")
      .select("*")
      .order("created_at", { ascending: false });
    if (err) setError(err.message);
    else setParfums((data ?? []) as unknown as Parfum[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createParfum = async (input: ParfumInput) => {
    const { data, error: err } = await supabase
      .from("parfums")
      .insert(input as never)
      .select()
      .single();
    if (err) return { error: err.message };
    await load();
    return { data: data as unknown as Parfum };
  };

  const updateParfum = async (id: string, patch: Partial<Parfum>) => {
    const { data, error: err } = await supabase
      .from("parfums")
      .update(patch as never)
      .eq("id", id)
      .select()
      .single();
    if (err) return { error: err.message };
    await load();
    return { data: data as unknown as Parfum };
  };

  const deleteParfum = async (id: string) => {
    const { error: err } = await supabase.from("parfums").delete().eq("id", id);
    if (err) return { error: err.message };
    await load();
    return { ok: true };
  };

  return { parfums, loading, error, refetch: load, createParfum, updateParfum, deleteParfum };
};
