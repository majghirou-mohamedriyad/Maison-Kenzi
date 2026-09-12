/**
 * Utilitaires de Thème — Maison Kenzi
 *
 * Gère la persistance et l'application des modes Clair (Nude Albâtre)
 * et Sombre (Warm Espresso Obsidian).
 */

export type Theme = "dark" | "light";

export const CUSTOMER_KEY = "ne_theme";
export const ADMIN_KEY = "ne_admin_theme";

export const isAdminPath = (path?: string) => {
  const p = path ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  return p.startsWith("/admin");
};

export const storageKeyFor = (path?: string) =>
  isAdminPath(path) ? ADMIN_KEY : CUSTOMER_KEY;

export const readTheme = (key: string, fallback: Theme = "light"): Theme => {
  if (typeof window === "undefined") return fallback;
  try {
    const v = localStorage.getItem(key);
    return v === "light" || v === "dark" ? v : fallback;
  } catch {
    return fallback;
  }
};

export const writeTheme = (key: string, theme: Theme) => {
  try {
    localStorage.setItem(key, theme);
  } catch {}
};

export const applyTheme = (theme: Theme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  
  if (theme === "dark") {
    root.classList.add("dark");
    root.classList.remove("light");
    root.style.colorScheme = "dark";
  } else {
    root.classList.add("light");
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  }
};

