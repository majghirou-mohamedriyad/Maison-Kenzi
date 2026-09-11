import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type AppSettings = {
  maintenance_mode: boolean;
  maintenance_message: string;
  instagram_url: string;
  whatsapp_phone: string;
  store_phone?: string;
  bot_enabled: boolean;
  bot_name: string;
  bot_welcome: string;
  store_name: string;
};

const DEFAULTS: AppSettings = {
  maintenance_mode: false,
  maintenance_message: "Nous préparons une nouvelle collection. Revenez très bientôt.",
  instagram_url: "https://instagram.com/maisonkenzi",
  whatsapp_phone: "212752850156",
  bot_enabled: true,
  bot_name: "Conseillère Maison Kenzi",
  bot_welcome: "Bienvenue chez Maison Kenzi. Comment puis-je vous guider dans votre découverte olfactive ?",
  store_name: "Maison Kenzi",
};

const STORAGE_KEY = "maisonkenzi_app_settings";
const UPDATE_EVENT = "maisonkenzi_settings_updated";

const getLocalSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULTS, ...parsed };
    }
  } catch {}
  return DEFAULTS;
};

export const useAppSettings = () => {
  const [settings, setSettings] = useState<AppSettings>(getLocalSettings);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const handleLocalUpdate = () => {
      if (active) {
        setSettings(getLocalSettings());
      }
    };

    window.addEventListener(UPDATE_EVENT, handleLocalUpdate);
    window.addEventListener("storage", (e) => {
      if (e.key === STORAGE_KEY && active) {
        setSettings(getLocalSettings());
      }
    });

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("app_settings")
          .select("*")
          .eq("id", true)
          .maybeSingle();

        if (active && data && !error) {
          const merged = { ...DEFAULTS, ...getLocalSettings(), ...(data as Partial<AppSettings>) };
          setSettings(merged);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          } catch {}
        }
      } catch (err) {
        console.warn("Exception fetching app_settings:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSettings();

    // Souscription Supabase Realtime pour synchronisation instantanée des réglages
    const channel = supabase
      .channel("maisonkenzi_settings_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "maisonkenzi", table: "app_settings" },
        (payload) => {
          if (active && payload.new) {
            const merged = { ...DEFAULTS, ...getLocalSettings(), ...(payload.new as Partial<AppSettings>) };
            setSettings(merged);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            } catch {}
          }
        }
      )
      .subscribe();

    return () => {
      active = false;
      window.removeEventListener(UPDATE_EVENT, handleLocalUpdate);
      supabase.removeChannel(channel);
    };
  }, []);

  const update = async (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event(UPDATE_EVENT));
    } catch {}

    // Upsert dans Supabase pour persistance sur le serveur
    try {
      const { store_name, store_phone, ...dbPayload } = patch;
      const { error } = await supabase
        .from("app_settings")
        .upsert({ id: true, ...dbPayload } as any);

      if (error) {
        console.error("Erreur mise à jour settings Supabase:", error);
      }
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return { settings, loading, update };
};
