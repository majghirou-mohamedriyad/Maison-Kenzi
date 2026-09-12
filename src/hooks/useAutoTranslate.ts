/**
 * Hook de Traduction Automatique Transparente DeepL — Maison Kenzi
 *
 * Traduit automatiquement et silencieusement les textes dynamiques
 * (descriptions de parfums, notes olfactives, accords) lorsque l'utilisateur est en mode Anglais ('en').
 * Met en cache immédiatement dans localStorage/sessionStorage pour une vitesse instantanée.
 */

import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateWithDeepl } from "@/services/deeplService";

export const useAutoTranslate = (frenchText: string | undefined | null): string => {
  const { language } = useLanguage();
  const [translated, setTranslated] = useState<string>(frenchText || "");

  useEffect(() => {
    if (!frenchText || !frenchText.trim()) {
      setTranslated("");
      return;
    }

    // Si on est en Français, afficher immédiatement le texte original
    if (language === "fr") {
      setTranslated(frenchText);
      return;
    }

    // Si on est en Anglais ('en'), traduire automatiquement et silencieusement via DeepL
    let isMounted = true;
    const cacheKey = `mk_deepl_cache_en_${frenchText.trim().toLowerCase().slice(0, 80)}_${frenchText.length}`;

    // Vérifier le cache local pour affichage instantané à 0ms
    try {
      const cached = sessionStorage.getItem(cacheKey) || localStorage.getItem(cacheKey);
      if (cached) {
        setTranslated(cached);
        return;
      }
    } catch { }

    // Traduction en arrière-plan sans bloquer l'UI
    translateWithDeepl(frenchText, "EN")
      .then((res) => {
        if (isMounted && res.success && res.translatedText) {
          setTranslated(res.translatedText);
          try {
            localStorage.setItem(cacheKey, res.translatedText);
          } catch { }
        }
      })
      .catch(() => {
        if (isMounted) {
          setTranslated(frenchText);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [frenchText, language]);

  return translated;
};

export default useAutoTranslate;
