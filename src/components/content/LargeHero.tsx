/**
 * Section Hero Immersive & Haute Parfumerie — Maison Kenzi
 *
 * Diaporama cinématique plein écran avec animation Ken Burns,
 * halos dorés champagne, typographie éditoriale de prestige
 * et barre d'engagements de confiance intégrée (zéro emoji).
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const SLIDES = [
  {
    id: 1,
    tag: "MAISON KENZI · HAUTE PARFUMERIE",
    titlePrefix: "L'Essence du ",
    titleHighlight: "Prestige",
    subtitle: "Parfums de niche d'exception et flacons complets scellés sélectionnés pour les connaisseurs au Maroc.",
    btnText: "Découvrir les Collections",
    btnLink: "/collection/all",
    bgImage: "/mk-banner.png",
  },
  {
    id: 2,
    tag: "SAVOIR-FAIRE & TRADITION · FAIT MAIN",
    titlePrefix: "L'Excellence de ",
    titleHighlight: "L'Artisanat",
    subtitle: "Créations artisanales d'exception, pièces uniques façonnées avec passion selon les traditions nobles marocaines.",
    btnText: "Découvrir l'Artisanat",
    btnLink: "/collection/produits-artisanaux",
    bgImage: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 3,
    tag: "OBJETS DE COLLECTION · PATRIMOINE & HISTOIRE",
    titlePrefix: "Le Charme des ",
    titleHighlight: "Antiquités",
    subtitle: "Pièces rares, objets précieux d'époque et trésors intemporels chargés d'histoire et d'élégance.",
    btnText: "Explorer les Antiques",
    btnLink: "/collection/antiques",
    bgImage: "https://images.unsplash.com/photo-1544457070-4cd773b4d71e?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 4,
    tag: "FLACONS COMPLETS & SILLAGES NOBLES",
    titlePrefix: "L'Art du ",
    titleHighlight: "Sillage",
    subtitle: "Explorez les plus grands chefs-d'œuvre olfactifs en flacons d'origine 100% scellés et authentiques.",
    btnText: "Explorer les Parfums",
    btnLink: "/collection/parfums",
    bgImage: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=2000&auto=format&fit=crop",
  },
];

const LargeHero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Rotation automatique toutes les 7 secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[currentSlide];

  return (
    <section className="relative w-full mb-16 sm:mb-24 overflow-hidden">
      {/* Conteneur Hero Immersif occupant 100% de la section Hero */}
      <div className="relative w-full min-h-[580px] sm:min-h-[660px] md:min-h-[740px] lg:min-h-[820px] flex flex-col justify-center items-center overflow-hidden bg-[#0C0B0A]">
        
        {/* Layer Arrière-Plan : Diaporama animé occupant 100% de la surface du Hero */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
          {SLIDES.map((s, index) => {
            const isActive = currentSlide === index;
            return (
              <div
                key={s.id}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                  isActive ? "opacity-100 z-1" : "opacity-0 z-0"
                }`}
              >
                <img
                  src={s.bgImage}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/mk-banner.png";
                  }}
                  alt={`Hero ${s.titleHighlight} - Maison Kenzi`}
                  className={`w-full h-full object-cover object-center transform transition-transform duration-[7000ms] ease-out ${
                    isActive ? "scale-105" : "scale-100"
                  }`}
                />
              </div>
            );
          })}

          {/* Dégradés cinématiques de superposition pour un contraste luxe optimal */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0C0B0A] via-[#0C0B0A]/50 to-[#0C0B0A]/40 z-2" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0C0B0A]/85 via-[#0C0B0A]/40 to-[#0C0B0A]/85 z-2" />

          {/* Halos d'ambiance dorée champagne */}
          <div 
            aria-hidden="true"
            className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-[#C9A96E]/15 rounded-full blur-[130px] transform-gpu pointer-events-none z-3" 
          />
        </div>

        {/* Flèches de navigation latérale */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1))}
          className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-12 h-12 rounded-full bg-black/40 hover:bg-[#C9A96E] text-white hover:text-[#0C0B0A] border border-white/20 hover:border-[#C9A96E] items-center justify-center transition-all duration-300 backdrop-blur-md cursor-pointer group shadow-xl"
          aria-label="Slide précédente"
        >
          <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
        </button>

        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)}
          className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-12 h-12 rounded-full bg-black/40 hover:bg-[#C9A96E] text-white hover:text-[#0C0B0A] border border-white/20 hover:border-[#C9A96E] items-center justify-center transition-all duration-300 backdrop-blur-md cursor-pointer group shadow-xl"
          aria-label="Slide suivante"
        >
          <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
        </button>

        {/* Contenu Central de la Section Hero */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 sm:px-8 max-w-4xl mx-auto pt-28 sm:pt-36 md:pt-40 pb-16 sm:pb-20">
          
          {/* Badge / Surtitre Doré */}
          <div
            key={`tag-${slide.id}`}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1A1816]/80 backdrop-blur-xl border border-[#C9A96E]/40 text-[#C9A96E] text-[10px] sm:text-xs font-medium tracking-[0.3em] uppercase mb-5 shadow-lg animate-in fade-in zoom-in-95 duration-500"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C9A96E] shrink-0" />
            <span>{slide.tag}</span>
          </div>

          {/* Titre Principal Editorial */}
          <h1
            key={`title-${slide.id}`}
            className="font-serif text-3xl sm:text-5xl md:text-6xl lg:text-7xl text-[#FAF7F2] tracking-tight leading-[1.1] drop-shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-700"
          >
            {slide.titlePrefix}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5C368] via-[#FFF3D6] to-[#C9A96E] font-serif font-medium italic">
              {slide.titleHighlight}
            </span>
          </h1>

          {/* Sous-titre */}
          <p
            key={`sub-${slide.id}`}
            className="mt-4 sm:mt-6 text-xs sm:text-base md:text-lg font-light text-[#E8E1D7] max-w-xl leading-relaxed drop-shadow px-2 animate-in fade-in slide-in-from-bottom-3 duration-700"
          >
            {slide.subtitle}
          </p>

          {/* Boutons d'Action (CTA) */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 z-20">
            <Button
              asChild
              className="rounded-full bg-[#C9A96E] hover:bg-[#B8985F] text-[#0C0B0A] uppercase tracking-[0.2em] text-xs font-semibold h-12 sm:h-14 px-8 sm:px-10 shadow-2xl shadow-[#C9A96E]/20 hover:scale-105 active:scale-95 transition-all duration-300 gap-2 cursor-pointer border-0"
            >
              <Link to={slide.btnLink}>
                <span>{slide.btnText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Indicateurs de Diapositive (Pagination Dots) */}
          <div className="flex items-center gap-2.5 mt-8 sm:mt-10 z-20">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                  currentSlide === index
                    ? "w-10 bg-[#C9A96E] shadow-sm shadow-[#C9A96E]/50"
                    : "w-2.5 bg-white/30 hover:bg-white/60"
                }`}
                aria-label={`Aller à la diapositive ${index + 1}`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default LargeHero;

