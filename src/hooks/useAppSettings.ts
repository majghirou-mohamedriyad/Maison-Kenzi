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
  maintenance_message: "Nous améliorons votre expérience. Revenez très bientôt.",
  instagram_url: "https://instagram.com/maisonkenzi",
  whatsapp_phone: "212752850156",
  bot_enabled: true,
  bot_name: "Assistante Maison Kenzi",
  bot_welcome: "Bonjour 👋 Bienvenue chez Maison Kenzi. Comment puis-je vous aider aujourd'hui ?",
  store_name: "Maison Kenzi",
};

const getLocalSettings = (): AppSettings => {
  try {
    const saved = localStorage.getItem("tabat_app_settings");
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULTS, ...parsed };
    }
  } catch {
    // ignore
  }
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

    window.addEventListener("tabat_settings_updated", handleLocalUpdate);
    window.addEventListener("storage", handleLocalUpdate);

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("app_settings")
          .select("*")
          .eq("id", true)
          .maybeSingle();

        if (error) {
          console.warn("Fetch app_settings error:", error);
        }

        if (active && data) {
          const merged = { ...DEFAULTS, ...getLocalSettings(), ...(data as Partial<AppSettings>) };
          setSettings(merged);
          try {
            localStorage.setItem("tabat_app_settings", JSON.stringify(merged));
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.warn("Exception fetching app_settings:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSettings();

    const channel = supabase
      .channel(`app_settings_changes_${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "app_settings" },
        (payload) => {
          if (payload.new && active) {
            const next = { ...settings, ...(payload.new as Partial<AppSettings>) };
            setSettings(next);
            try {
              localStorage.setItem("tabat_app_settings", JSON.stringify(next));
            } catch {
              // ignore
            }
          }
        },
      )
      .subscribe();

    return () => {
      active = false;
      window.removeEventListener("tabat_settings_updated", handleLocalUpdate);
      window.removeEventListener("storage", handleLocalUpdate);
      supabase.removeChannel(channel);
    };
  }, []);

  const update = async (patch: Partial<AppSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    try {
      localStorage.setItem("tabat_app_settings", JSON.stringify(next));
      window.dispatchEvent(new Event("tabat_settings_updated"));
    } catch {
      // ignore
    }

    // Upsert into Supabase for persistence across devices
    try {
      const { store_name, store_phone, ...dbPayload } = patch;
      const { error } = await supabase
        .from("app_settings")
        .upsert({ id: true, ...dbPayload });

      if (error) {
        console.error("Erreur mise a jour maintenance/settings Supabase:", error);
      }
      return { error };
    } catch (err) {
      return { error: err as Error };
    }
  };

  return { settings, loading, update };
};
