/**
 * Section Éditoriale & Engagements d'Excellence — Maison Kenzi
 *
 * Présentation des piliers de confiance de la Maison :
 * 1. 100% Flacons Scellés & Authentiques
 * 2. Livraison Express Partout au Maroc (24–48h)
 * 3. Paiement Sécurisé par Internet (Transactions Chiffrées)
 * 4. Conciergerie & Conseil Privé Personnalisé
 */

import React from "react";
import { Link } from "react-router-dom";
import {
  Truck,
  ShieldCheck,
  Crown,
  MessageCircle,
  ArrowRight,
  Sparkles,
  PackageCheck,
  CheckCircle2,
} from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";

const pillars = [
  {
    number: "01",
    icon: Crown,
    title: "100% Flacons Originaux",
    subtitle: "Authenticité Certifiée",
    description:
      "Chaque parfum est garanti 100% authentique, neuf et scellé dans son packaging d'origine de la maison créatrice.",
    tag: "Origine Garantie",
  },
  {
    number: "02",
    icon: Truck,
    title: "Livraison Maroc & Europe",
    subtitle: "Acheminement Express & Sécurisé",
    description:
      "Expédition rapide et soignée dans toutes les villes du Royaume du Maroc et en Europe avec numéro de suivi en direct.",
    tag: "Emballage Haute Protection",
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "Paiement Sécurisé par Internet",
    subtitle: "Transactions Chiffrées SSL",
    description:
      "Réglez votre commande en toute sécurité par internet avec des protocoles de chiffrement bancaire de pointe.",
    tag: "100% Sécurisé",
  },
  {
    number: "04",
    icon: MessageCircle,
    title: "Conseil & Conciergerie",
    subtitle: "Accompagnement Sur-Mesure",
    description:
      "Notre équipe vous guide sur WhatsApp pour choisir le sillage idéal selon vos préférences et occasions.",
    tag: "Service Dédié",
  },
];

const EditorialSection = () => {
  const { settings } = useAppSettings();
  const rawPhone = settings.whatsapp_phone || "212652535301";
  const waNumber = rawPhone.replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    "Bonjour Maison Kenzi, j'aimerais recevoir des conseils personnalisés pour choisir un parfum."
  )}`;

  return (
    <section className="w-full mb-16 sm:mb-28 px-4 sm:px-6 max-w-7xl mx-auto relative">
      {/* En-tête de Section */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-[10px] sm:text-xs font-semibold tracking-[0.25em] uppercase mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span>L'Engagement Maison Kenzi</span>
        </div>

        <h2 className="font-serif text-2xl sm:text-4xl text-foreground font-normal tracking-tight leading-tight">
          Pourquoi Choisir <span className="text-primary italic font-serif">Maison Kenzi</span> ?
        </h2>

        <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed mt-3 max-w-xl mx-auto">
          L'exigence de la haute parfumerie, la certitude d'un flacon d'origine scellé et un service de conciergerie attentif à chaque instant.
        </p>

        <div className="w-12 h-0.5 bg-primary/40 mx-auto mt-4 rounded-full" />
      </div>

      {/* Grille 4 Piliers d'Excellence */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {pillars.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="group relative rounded-2xl sm:rounded-3xl border border-border/80 bg-card/60 backdrop-blur-md p-6 sm:p-7 shadow-xs hover:shadow-xl hover:shadow-primary/10 hover:border-primary/50 transition-all duration-500 flex flex-col justify-between"
            >
              <div>
                {/* Ligne Numéro & Icône */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105 transition-all duration-300 shadow-xs">
                    <Icon className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <span className="font-serif text-xl sm:text-2xl font-light text-primary/35 group-hover:text-primary transition-colors">
                    {item.number}
                  </span>
                </div>

                {/* Tag Subtitle */}
                <span className="text-[10px] uppercase tracking-widest text-primary font-bold block mb-1">
                  {item.subtitle}
                </span>

                {/* Titre */}
                <h3 className="font-serif text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug mb-2.5">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-muted-foreground font-light leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Liseré Inférieur */}
              <div className="pt-4 mt-5 border-t border-border/60 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                <span>{item.tag}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-primary/40 group-hover:text-primary transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Barre d'Actions & Conciergerie */}
      <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
        <Link
          to="/about/service-client"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs uppercase tracking-[0.16em] font-semibold text-foreground hover:text-primary py-3 px-6 rounded-full border border-border/80 hover:border-primary/50 bg-card/60 backdrop-blur-md shadow-xs transition-all"
        >
          <span>En Savoir Plus sur la Maison</span>
          <ArrowRight size={14} />
        </Link>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs uppercase tracking-[0.16em] font-bold text-white py-3 px-6 rounded-full bg-[#25D366] hover:bg-[#20ba5a] shadow-md hover:shadow-lg transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Contacter la Conciergerie WhatsApp</span>
        </a>
      </div>
    </section>
  );
};

export default EditorialSection;

