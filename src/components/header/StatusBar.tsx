/**
 * Barre d'Annonce Supérieure (StatusBar) — Maison Kenzi
 *
 * Affiche les engagements exclusifs Haute Parfumerie & Parfums de Niche.
 */

import { useEffect, useState } from "react";
import { Truck, ShieldCheck, Sparkles, Award } from "lucide-react";

const StatusBar = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const usps = [
    { text: "Haute Parfumerie de Niche — Sélection d'Exception au Maroc", icon: Sparkles },
    { text: "Flacons Originaux & Décants Précision 5ml & 10ml", icon: Award },
    { text: "Livraison Express 24–48h partout au Maroc", icon: Truck },
    { text: "Paiement à la Livraison — 100% Parfums Authentiques", icon: ShieldCheck },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % usps.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [usps.length]);

  const CurrentIcon = usps[currentIndex].icon;

  return (
    <div className="bg-card/90 text-primary py-1.5 px-4 text-center border-b border-border/60 transition-all select-none overflow-hidden backdrop-blur-md">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <CurrentIcon className="w-3.5 h-3.5 text-primary shrink-0 transition-transform duration-300" strokeWidth={1.5} />
        <p
          key={currentIndex}
          className="text-[10px] sm:text-[11px] uppercase tracking-[0.25em] font-medium transition-all duration-700 ease-out animate-fade-in truncate text-foreground/90"
        >
          {usps[currentIndex].text}
        </p>
      </div>
    </div>
  );
};

export default StatusBar;