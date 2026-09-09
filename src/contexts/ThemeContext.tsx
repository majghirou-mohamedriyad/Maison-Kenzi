/**
 * Contexte de Thème (ThemeContext) — Maison Kenzi
 *
 * Gère le thème actif (Light Nude / Dark Espresso) indépendamment pour le site client
 * et le panneau d'administration, avec persistance dans le localStorage.
 */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ADMIN_KEY,
  CUSTOMER_KEY,
  applyTheme,
  isAdminPath,
  readTheme,
  writeTheme,
  type Theme,
} from "@/hooks/useTheme";

type Ctx = {
  /** Thème de la surface actuellement active (admin ou client) */
  theme: Theme;
  /** Basculer le thème de la surface active */
  toggleTheme: () => void;
  /** Définir explicitement le thème de la surface active */
  setTheme: (t: Theme) => void;

  /** Thème du site client */
  customerTheme: Theme;
  setCustomerTheme: (t: Theme) => void;

  /** Thème du panneau d'administration */
  adminTheme: Theme;
  setAdminTheme: (t: Theme) => void;
};

const ThemeContext = createContext<Ctx | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isAdmin = isAdminPath(location.pathname);

  const [customerTheme, setCustomerThemeState] = useState<Theme>(() => readTheme(CUSTOMER_KEY));
  const [adminTheme, setAdminThemeState] = useState<Theme>(() => readTheme(ADMIN_KEY));

  const activeTheme = isAdmin ? adminTheme : customerTheme;

  // Appliquer le thème sur l'élément <html> lors de tout changement de route ou d'état
  useEffect(() => {
    const themeToApply = isAdmin ? adminTheme : customerTheme;
    applyTheme(themeToApply);
  }, [isAdmin, adminTheme, customerTheme]);

  const setCustomerTheme = useCallback((t: Theme) => {
    setCustomerThemeState(t);
    writeTheme(CUSTOMER_KEY, t);
    if (!isAdmin) applyTheme(t);
  }, [isAdmin]);

  const setAdminTheme = useCallback((t: Theme) => {
    setAdminThemeState(t);
    writeTheme(ADMIN_KEY, t);
    if (isAdmin) applyTheme(t);
  }, [isAdmin]);

  const setTheme = useCallback(
    (t: Theme) => {
      if (isAdmin) {
        setAdminTheme(t);
      } else {
        setCustomerTheme(t);
      }
    },
    [isAdmin, setAdminTheme, setCustomerTheme],
  );

  const toggleTheme = useCallback(() => {
    const current = isAdmin ? adminTheme : customerTheme;
    const next: Theme = current === "dark" ? "light" : "dark";
    if (isAdmin) {
      setAdminTheme(next);
    } else {
      setCustomerTheme(next);
    }
  }, [isAdmin, adminTheme, customerTheme, setAdminTheme, setCustomerTheme]);


  return (
    <ThemeContext.Provider
      value={{
        theme: activeTheme,
        toggleTheme,
        setTheme,
        customerTheme,
        setCustomerTheme,
        adminTheme,
        setAdminTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useThemeContext must be used within ThemeProvider");
  return ctx;
};
