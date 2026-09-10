/**
 * En-tête Principal — Maison Kenzi
 *
 * Intègre la barre d'annonces supérieure (StatusBar) et la barre de navigation.
 * Gestion dynamique du défilement (scroll) :
 * - Au sommet : affichage pleine largeur fluide sur la section Hero.
 * - En cas de défilement : transition cinématographique vers une barre flottante élégamment arrondie.
 */

import { useState, useEffect } from "react";
import StatusBar from "./StatusBar";
import Navigation from "./Navigation";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="w-full sticky top-0 z-[100] transition-all duration-300">
      <StatusBar />
      <div
        className={`transition-all duration-500 ease-out ${
          isScrolled
            ? "pt-2 sm:pt-3 pb-1 px-3 sm:px-6 max-w-6xl mx-auto"
            : "pt-1 pb-1 px-4 sm:px-8 max-w-full"
        }`}
      >
        <Navigation isScrolled={isScrolled} />
      </div>
    </header>
  );
};

export default Header;