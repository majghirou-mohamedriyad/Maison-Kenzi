/**
 * Sélecteur de Devise Haute Parfumerie — Maison Kenzi
 *
 * Composant de sélection multi-devises fluide et raffiné :
 * - Capsule arrondie en verre dépoli avec bordure dorée/nude subtile
 * - Menu déroulant de prestige avec recherche rapide et mise en valeur de la devise active
 * - Zéro Emoji — Typographie éditoriale, symboles monétaires vectoriels et icônes lucide-react.
 */

import React, { useState, useRef, useEffect } from "react";
import { Coins, Check, ChevronDown } from "lucide-react";
import { useCurrency, CURRENCIES, CurrencyCode } from "@/contexts/CurrencyContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface CurrencySelectorProps {
  className?: string;
  variant?: "capsule" | "pill" | "compact" | "minimal";
  showIcon?: boolean;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  className = "",
  variant = "capsule",
  showIcon = true,
}) => {
  const { currency, setCurrency, currencyMeta } = useCurrency();
  const { language } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermer le menu lors d'un clic en dehors
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: CurrencyCode) => {
    setCurrency(code);
    setIsOpen(false);
  };

  const currencyList = Object.values(CURRENCIES);

  // Variant Minimal (Bouton compact 1 clic ou simple affichage)
  if (variant === "minimal") {
    return (
      <div className="relative inline-block" ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`h-9 px-2.5 rounded-full flex items-center gap-1.5 border border-border/70 dark:border-white/10 bg-card/60 dark:bg-white/5 hover:bg-card dark:hover:bg-white/10 transition-all duration-200 cursor-pointer text-foreground select-none group ${className}`}
          title="Changer de devise"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <Coins className="w-3.5 h-3.5 text-primary group-hover:rotate-12 transition-transform duration-300" strokeWidth={1.75} />
          <span className="text-[11px] font-bold tracking-wider uppercase font-mono">
            {currency}
          </span>
          <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-background/95 dark:bg-[#151821]/95 backdrop-blur-2xl border border-border/80 dark:border-white/10 shadow-2xl p-1.5 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
            <div className="px-3 py-1.5 border-b border-border/50 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
              {language === "en" ? "Select Currency" : "Sélectionner la Devise"}
            </div>
            <div className="max-h-64 overflow-y-auto space-y-0.5 pt-1 scrollbar-thin">
              {currencyList.map((item) => {
                const isSelected = item.code === currency;
                return (
                  <button
                    key={item.code}
                    type="button"
                    onClick={() => handleSelect(item.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors text-left cursor-pointer ${
                      isSelected
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded-md ${isSelected ? "bg-black/15 text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {item.symbol}
                      </span>
                      <div>
                        <span className="font-semibold block">{item.code}</span>
                        <span className={`text-[10px] block truncate ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                          {language === "en" ? item.nameEn : item.nameFr}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Capsule de Prestige Haute Parfumerie
  return (
    <div className="relative inline-block shrink-0" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center whitespace-nowrap shrink-0 gap-1 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-black/5 dark:bg-white/5 border border-border/70 dark:border-white/10 backdrop-blur-md select-none transition-all duration-200 cursor-pointer hover:border-primary/40 text-foreground group ${className}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title="Changer de devise"
      >
        {showIcon && (
          <Coins className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-primary group-hover:scale-110 transition-transform duration-200 shrink-0" strokeWidth={1.75} />
        )}
        <span className="text-[10px] sm:text-[10.5px] font-bold tracking-wider font-mono">
          {currencyMeta.code}
        </span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Menu Déroulant Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-background/95 dark:bg-[#151821]/95 backdrop-blur-2xl border border-border/80 dark:border-white/10 shadow-2xl p-2 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-border/50 flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            <span>{language === "en" ? "Currency" : "Devise de la Boutique"}</span>
            <span className="text-[9px] text-primary/80 font-normal">Taux en direct</span>
          </div>

          <div className="max-h-72 overflow-y-auto space-y-1 pt-1.5 scrollbar-thin">
            {currencyList.map((item) => {
              const isSelected = item.code === currency;
              return (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => handleSelect(item.code)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all text-left cursor-pointer ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                      : "text-foreground hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-[11px] font-bold shrink-0 ${
                        isSelected
                          ? "bg-black/20 text-primary-foreground"
                          : "bg-muted/80 text-foreground"
                      }`}
                    >
                      {item.symbol}
                    </span>
                    <div className="min-w-0">
                      <span className="font-semibold block truncate leading-tight">
                        {item.code}
                      </span>
                      <span
                        className={`text-[10.5px] block truncate leading-tight ${
                          isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
                        }`}
                      >
                        {language === "en" ? item.nameEn : item.nameFr}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 shrink-0 text-primary-foreground ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencySelector;
