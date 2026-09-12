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
  openwa_url?: string;
  openwa_session?: string;
  openwa_api_key?: string;
  openwa_auto_order_confirmation?: boolean;
  openwa_auto_status_update?: boolean;
  openwa_admin_notification?: boolean;
  openwa_admin_phone?: string;
};

const DEFAULTS: AppSettings = {
  maintenance_mode: false,
  maintenance_message: "Nous préparons une nouvelle collection. Revenez très bientôt.",
  instagram_url: "https://instagram.com/maisonkenzi",
  whatsapp_phone: "212652535301",
  bot_enabled: true,
  bot_name: "Conseillère Maison Kenzi",
  bot_welcome: "Bienvenue chez Maison Kenzi. Comment puis-je vous guider dans votre découverte olfactive ?",
  store_name: "Maison Kenzi",
  free_shipping_threshold: 500,
  openwa_url: "http://185.197.249.4:2785",
  openwa_session: "e8fe5adf-cd3b-4470-8cf7-6a85504430ff",
  openwa_api_key: "owa_k1_8e8d1dad118d422c4b0bcc77723a9719eca52913e6813b2f84e32fb479f223cf",
  openwa_auto_order_confirmation: true,
  openwa_auto_status_update: true,
  openwa_admin_notification: true,
  openwa_admin_phone: "212652535301",
};

const STORAGE_KEY = "maisonkenzi_app_settings";
const CHANNEL_NAME = "maisonkenzi_settings_channel";

const getLocalSettings = (): AppSettings => {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...DEFAULTS,
        ...parsed,
        openwa_api_key: parsed.openwa_api_key || DEFAULTS.openwa_api_key,
      };
    }
  } catch { }
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
  } catch { }
}

const notify = () => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      broadcastChannel?.postMessage({ type: "UPDATE_SETTINGS", payload: state });
      window.dispatchEvent(new CustomEvent("maisonkenzi_settings_updated", { detail: state }));
    } catch { }
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
      } catch { }
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
  } catch { }
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
  } catch { }
}

const SUPABASE_DB_KEYS = new Set([
  "maintenance_mode",
  "maintenance_message",
  "instagram_url",
  "whatsapp_phone",
  "bot_enabled",
  "bot_name",
  "bot_welcome",
  "free_shipping_threshold",
]);

export const getAppSettings = (): AppSettings => state;

export const updateAppSettings = async (patch: Partial<AppSettings>) => {
  state = { ...state, ...patch };
  notify();

  // Synchronisation avec Supabase pour les colonnes existantes dans la base
  try {
    const dbPayload: Record<string, any> = {};
    for (const key of Object.keys(patch)) {
      if (SUPABASE_DB_KEYS.has(key)) {
        dbPayload[key] = (patch as any)[key];
      }
    }

    if (Object.keys(dbPayload).length > 0) {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ id: true, ...dbPayload } as any);

      if (error) {
        // Gestion de repli si free_shipping_threshold n'est pas encore migré
        if (error.message?.includes("free_shipping_threshold")) {
          delete dbPayload.free_shipping_threshold;
          if (Object.keys(dbPayload).length > 0) {
            await supabase
              .from("app_settings")
              .upsert({ id: true, ...dbPayload } as any);
          }
        } else {
          console.warn("Supabase app_settings sync note:", error.message);
        }
      }
    }
    return { error: null };
  } catch (err) {
    console.warn("Supabase update error (sauvegarde locale préservée):", err);
    return { error: null };
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
