import { useSyncExternalStore } from "react";
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
  free_shipping_threshold: number;
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
  free_shipping_threshold: 500,
};

const STORAGE_KEY = "maisonkenzi_app_settings";
const CHANNEL_NAME = "maisonkenzi_settings_channel";

const getLocalSettings = (): AppSettings => {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULTS, ...parsed };
    }
  } catch {}
  return DEFAULTS;
};

let state: AppSettings = getLocalSettings();
const listeners = new Set<() => void>();

// Canal de diffusion inter-onglets
let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === "UPDATE_SETTINGS" && event.data.payload) {
        state = { ...DEFAULTS, ...event.data.payload };
        listeners.forEach((l) => l());
      }
    };
  } catch {}
}

const notify = () => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      broadcastChannel?.postMessage({ type: "UPDATE_SETTINGS", payload: state });
      window.dispatchEvent(new CustomEvent("maisonkenzi_settings_updated", { detail: state }));
    } catch {}
  }
  listeners.forEach((l) => l());
};

// Écouteur des changements de localStorage entre onglets
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        state = { ...DEFAULTS, ...JSON.parse(e.newValue) };
        listeners.forEach((l) => l());
      } catch {}
    }
  });
}

// Fonction de récupération depuis Supabase
const fetchSettingsFromSupabase = async () => {
  try {
    const { data, error } = await supabase
      .from("app_settings")
      .select("*")
      .eq("id", true)
      .maybeSingle();

    if (!error && data) {
      state = { ...DEFAULTS, ...getLocalSettings(), ...(data as Partial<AppSettings>) };
      notify();
    }
  } catch {}
};

// Initialisation et souscription Supabase Realtime unique (Singleton)
if (typeof window !== "undefined") {
  fetchSettingsFromSupabase();

  try {
    supabase
      .channel("maisonkenzi_settings_realtime_singleton")
      .on(
        "postgres_changes",
        { event: "*", schema: "maisonkenzi", table: "app_settings" },
        (payload) => {
          if (payload.new) {
            state = { ...DEFAULTS, ...getLocalSettings(), ...(payload.new as Partial<AppSettings>) };
            notify();
          }
        }
      )
      .subscribe();
  } catch {}
}

export const getAppSettings = (): AppSettings => state;

export const updateAppSettings = async (patch: Partial<AppSettings>) => {
  state = { ...state, ...patch };
  notify();

  // Persistance dans Supabase
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

export const useAppSettings = () => {
  const settings = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    getAppSettings,
    () => DEFAULTS
  );

  return { settings, loading: false, update: updateAppSettings };
};
