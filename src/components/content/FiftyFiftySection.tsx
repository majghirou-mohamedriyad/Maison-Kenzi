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
    className={`group relative overflow-hidden rounded-2xl sm:rounded-3xl border transition-all duration-700 shadow-xl aspect-[3/4] flex flex-col justify-between p-3.5 sm:p-6 bg-black ${
      isGold ? "border-primary/60 hover:border-primary ring-1 ring-primary/30" : "border-white/15 hover:border-primary/60"
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
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 z-0"
    />

    {/* Multi-layer Dark Gradient Overlay for perfect text contrast */}
    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20 z-1 transition-opacity duration-500 group-hover:opacity-90" />

    {/* Top Tag Badge */}
    <div className="relative z-10 flex items-center justify-between">
      <span
        className={`text-[9px] sm:text-[10px] uppercase tracking-[0.2em] font-bold px-2.5 py-1 rounded-full backdrop-blur-md shadow-md ${
          isGold
            ? "bg-primary text-primary-foreground font-bold shadow-primary/20"
            : "bg-black/60 text-white border border-white/20"
        }`}
      >
        {tag}
      </span>
    </div>

    {/* Bottom Integrated Typography */}
    <div className="relative z-10 space-y-1.5">
      <h3 className="font-serif text-sm sm:text-xl font-bold text-white group-hover:text-primary transition-colors leading-tight">
        {title}
      </h3>
      <p className="text-[10px] sm:text-xs font-light text-white/80 line-clamp-1 leading-snug">
        {text}
      </p>

      <div className="pt-2 flex items-center gap-1 text-[10px] sm:text-xs font-bold text-primary uppercase tracking-widest transition-all group-hover:translate-x-1">
        <span>Explorer</span>
        <ArrowRight size={13} />
      </div>
    </div>
  </Link>
);

const FiftyFiftySection = () => {
  return (
    <section className="w-full mb-16 sm:mb-28 px-3 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center mb-6 sm:mb-12">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[10px] sm:text-xs font-semibold tracking-[0.25em] uppercase mb-2 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
          <span>Haute Parfumerie</span>
        </div>
        <h2 className="font-serif text-xl sm:text-4xl text-foreground font-bold tracking-tight">
          Explorez Nos Univers Olfactifs
        </h2>
        <div className="w-12 h-0.5 bg-primary/50 mx-auto mt-2 rounded-full" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {CATEGORIES.map((cat, i) => (
          <Card key={i} {...cat} />
        ))}
      </div>
    </section>
  );
};

export default FiftyFiftySection;
