/**
 * Sélecteur de Langue Haute Joaillerie (FR / EN) — Maison Kenzi
 *
 * Permet au client de basculer en un clic entre Français et Anglais.
 * Respecte la charte graphique Luxury Nude et la règle stricte Zéro Emoji.
 */

import React from "react";
import { Globe } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface LanguageSelectorProps {
  className?: string;
  variant?: "pill" | "minimal" | "compact";
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = "",
  variant = "pill",
}) => {
  const { language, setLanguage } = useLanguage();

  if (variant === "compact") {
    return (
      <div className={`inline-flex items-center gap-1 text-xs font-mono ${className}`}>
        <button
          type="button"
          onClick={() => setLanguage("fr")}
          className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
            language === "fr"
              ? "font-bold text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="Français"
        >
          FR
        </button>
        <span className="text-border text-[10px]">|</span>
        <button
          type="button"
          onClick={() => setLanguage("en")}
          className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
            language === "en"
              ? "font-bold text-primary bg-primary/10"
              : "text-muted-foreground hover:text-foreground"
          }`}
          title="English"
        >
          EN
        </button>
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center p-0.5 rounded-full border border-border/80 bg-background/80 backdrop-blur-md shadow-2xs transition-all ${className}`}
      role="group"
      aria-label="Sélecteur de langue"
    >
      <div className="pl-2 pr-1 text-muted-foreground/80 hidden sm:flex items-center">
        <Globe className="w-3.5 h-3.5 text-primary" strokeWidth={1.75} />
      </div>

      <button
        type="button"
        onClick={() => setLanguage("fr")}
        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider transition-all duration-300 cursor-pointer ${
          language === "fr"
            ? "bg-primary text-primary-foreground shadow-xs scale-100"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
        }`}
        aria-pressed={language === "fr"}
      >
        FR
      </button>

      <button
        type="button"
        onClick={() => setLanguage("en")}
        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider transition-all duration-300 cursor-pointer ${
          language === "en"
            ? "bg-primary text-primary-foreground shadow-xs scale-100"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
        }`}
        aria-pressed={language === "en"}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSelector;
