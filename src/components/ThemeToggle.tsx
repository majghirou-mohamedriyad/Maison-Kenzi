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
      className={`relative w-9 h-9 rounded-xl flex items-center justify-center text-[#7A726A] dark:text-[#A39B91] hover:text-[#1A1816] dark:hover:text-[#FAF7F2] hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 cursor-pointer overflow-hidden ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        <Sun
          className={`w-4 h-4 text-[#C9A96E] absolute inset-0 transition-all duration-300 ease-out ${
            isDark
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 -rotate-90 scale-50 pointer-events-none"
          }`}
          strokeWidth={1.75}
        />
        <Moon
          className={`w-4 h-4 text-[#C9A96E] absolute inset-0 transition-all duration-300 ease-out ${
            isDark
              ? "opacity-0 rotate-90 scale-50 pointer-events-none"
              : "opacity-100 rotate-0 scale-100"
          }`}
          strokeWidth={1.75}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;

