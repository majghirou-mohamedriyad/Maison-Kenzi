/**
 * En-tête Principal — Maison Kenzi
 *
 * Barre de navigation flottante élégamment arrondie en pastille (pill)
 * avec verre dépoli et ombre douce haute parfumerie.
 * Positionnée en fixe au-dessus du contenu pour laisser le Hero s'étendre
 * sur 100% de la hauteur dès le bord supérieur de la fenêtre (zéro bande blanche).
 */

import Navigation from "./Navigation";

const Header = () => {
  return (
    <header className="w-full fixed top-0 left-0 right-0 z-[100] transition-all duration-300 pointer-events-none">
      <div className="pt-3 sm:pt-4 pb-2 px-3 sm:px-6 max-w-7xl mx-auto pointer-events-auto">
        <Navigation />
      </div>
    </header>
  );
};

export default Header;