export type Theme = "dark" | "light";

export const CUSTOMER_KEY = "ne_theme";
export const ADMIN_KEY = "ne_admin_theme";

export const isAdminPath = (path?: string) => {
  const p = path ?? (typeof window !== "undefined" ? window.location.pathname : "/");
  return p.startsWith("/admin");
};

export const storageKeyFor = (path?: string) =>
  isAdminPath(path) ? ADMIN_KEY : CUSTOMER_KEY;

export const readTheme = (key: string, fallback: Theme = "dark"): Theme => {
  if (typeof window === "undefined") return fallback;
  const v = localStorage.getItem(key);
  return v === "light" || v === "dark" ? v : fallback;
};

export const writeTheme = (key: string, theme: Theme) => {
  try {
    localStorage.setItem(key, theme);
  } catch {}
};

export const applyTheme = (theme: Theme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
};
