/**
 * Sélecteur de Langue Haute Couture (FR / EN) — Maison Kenzi
 *
 * Composant de commutation linguistique fluide et prestigieux :
 * - Mode « pill » / « toggle » (Défaut) : Bouton tactile 1-clic avec icône Globe dorée et code langue actif (FR / EN)
 * - Mode « capsule » : Double pastille segmentée avec curseur actif contrasté et micro-transitions
 * - Mode « dropdown » : Menu déroulant élégant avec libellés complets (Français / English)
 * - Zéro Emoji — Icônes vectorielles lucide-react exclusives et typographie éditoriale Manrope.
 */

import React, { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface LanguageSelectorProps {
  className?: string;
  variant?: "pill" | "capsule" | "dropdown" | "minimal";
  showIcon?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  className = "",
  variant = "pill",
  showIcon = true,
}) => {
  const { language, setLanguage, toggleLanguage } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermeture au clic extérieur pour le mode dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  // 1. VARIANT « PILL » / « MINIMAL » (1-Clic Toggle avec Icône Globe & Code Langue Actif)
  if (variant === "pill" || variant === "minimal") {
    return (
      <button
        type="button"
        onClick={toggleLanguage}
        className={`group relative h-9 sm:h-10 px-3 rounded-full shrink-0 flex items-center justify-center gap-1.5 border border-border/70 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 hover:border-primary/40 transition-all duration-200 cursor-pointer text-foreground select-none active:scale-95 ${className}`}
        title={language === "fr" ? "Switch to English" : "Passer en Français"}
        aria-label="Changer de langue"
      >
        {showIcon && (
          <Globe
            className="w-3.5 h-3.5 text-primary group-hover:rotate-45 transition-transform duration-300 ease-out shrink-0"
            strokeWidth={1.8}
          />
        )}
        <span className="text-[11px] sm:text-xs font-bold tracking-widest uppercase font-sans text-foreground group-hover:text-primary transition-colors">
          {language.toUpperCase()}
        </span>
      </button>
    );
  }

  // 2. VARIANT « DROPDOWN » (Micro Popover Élégant avec Checkmarks)
  if (variant === "dropdown") {
    return (
      <div ref={dropdownRef} className={`relative shrink-0 ${className}`}>
        <button
          type="button"
          onClick={() => setIsDropdownOpen((v) => !v)}
          className={`h-9 sm:h-10 px-3 rounded-full flex items-center gap-1.5 border border-border/70 dark:border-white/10 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 hover:border-primary/40 transition-all duration-200 cursor-pointer text-foreground select-none active:scale-95 ${
            isDropdownOpen ? "border-primary/50 bg-black/10 dark:bg-white/10" : ""
          }`}
          aria-expanded={isDropdownOpen}
          aria-haspopup="true"
        >
          {showIcon && <Globe className="w-3.5 h-3.5 text-primary" strokeWidth={1.8} />}
          <span className="text-[11px] sm:text-xs font-bold tracking-wider uppercase">
            {language.toUpperCase()}
          </span>
          <ChevronDown
            className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${
              isDropdownOpen ? "rotate-180 text-primary" : ""
            }`}
          />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full right-0 mt-2 z-50 w-36 rounded-2xl bg-background/95 dark:bg-[#151821]/95 backdrop-blur-2xl border border-border/80 dark:border-white/10 shadow-2xl p-1.5 space-y-1 animate-in fade-in-0 zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => {
                setLanguage("fr");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                language === "fr"
                  ? "bg-primary/15 text-primary"
                  : "text-foreground hover:bg-muted/60"
              }`}
            >
              <span>Français</span>
              {language === "fr" && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setLanguage("en");
                setIsDropdownOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                language === "en"
                  ? "bg-primary/15 text-primary"
                  : "text-foreground hover:bg-muted/60"
              }`}
            >
              <span>English</span>
              {language === "en" && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>
          </div>
        )}
      </div>
    );
  }

  // 3. VARIANT « CAPSULE » (Double Pastille Segmentée Haute Horlogerie)
  return (
    <div
      className={`inline-flex items-center shrink-0 whitespace-nowrap h-9 sm:h-10 p-1 rounded-full bg-black/5 dark:bg-white/5 border border-border/70 dark:border-white/10 backdrop-blur-md select-none transition-all ${className}`}
      role="group"
      aria-label="Sélecteur de langue"
    >
      {showIcon && (
        <div className="pl-1.5 pr-1 text-primary/80 hidden sm:flex items-center">
          <Globe className="w-3.5 h-3.5 text-primary" strokeWidth={1.8} />
        </div>
      )}

      {/* Bouton Français */}
      <button
        type="button"
        onClick={() => setLanguage("fr")}
        className={`relative px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer select-none active:scale-95 ${
          language === "fr"
            ? "bg-foreground text-background dark:bg-primary dark:text-primary-foreground shadow-xs"
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
        className={`relative px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer select-none active:scale-95 ${
          language === "en"
            ? "bg-foreground text-background dark:bg-primary dark:text-primary-foreground shadow-xs"
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
