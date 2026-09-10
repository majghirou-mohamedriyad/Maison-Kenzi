/**
 * En-tête Principal — Maison Kenzi
 *
 * Intègre la barre d'annonces supérieure (StatusBar) et la barre de navigation
 * flottante élégamment arrondie en pastille (pill) avec verre dépoli haute parfumerie.
 */

import StatusBar from "./StatusBar";
import Navigation from "./Navigation";

const Header = () => {
  return (
    <header className="w-full sticky top-0 z-[100] transition-all duration-300">
      <StatusBar />
      <div className="pt-2 sm:pt-3 pb-1 px-3 sm:px-6 max-w-6xl mx-auto">
        <Navigation />
      </div>
    </header>
  );
};

export default Header;