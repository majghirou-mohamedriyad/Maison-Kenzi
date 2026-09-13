/**
 * Bouton de Retour en Haut de Page avec Anneau de Progression Circulaire — Maison Kenzi
 *
 * Affiche un indicateur circulaire de défilement (0% à 100%) autour de l'icône de retour en haut.
 * Apparaît avec une animation feutrée dès que l'utilisateur fait défiler la page (scrollY > 250px).
 * Propose un défilement doux (smooth scroll) vers le sommet.
 * Conformité Luxury Nude Design System, zéro emoji et icône vectorielle lucide-react.
 */

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

export const BackToTop = () => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const location = useLocation();

  // Ne pas afficher sur les pages d'administration
  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

      if (scrollHeight > 0) {
        const currentProgress = Math.min(Math.max((scrollTop / scrollHeight) * 100, 0), 100);
        setProgress(currentProgress);
      }

      if (scrollTop > 250) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // Calcul initial
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (isAdmin || !visible) return null;

  // Calcul du périmètre pour le cercle SVG (r = 20)
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-50 pointer-events-auto animate-in fade-in zoom-in-95 duration-300">
      <button
        type="button"
        onClick={scrollToTop}
        className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-card/90 dark:bg-[#151311]/90 backdrop-blur-xl border border-primary/20 hover:border-primary text-foreground hover:text-primary flex items-center justify-center shadow-xl hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer group"
        title={`${t.backToTop.aria} (${Math.round(progress)}%)`}
        aria-label={`${t.backToTop.aria} (${Math.round(progress)}%)`}
      >
        {/* Anneau SVG de progression circulaire */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-[2px]"
          viewBox="0 0 48 48"
        >
          {/* Piste de fond transparente */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            className="text-primary/15 dark:text-primary/20 stroke-current"
            strokeWidth="2.5"
            fill="transparent"
          />
          {/* Anneau de progression actif en or champagne */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            className="text-primary stroke-current transition-[stroke-dashoffset] duration-150 ease-out"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        {/* Icône de flèche vectorielle */}
        <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary group-hover:-translate-y-0.5 transition-transform duration-300 stroke-[2] relative z-10" />
      </button>
    </div>
  );
};

export default BackToTop;

