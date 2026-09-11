/**
 * Section L'Art du Décantage & Guide des Formats — Maison Kenzi
 *
 * Remplace l'ancienne vitrine saisonnière d'automne par une présentation éditoriale prestigieuse
 * expliquant le savoir-faire du décantage de haute parfumerie, les contenances disponibles (5ml, 10ml, Flacon)
 * et les raisons pour lesquelles collectionner en décants est le choix des connaisseurs.
 */

import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Droplets, ShieldCheck, ArrowRight, Compass, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

const decantAdvantages = [
  {
    icon: Droplets,
    badge: "5 ml · 75+ vaporisations",
    title: "Format Découverte",
    subtitle: "L'Essai Précis",
    description:
      "Idéal pour tester l'évolution d'un sillage sur votre peau pendant 15 jours sans engagement sur un flacon complet.",
  },
  {
    icon: Sparkles,
    badge: "10 ml · 150+ vaporisations",
    title: "Format Voyage & Nomade",
    subtitle: "Le Compagnon Idéal",
    description:
      "Un atomiseur en verre épais à emporter partout, pour porter votre signature olfactive pendant plus d'un mois.",
  },
  {
    icon: Compass,
    badge: "Flacons Purs 100% Authentiques",
    title: "Haute Conservation",
    subtitle: "Flacons Verre & Sertissage Soigné",
    description:
      "Prélevé à la commande selon les règles de l'art dans des flacons en verre neutre garantissant la pureté des huiles et molécules rares.",
  },
];

export const DecantGuideSection = () => {
  return (
    <section className="w-full mb-16 sm:mb-28 px-4 sm:px-6 max-w-7xl mx-auto relative overflow-hidden">
      {/* Halo d'ambiance doré feutré */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[350px] bg-primary/8 blur-[120px] rounded-full" />
      </div>

      {/* En-tête Éditorial */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-[10px] sm:text-xs font-semibold tracking-[0.25em] uppercase mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span>Savoir-Faire & Découverte</span>
        </div>

        <h2 className="font-serif text-2xl sm:text-4xl text-foreground font-normal tracking-tight leading-tight">
          L'Art du Décantage de <span className="text-primary italic font-serif">Haute Parfumerie</span>
        </h2>

        <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed mt-3 max-w-2xl mx-auto">
          Pourquoi choisir un seul flacon quand vous pouvez explorer les plus grands chefs-d'œuvre de la parfumerie mondiale ? Découvrez notre rituel de prélèvement sur-mesure.
        </p>

        <div className="w-12 h-0.5 bg-primary/40 mx-auto mt-4 rounded-full" />
      </div>

      {/* Grille 3 Colonnes des Formats & Avantages */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-10">
        {decantAdvantages.map((item, idx) => {
          const IconComp = item.icon;
          return (
            <div
              key={idx}
              className="group relative rounded-2xl sm:rounded-3xl border border-border/80 bg-card/60 backdrop-blur-md p-6 sm:p-7 shadow-xs hover:shadow-xl hover:shadow-primary/10 hover:border-primary/50 transition-all duration-500 flex flex-col justify-between"
            >
              <div>
                {/* Badge supérieur & Icône */}
                <div className="flex items-center justify-between mb-5">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-105 transition-all duration-300 shadow-xs">
                    <IconComp className="w-5 h-5 stroke-[1.75]" />
                  </div>
                  <span className="text-[9.5px] uppercase tracking-wider font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                    {item.badge}
                  </span>
                </div>

                <span className="text-[10px] uppercase tracking-widest text-muted-foreground block font-semibold mb-1">
                  {item.subtitle}
                </span>

                <h3 className="font-serif text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors leading-snug mb-2.5">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-[13px] text-muted-foreground font-light leading-relaxed">
                  {item.description}
                </p>
              </div>

              {/* Liseré inférieur de finition */}
              <div className="pt-5 mt-6 border-t border-border/60 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                <span>100% Authentique & Précis</span>
                <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-colors" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bannière Call To Action d'exploration */}
      <div className="rounded-2xl sm:rounded-3xl border border-primary/30 bg-gradient-to-r from-card/90 via-card/60 to-card/90 backdrop-blur-xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left shadow-sm">
        <div className="space-y-1 max-w-xl">
          <h4 className="font-serif text-base sm:text-xl font-bold text-foreground">
            Composez votre garde-robe olfactive
          </h4>
          <p className="text-xs text-muted-foreground font-light">
            Découvrez nos créations exclusives disponibles immédiatement avec livraison express partout au Maroc.
          </p>
        </div>

        <Button
          asChild
          className="rounded-full bg-primary hover:bg-primary-hover text-primary-foreground text-xs uppercase tracking-[0.18em] font-bold px-7 h-11 shadow-md hover:shadow-lg hover:shadow-primary/25 transition-all duration-300 shrink-0 cursor-pointer"
        >
          <Link to="/collection/all" className="flex items-center gap-2">
            <span>Explorer le Catalogue</span>
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default DecantGuideSection;
