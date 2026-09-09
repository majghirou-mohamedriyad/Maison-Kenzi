import { useEffect, useState } from "react";
import { Truck, ShieldCheck, Sparkles, Award } from "lucide-react";

const StatusBar = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const usps = [
    { text: "Livraison Rapide 24–48h partout au Maroc", icon: Truck },
    { text: "Paiement à la Livraison — Commandez en toute sérénité", icon: ShieldCheck },
    { text: "100% Parfums Authentiques & Décantation Artisanale", icon: Sparkles },
    { text: "Flacons scellés & Échantillons haute précision", icon: Award },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % usps.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [usps.length]);

  const CurrentIcon = usps[currentIndex].icon;

  return (
    <div className="bg-[#0f1115] text-[#D8B043] dark:bg-[#15120c] dark:text-[#D8B043] py-1.5 px-4 text-center border-b border-primary/20 transition-all select-none overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
        <CurrentIcon className="w-3.5 h-3.5 text-primary shrink-0 transition-transform duration-300" />
        <p
          key={currentIndex}
          className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] font-semibold transition-all duration-700 ease-out animate-fade-in truncate"
        >
          {usps[currentIndex].text}
        </p>
      </div>
    </div>
  );
};

export default StatusBar;