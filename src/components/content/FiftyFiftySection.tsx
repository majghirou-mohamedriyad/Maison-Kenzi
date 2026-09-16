/**
 * Section Univers Olfactifs (FiftyFiftySection / Grille Catégories Dynamiques) — Maison Kenzi
 *
 * Affiche les univers et catégories configurés dans Supabase avec une direction artistique Haute Parfumerie :
 * - Cards au ratio élancé (3:4) avec effet de profondeur, dégradés feutrés et zoom fluide
 * - Badge « À venir » / « Soon » hautement contrasté et parfaitement lisible
 * - Zéro Emoji — Typographie éditoriale, bordures champagne et icônes lucide-react.
 */

import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles, Clock } from "lucide-react";
import { useCategories } from "@/store/useCategoryStore";
import { useParfums } from "@/hooks/useParfums";
import { isParfumInCategory } from "@/lib/productCategories";
import { useLanguage } from "@/contexts/LanguageContext";

const Card = ({
  title,
  text,
  href,
  image,
  isComingSoon,
  discoverText,
  comingSoonText,
}: {
  title: string;
  text: string;
  href: string;
  image?: string;
  isComingSoon?: boolean;
  discoverText: string;
  comingSoonText: string;
}) => (
  <Link
    to={href}
    className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 dark:border-white/10 hover:border-[#C9A96E]/80 transition-all duration-500 shadow-md hover:shadow-[0_16px_40px_rgba(201,169,110,0.22)] aspect-[3/4] flex flex-col justify-between p-4 sm:p-6 bg-card select-none"
  >
    {/* Image de fond de catégorie avec micro-zoom doux */}
    <img
      src={image || "/mk-banner.png"}
      alt={title}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
    />

    {/* Double dégradé feutré pour une lisibilité textuelle absolue */}
    <div className="absolute inset-0 z-1 bg-gradient-to-t from-black/95 via-black/50 to-black/20 group-hover:from-black/95 group-hover:via-black/60 group-hover:to-black/30 transition-all duration-500" />

    {/* Badge supérieur (À venir uniquement lorsque applicable) */}
    <div className="relative z-10 flex items-center justify-end min-h-[26px]">
      {isComingSoon && (
        <span className="inline-flex items-center gap-1.5 text-[9.5px] sm:text-[10.5px] uppercase tracking-[0.2em] font-extrabold px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-black border border-amber-100 shadow-md animate-pulse">
          <Clock className="w-3 h-3 text-black shrink-0" strokeWidth={2.4} />
          <span>{comingSoonText}</span>
        </span>
      )}
    </div>

    {/* Contenu textuel inférieur */}
    <div className="relative z-10 space-y-2">
      <h3 className="font-serif text-lg sm:text-2xl font-medium text-white group-hover:text-[#F5E6CC] transition-colors leading-tight">
        {title}
      </h3>
      {text && (
        <p className="text-[11px] sm:text-xs font-light text-white/85 line-clamp-2 leading-relaxed">
          {text}
        </p>
      )}

      {/* Bouton d'action élégant */}
      <div className="pt-1.5 flex items-center">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 group-hover:bg-[#C9A96E] text-white group-hover:text-[#12100E] text-[10.5px] sm:text-[11px] font-semibold tracking-wider uppercase backdrop-blur-md border border-white/20 group-hover:border-[#C9A96E] transition-all duration-300 shadow-xs">
          <span>{discoverText}</span>
          <ArrowUpRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2} />
        </span>
      </div>
    </div>
  </Link>
);

const FiftyFiftySection = () => {
  const { language, t } = useLanguage();
  const categories = useCategories();
  const { data: allParfums } = useParfums();
  const activeCategories = categories.filter((c) => c.is_active);

  // Si aucune catégorie n'est créée en base, masquer proprement la section
  if (activeCategories.length === 0) {
    return null;
  }

  return (
    <section className="w-full mb-20 sm:mb-32 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center mb-8 sm:mb-14">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-[10px] sm:text-xs font-medium tracking-[0.25em] uppercase mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
          <span>{t.univers.tag}</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-4xl text-foreground font-light tracking-tight">
          {t.univers.title}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground font-light max-w-xl mx-auto mt-2">
          {t.univers.subtitle}
        </p>
        <div className="w-12 h-0.5 bg-primary/40 mx-auto mt-3 rounded-full" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {activeCategories.map((cat) => {
          const hasProducts = allParfums.some((p) => isParfumInCategory(p, cat.slug));
          const effectiveComingSoon = Boolean(cat.is_coming_soon) && !hasProducts;
          const displayName = (language === "en" && cat.name_en) ? cat.name_en : cat.name;
          const displayDesc = (language === "en" && cat.description_en) ? cat.description_en : cat.description;

          return (
            <Card
              key={cat.id}
              title={displayName}
              text={displayDesc}
              href={`/collection/${cat.slug}`}
              image={cat.image || cat.icon || (cat.images && cat.images.length > 0 ? cat.images[0] : "/mk-banner.png")}
              isComingSoon={effectiveComingSoon}
              discoverText={effectiveComingSoon ? t.univers.discover : t.common.explore}
              comingSoonText={t.univers.comingSoon}
            />
          );
        })}
      </div>
    </section>
  );
};

export default FiftyFiftySection;
