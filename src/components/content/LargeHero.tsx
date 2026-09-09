import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Truck,
  Star,
  Award,
  ChevronLeft,
  ChevronRight,
  Compass,
} from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const heroBadges = [
  { icon: ShieldCheck, title: "100% Originaux", shortTitle: "100% Originaux" },
  { icon: Truck, title: "Livraison 24–48h Maroc", shortTitle: "Livraison 24-48h" },
  { icon: Award, title: "Décants 5ml & 10ml", shortTitle: "Décants 5/10ml" },
  { icon: Star, title: "Paiement à la Réception", shortTitle: "Paiement Réception" },
];

const SLIDES = [
  {
    id: 1,
    tag: "MAISON KENZI",
    titlePrefix: "L'Essence du ",
    titleHighlight: "Prestige",
    subtitle: "Parfums d'exception & décants rares livrés chez vous au Maroc.",
    btnText: "Découvrir la Collection",
    btnLink: "/collection/all",
    bgImage: heroImage,
  },
  {
    id: 2,
    tag: "HAUTE PARFUMERIE",
    titlePrefix: "L'Art du ",
    titleHighlight: "Décant",
    subtitle: "Flacons nomades 5ml & 10ml en verre noble avec pulvérisateur aluminium.",
    btnText: "Explorer les Décants",
    btnLink: "/collection/all",
    bgImage: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=2000&auto=format&fit=crop",
  },
  {
    id: 3,
    tag: "CRÉATIONS RARES",
    titlePrefix: "Le Sillage de ",
    titleHighlight: "L'Élégance",
    subtitle: "Sélection exclusive de parfums de niche confidentiels et extraits précieux.",
    btnText: "Voir les Parfums",
    btnLink: "/collection/all",
    bgImage: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=2000&auto=format&fit=crop",
  },
];

const LargeHero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-advance slides every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[currentSlide];

  return (
    <section className="w-full mb-16 sm:mb-28 px-3 sm:px-6 max-w-6xl mx-auto">
      <div className="relative overflow-hidden rounded-3xl border border-primary/30 shadow-2xl group min-h-[420px] sm:min-h-[480px] md:min-h-[500px] bg-black">
        {/* Base Fallback Image */}
        <img
          src={heroImage}
          alt="Base Background - Maison Kenzi"
          className="absolute inset-0 w-full h-full object-cover object-center z-0"
        />

        {/* Slide Images Layer */}
        {SLIDES.map((s, index) => (
          <img
            key={s.id}
            src={s.bgImage}
            onError={(e) => {
              (e.target as HTMLImageElement).src = heroImage;
            }}
            alt={`Hero Background ${s.titleHighlight} - Maison Kenzi`}
            className={`absolute inset-0 w-full h-full object-cover object-center z-0 transition-all duration-1000 ease-in-out ${
              currentSlide === index
                ? "opacity-100 scale-100 filter-none"
                : "opacity-0 scale-105 pointer-events-none"
            }`}
          />
        ))}

        {/* Dark Luxury Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 z-1 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 z-1 pointer-events-none" />

        {/* Navigation Arrows */}
        <button
          onClick={() => setCurrentSlide((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1))}
          className="absolute left-3 lg:left-5 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-10 h-10 rounded-full bg-black/50 hover:bg-primary text-white hover:text-primary-foreground border border-white/20 hover:border-primary items-center justify-center transition-all duration-300 backdrop-blur-md cursor-pointer"
          aria-label="Slide précédente"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <button
          onClick={() => setCurrentSlide((prev) => (prev + 1) % SLIDES.length)}
          className="absolute right-3 lg:right-5 top-1/2 -translate-y-1/2 z-20 hidden md:flex w-10 h-10 rounded-full bg-black/50 hover:bg-primary text-white hover:text-primary-foreground border border-white/20 hover:border-primary items-center justify-center transition-all duration-300 backdrop-blur-md cursor-pointer"
          aria-label="Slide suivante"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Main Hero Content */}
        <div className="relative min-h-[420px] sm:min-h-[480px] md:min-h-[500px] flex flex-col items-center justify-center text-center px-4 sm:px-8 md:px-12 py-8 z-10">
          {/* Eyebrow Pill */}
          <div
            key={`tag-${slide.id}`}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/60 backdrop-blur-xl border border-primary/30 text-primary text-[10px] sm:text-xs font-semibold tracking-[0.25em] uppercase mb-3 shadow-lg animate-in zoom-in-95 fade-in duration-500"
          >
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse shrink-0" />
            <span>{slide.tag}</span>
          </div>

          {/* Title */}
          <h1
            key={`title-${slide.id}`}
            className="font-serif text-3xl sm:text-5xl md:text-6xl text-white tracking-tight max-w-2xl leading-[1.1] drop-shadow-2xl animate-in fade-in duration-500"
          >
            {slide.titlePrefix}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E5C368] via-[#FFF3D6] to-[#C9A96E] font-serif font-bold italic">
              {slide.titleHighlight}
            </span>
          </h1>

          {/* Subtitle */}
          <p
            key={`sub-${slide.id}`}
            className="mt-3 text-xs sm:text-base font-light text-white/90 max-w-md md:max-w-lg leading-relaxed drop-shadow-md px-2 animate-in fade-in duration-500"
          >
            {slide.subtitle}
          </p>

          {/* Action CTA Button */}
          <div className="mt-5 sm:mt-7 z-20">
            <Button
              asChild
              className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wider text-xs font-bold h-11 sm:h-12 px-8 shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all duration-300 gap-2 cursor-pointer border-0"
            >
              <Link to={slide.btnLink}>
                <span>{slide.btnText}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>

          {/* Slide Indicator Dots */}
          <div className="flex items-center gap-2 mt-5 sm:mt-7 z-20">
            {SLIDES.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                  currentSlide === index
                    ? "w-8 bg-primary shadow-sm"
                    : "w-2 bg-white/40 hover:bg-white/70"
                }`}
                aria-label={`Aller à la slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Bottom Trust Badges Bar */}
        <div className="absolute bottom-0 inset-x-0 bg-black/85 backdrop-blur-xl border-t border-white/10 py-2.5 px-3 sm:px-6 z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 max-w-5xl mx-auto text-center">
            {heroBadges.map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={i}
                  className="flex items-center justify-center gap-2 text-white/90 text-xs tracking-wide font-medium"
                >
                  <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="hidden sm:inline">{b.title}</span>
                  <span className="sm:hidden">{b.shortTitle}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LargeHero;
