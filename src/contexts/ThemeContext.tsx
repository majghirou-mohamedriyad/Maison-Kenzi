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
  /** The theme of the currently active surface (admin or customer). */
  theme: Theme;
  /** Toggle the active surface theme. */
  toggleTheme: () => void;
  /** Set the active surface theme. */
  setTheme: (t: Theme) => void;

  /** Customer site theme (independent of admin). */
  customerTheme: Theme;
  setCustomerTheme: (t: Theme) => void;

  /** Admin panel theme (independent of customer). */
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

  // Apply the right theme to <html> whenever the route or stored value changes
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    applyTheme(activeTheme);
    const id = window.setTimeout(() => root.classList.remove("theme-transition"), 350);
    return () => window.clearTimeout(id);
  }, [activeTheme]);

  const setCustomerTheme = useCallback((t: Theme) => {
    setCustomerThemeState(t);
    writeTheme(CUSTOMER_KEY, t);
  }, []);

  const setAdminTheme = useCallback((t: Theme) => {
    setAdminThemeState(t);
    writeTheme(ADMIN_KEY, t);
  }, []);

  const setTheme = useCallback(
    (t: Theme) => (isAdmin ? setAdminTheme(t) : setCustomerTheme(t)),
    [isAdmin, setAdminTheme, setCustomerTheme],
  );

  const toggleTheme = useCallback(
    () => setTheme(activeTheme === "dark" ? "light" : "dark"),
    [activeTheme, setTheme],
  );

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
