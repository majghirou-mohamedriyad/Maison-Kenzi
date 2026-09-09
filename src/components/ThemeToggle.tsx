/**
 * Bouton de Basculement de Thème (ThemeToggle) — Maison Kenzi
 *
 * Permet de basculer en douceur entre le mode Nude Albâtre (Clair) et Espresso Doré (Sombre).
 */

import { Sun, Moon } from "lucide-react";
import { useThemeContext } from "@/contexts/ThemeContext";

type Props = {
  className?: string;
};

const ThemeToggle = ({ className = "" }: Props) => {
  const { theme, toggleTheme } = useThemeContext();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Activer le mode clair nude" : "Activer le mode sombre espresso"}
      title={isDark ? "Passer en mode Clair (Nude)" : "Passer en mode Sombre (Espresso)"}
      className={`relative w-9 h-9 rounded-full flex items-center justify-center text-foreground/80 hover:text-primary hover:bg-muted/60 transition-colors duration-200 cursor-pointer ${className}`}
    >
      <Sun
        className={`w-4 h-4 text-primary transition-all duration-300 ease-out ${
          isDark
            ? "opacity-100 rotate-0 scale-100"
            : "opacity-0 -rotate-90 scale-50 pointer-events-none"
        }`}
        strokeWidth={1.5}
      />
      <Moon
        className={`w-4 h-4 text-primary absolute transition-all duration-300 ease-out ${
          isDark
            ? "opacity-0 rotate-90 scale-50 pointer-events-none"
            : "opacity-100 rotate-0 scale-100"
        }`}
        strokeWidth={1.5}
      />
    </button>
  );
};

export default ThemeToggle;
