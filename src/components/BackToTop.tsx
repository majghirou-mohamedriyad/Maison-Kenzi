/**
 * Bouton de Retour en Haut de Page — Maison Kenzi
 *
 * Apparaît avec une animation feutrée dès que l'utilisateur fait défiler la page (scrollY > 350px).
 * Propose un défilement doux (smooth scroll) vers le sommet de la page.
 * Conformité Luxury Nude Design System, zéro emoji et icône vectorielle lucide-react.
 */

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { useLocation } from "react-router-dom";

export const BackToTop = () => {
  const [visible, setVisible] = useState(false);
  const location = useLocation();

  // Ne pas afficher sur les pages d'administration
  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 350) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (isAdmin || !visible) return null;

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-50 pointer-events-auto animate-in fade-in zoom-in-95 duration-300">
      <button
        type="button"
        onClick={scrollToTop}
        className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-card/90 dark:bg-[#151311]/90 backdrop-blur-xl border border-primary/40 hover:border-primary text-foreground hover:text-primary flex items-center justify-center shadow-xl hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-110 active:scale-90 cursor-pointer group"
        title="Retourner en haut de la page"
        aria-label="Retourner en haut de la page"
      >
        <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary group-hover:-translate-y-0.5 transition-transform duration-300 stroke-[2]" />
      </button>
    </div>
  );
};

export default BackToTop;
