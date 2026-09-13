/**
 * Contexte & Hook de Changement de Langue (i18n) — Maison Kenzi
 *
 * Permet au client de basculer instantanément entre le Français (FR) et l'Anglais (EN).
 * Sauvegarde le choix dans le stockage local (localStorage) et met à jour l'attribut lang du HTML.
 * Fournit un helper `t` universel (accessible sous forme de fonction `t('nav.home')` ou d'objet `t.hero.slide1Tag`).
 */

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { translations, Language } from "@/i18n/translations";

export type TranslationDict = typeof translations.fr;

export type TranslationFunction = {
  (path: string, fallback?: string): string;
} & TranslationDict;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: TranslationFunction;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = "mk_selected_language";

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
      if (saved === "fr" || saved === "en") return saved;
      const browserLang = navigator.language?.toLowerCase() || "";
      return browserLang.startsWith("en") ? "en" : "fr";
    } catch {
      return "fr";
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      document.documentElement.lang = lang;
    } catch (e) {
      console.warn("Impossible d'enregistrer la préférence de langue:", e);
    }
  };

  const toggleLanguage = () => {
    setLanguage(language === "fr" ? "en" : "fr");
  };

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  /**
   * Helper de traduction universel : supporte à la fois t('nav.products') et t.nav.products / t.hero.slide1Tag
   */
  const t = useMemo<TranslationFunction>(() => {
    const currentDict = translations[language] || translations.fr;

    const translateFn = (path: string, fallback?: string): string => {
      try {
        const keys = path.split(".");
        let current: any = currentDict;

        for (const key of keys) {
          if (current && typeof current === "object" && key in current) {
            current = current[key];
          } else {
            // Repli sur le français si manquant
            let frFallback: any = translations.fr;
            for (const fKey of keys) {
              if (frFallback && typeof frFallback === "object" && fKey in frFallback) {
                frFallback = frFallback[fKey];
              } else {
                frFallback = undefined;
                break;
              }
            }
            return typeof frFallback === "string" ? frFallback : fallback || path;
          }
        }

        return typeof current === "string" ? current : fallback || path;
      } catch {
        return fallback || path;
      }
    };

    return Object.assign(translateFn, currentDict) as TranslationFunction;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage doit être utilisé au sein d'un LanguageProvider");
  }
  return context;
};
