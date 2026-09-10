/**
 * Section Univers Olfactifs (FiftyFiftySection / Grille Catégories Dynamiques) — Maison Kenzi
 *
 * Affiche les univers et catégories configurés dans Supabase.
 * Masque automatiquement la section si aucune catégorie n'est encore enregistrée en base.
 */

import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useCategories } from "@/store/useCategoryStore";

const Card = ({
  title,
  text,
  href,
  tag,
  image,
}: {
  title: string;
  text: string;
  href: string;
  tag: string;
  image?: string;
}) => (
  <Link
    to={href}
    className="group relative overflow-hidden rounded-2xl border border-border/70 hover:border-primary/50 transition-all duration-700 shadow-nude aspect-[3/4] flex flex-col justify-between p-4 sm:p-6 bg-card"
  >
    {/* Image de fond de catégorie si configurée */}
    {image && (
      <img
        src={image}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
    )}

    {/* Voile de fond feutré */}
    <div
      className={`absolute inset-0 z-1 transition-opacity duration-500 ${
        image
          ? "bg-gradient-to-t from-black/85 via-black/40 to-black/20 group-hover:opacity-90"
          : "bg-gradient-to-t from-black/80 via-black/30 to-black/10 group-hover:opacity-90"
      }`}
    />

    {/* Badge supérieur */}
    <div className="relative z-10 flex items-center justify-between">
      <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] font-medium px-3 py-1 rounded-full backdrop-blur-md shadow-xs bg-black/50 text-white/90 border border-white/15">
        {tag}
      </span>
    </div>

    {/* Typographie intégrée */}
    <div className="relative z-10 space-y-1.5">
      <h3 className="font-serif text-base sm:text-xl font-normal text-white group-hover:text-primary transition-colors leading-tight">
        {title}
      </h3>
      {text && (
        <p className="text-[11px] sm:text-xs font-light text-white/75 line-clamp-2 leading-snug">
          {text}
        </p>
      )}

      <div className="pt-2 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-primary uppercase tracking-[0.2em] transition-all group-hover:translate-x-1">
        <span>Explorer</span>
        <ArrowRight size={13} strokeWidth={1.5} />
      </div>
    </div>
  </Link>
);

const FiftyFiftySection = () => {
  const categories = useCategories();
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
          <span>Haute Parfumerie</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-4xl text-foreground font-light tracking-tight">
          Nos Univers Olfactifs
        </h2>
        <div className="w-12 h-0.5 bg-primary/40 mx-auto mt-3 rounded-full" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {activeCategories.map((cat) => (
          <Card
            key={cat.id}
            title={cat.name}
            text={cat.description}
            href={`/collection/${cat.slug}`}
            tag={cat.name}
            image={cat.image || cat.icon}
          />
        ))}
      </div>
    </section>
  );
};

export default FiftyFiftySection;
