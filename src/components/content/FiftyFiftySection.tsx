/**
 * Section Univers Olfactifs (FiftyFiftySection / Grille Catégories) — Maison Kenzi
 *
 * Présentation des 4 catégories phares (Homme, Femme, Déodorants, Packs)
 * avec visuels verticaux élégants et typographie éditoriale.
 */

import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";

const CATEGORIES = [
  {
    title: "Parfums Homme",
    text: "Fragrances boisées, cuirées & ambrées.",
    href: "/collection/homme",
    src: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=1000&auto=format&fit=crop",
    fallbackSrc: "/products/g87MYErZ4y721NboX4dgUZheBrJKrMQamehWpORN_md.jpg",
    alt: "Parfums Homme — Maison Kenzi",
    tag: "Masculin",
  },
  {
    title: "Parfums Femme",
    text: "Sillages envoûtants, floraux & rares.",
    href: "/collection/femme",
    src: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1000&auto=format&fit=crop",
    fallbackSrc: "/products/lynd0GeO8jp8IAPSLqd5NIbsyvS6etaIniWkVsMv_md.jpg",
    alt: "Parfums Femme — Maison Kenzi",
    tag: "Féminin",
  },
  {
    title: "Déodorants Stick",
    text: "Fraîcheur intense & protection 48h.",
    href: "/collection/deodorants-stick",
    src: "/products/kaGqhOEfyMLMuT81ymdfkblWvtk1Bf7rtiQtJrju_md.jpg",
    fallbackSrc: "/products/kaGqhOEfyMLMuT81ymdfkblWvtk1Bf7rtiQtJrju_md.jpg",
    alt: "Déodorants Stick — Maison Kenzi",
    tag: "Soin & Fraîcheur",
  },
  {
    title: "Packs & Coffrets",
    text: "Duos d'exception & coffrets cadeau.",
    href: "/collection/packs",
    src: "/products/Klva1NBIVrAWITRlToAdkhN4pDMvlkXTrjHZXzCP_md.jpg",
    fallbackSrc: "/products/Klva1NBIVrAWITRlToAdkhN4pDMvlkXTrjHZXzCP_md.jpg",
    alt: "LES PACKS — Maison Kenzi",
    tag: "Exclusivité",
    isGold: true,
  },
];

const Card = ({
  title,
  text,
  href,
  src,
  fallbackSrc,
  alt,
  tag,
  isGold,
}: {
  title: string;
  text: string;
  href: string;
  src: string;
  fallbackSrc: string;
  alt: string;
  tag: string;
  isGold?: boolean;
}) => (
  <Link
    to={href}
    className={`group relative overflow-hidden rounded-2xl border transition-all duration-700 shadow-nude aspect-[3/4] flex flex-col justify-between p-4 sm:p-6 bg-card ${
      isGold ? "border-primary/50 hover:border-primary ring-1 ring-primary/20" : "border-border/70 hover:border-primary/50"
    }`}
  >
    {/* Full-bleed Visual Image */}
    <img
      src={src}
      onError={(e) => {
        (e.target as HTMLImageElement).src = fallbackSrc;
      }}
      alt={alt}
      loading="lazy"
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] z-0"
    />

    {/* Voile dégradé feutré pour contraste textuel parfait */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/15 z-1 transition-opacity duration-500 group-hover:opacity-90" />

    {/* Badge supérieur délicat */}
    <div className="relative z-10 flex items-center justify-between">
      <span
        className={`text-[9px] sm:text-[10px] uppercase tracking-[0.25em] font-medium px-3 py-1 rounded-full backdrop-blur-md shadow-xs ${
          isGold
            ? "bg-primary text-primary-foreground"
            : "bg-black/50 text-white/90 border border-white/15"
        }`}
      >
        {tag}
      </span>
    </div>

    {/* Typographie intégrée */}
    <div className="relative z-10 space-y-1.5">
      <h3 className="font-serif text-base sm:text-xl font-normal text-white group-hover:text-primary transition-colors leading-tight">
        {title}
      </h3>
      <p className="text-[11px] sm:text-xs font-light text-white/75 line-clamp-1 leading-snug">
        {text}
      </p>

      <div className="pt-2 flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium text-primary uppercase tracking-[0.2em] transition-all group-hover:translate-x-1">
        <span>Explorer</span>
        <ArrowRight size={13} strokeWidth={1.5} />
      </div>
    </div>
  </Link>
);

const FiftyFiftySection = () => {
  return (
    <section className="w-full mb-20 sm:mb-32 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center mb-8 sm:mb-14">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-[10px] sm:text-xs font-medium tracking-[0.25em] uppercase mb-3 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />
          <span>Haute Parfumerie</span>
        </div>
        <h2 className="font-serif text-2xl sm:text-4xl text-foreground font-light tracking-tight">
          Explorez Nos Univers Olfactifs
        </h2>
        <div className="w-12 h-0.5 bg-primary/40 mx-auto mt-3 rounded-full" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {CATEGORIES.map((cat, i) => (
          <Card key={i} {...cat} />
        ))}
      </div>
    </section>
  );
};

export default FiftyFiftySection;
