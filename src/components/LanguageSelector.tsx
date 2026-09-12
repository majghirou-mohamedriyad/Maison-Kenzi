/**
 * Sélecteur de Langue Haute Joaillerie (FR / EN) — Maison Kenzi
 *
 * Composant de commutation linguistique fluide et raffiné :
 * - Capsule arrondie en verre dépoli avec bordure dorée/nude subtile
 * - Pastille active animée à haut contraste et micro-transitions
 * - Typographie éditoriale haute parfumerie (Zéro Emoji, icône Globe vectorielle ultra-fine)
 */

import React from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface LanguageSelectorProps {
  className?: string;
  variant?: "capsule" | "pill" | "compact" | "minimal";
  showIcon?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = "",
  variant = "capsule",
  showIcon = true,
}) => {
  const { language, setLanguage, toggleLanguage } = useLanguage();

  // Mode Minimal / Toggle 1 Clic (Globe + Code langue actif)
  if (variant === "minimal") {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`h-9 px-2.5 rounded-full flex items-center gap-1.5 border border-border/70 dark:border-white/10 bg-card/60 dark:bg-white/5 hover:bg-card dark:hover:bg-white/10 transition-all duration-200 cursor-pointer text-foreground select-none group ${className}`}
        title={language === "fr" ? "Switch to English" : "Passer en Français"}
        aria-label="Changer de langue"
      >
        <Globe className="w-3.5 h-3.5 text-primary group-hover:rotate-12 transition-transform duration-300" strokeWidth={1.75} />
        <span className="text-[11px] font-bold tracking-wider uppercase font-mono">
          {language.toUpperCase()}
        </span>
      </button>
    );
  }

  // Capsule Haute Horlogerie / Haute Parfumerie (Double Pastille FR / EN)
  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-full bg-black/5 dark:bg-white/5 border border-border/70 dark:border-white/10 backdrop-blur-md select-none transition-all ${className}`}
      role="group"
      aria-label="Sélecteur de langue"
    >
      {showIcon && (
        <div className="pl-2 pr-1 text-primary/80 hidden sm:flex items-center">
          <Globe className="w-3 h-3 text-primary" strokeWidth={1.8} />
        </div>
      )}

      {/* Bouton Français */}
      <button
        type="button"
        onClick={() => setLanguage("fr")}
        className={`relative px-2.5 py-1 rounded-full text-[10px] sm:text-[10.5px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
          language === "fr"
            ? "bg-foreground text-background dark:bg-primary dark:text-primary-foreground shadow-xs scale-100"
            : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
        }`}
        aria-pressed={language === "fr"}
        title="Passer en Français"
      >
        FR
      </button>

      {/* Bouton Anglais */}
      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`relative px-2.5 py-1 rounded-full text-[10px] sm:text-[10.5px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer ${
          language === "en"
            ? "bg-foreground text-background dark:bg-primary dark:text-primary-foreground shadow-xs scale-100"
            : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
        }`}
        aria-pressed={language === "en"}
        title="Switch to English"
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSelector;
