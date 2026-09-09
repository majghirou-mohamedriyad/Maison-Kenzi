import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Sun, Leaf, Snowflake, Sparkles } from "lucide-react";
import { useParfums } from "@/hooks/useParfums";
import ProductImage from "@/components/ui/ProductImage";
import { formatMAD } from "@/lib/sizes";
import {
  getSavedSeasonalSettings,
  resolveActiveSeason,
  SEASONS,
  SEASONAL_UPDATED_EVENT,
  SeasonKey,
} from "@/lib/season";

const seasonIconMap = {
  Sun,
  Leaf,
  Snowflake,
  Sparkles,
};

const SeasonalSection = () => {
  const [settings, setSettings] = useState(getSavedSeasonalSettings());
  const { data: allProducts, loading } = useParfums();

  useEffect(() => {
    const handleUpdate = () => {
      setSettings(getSavedSeasonalSettings());
    };
    window.addEventListener(SEASONAL_UPDATED_EVENT, handleUpdate);
    return () => window.removeEventListener(SEASONAL_UPDATED_EVENT, handleUpdate);
  }, []);

  const activeSeasonKey: SeasonKey = resolveActiveSeason(settings.mode);
  const seasonInfo = SEASONS[activeSeasonKey];

  const SeasonIcon = seasonIconMap[seasonInfo.icon as keyof typeof seasonIconMap] || Sun;

  const displayTitle = settings.customTitle.trim() || seasonInfo.defaultTitle;

  // Filter products in order of productIds
  const seasonalProducts = settings.productIds
    .map((id) => allProducts.find((p) => p.id === id))
    .filter(Boolean);

  // Fallback if none matched
  const featured = seasonalProducts.length > 0 ? seasonalProducts : allProducts.slice(0, 4);

  return (
    <section className="w-full mb-16 sm:mb-28 px-4 sm:px-6 max-w-7xl mx-auto relative overflow-hidden">
      {/* Ambient Seasonal Floating Particle Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-8 left-[12%] w-3 h-3 rounded-full bg-primary/20 blur-[1px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute top-24 right-[18%] w-2 h-2 rounded-full bg-amber-400/30 blur-[1px] animate-ping" style={{ animationDuration: '6s' }} />
        <div className="absolute bottom-12 left-[25%] w-4 h-4 rounded-full bg-primary/15 blur-[2px] animate-bounce" style={{ animationDuration: '7s' }} />
        <div className="absolute bottom-20 right-[10%] w-2.5 h-2.5 rounded-full bg-amber-300/25 blur-[1px] animate-pulse" style={{ animationDuration: '5s' }} />
      </div>

      {/* Header - Matches Nos Meilleures Ventes */}
      <div className="flex items-end justify-between mb-6 sm:mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-primary mb-1 flex items-center gap-2 font-medium">
            <span className="relative flex h-4 w-4 items-center justify-center">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/30 opacity-75"></span>
              <SeasonIcon className="relative w-3.5 h-3.5 text-primary transition-transform duration-700 hover:rotate-180" />
            </span>
            <span>{seasonInfo.badge}</span>
          </p>
          <h2 className="font-serif text-2xl sm:text-4xl text-foreground">
            {displayTitle}
          </h2>
        </div>
        <Link
          to="/collection/all"
          className="text-[11px] sm:text-xs uppercase tracking-widest text-primary hover:text-primary-hover border-b border-primary/40 pb-0.5 transition-all hover:gap-1.5 inline-flex items-center"
        >
          Voir tout
        </Link>
      </div>

      {/* Grid - Matching Nos Meilleures Ventes Layout */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-muted mb-3 rounded-sm" />
              <div className="h-3 w-20 bg-muted mb-2 rounded" />
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {featured.map((p, idx) => {
            if (!p) return null;
            const isFull = p.sale_mode === "full_bottle";
            const decantStock = (p.stock_5ml ?? 0) + (p.stock_10ml ?? 0);
            const outOfStock =
              !p.is_active ||
              p.stock_status === "rupture" ||
              (isFull ? (p.full_bottle_stock ?? 0) <= 0 : decantStock <= 0);

            return (
              <Link
                key={p.id}
                to={`/parfum/${p.id}`}
                className={`block group relative transition-all duration-500 hover:-translate-y-1 ${
                  outOfStock ? "opacity-75" : ""
                }`}
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                {/* Image Container */}
                <div className="relative mb-2.5 sm:mb-3 overflow-hidden rounded-xl bg-muted/40">
                  <ProductImage
                    src={p.image_url}
                    alt={p.name}
                    label={p.image_label}
                    className={`transition-all duration-700 ease-out ${
                      outOfStock ? "grayscale opacity-50 contrast-75" : "group-hover:scale-105"
                    }`}
                  />

                  {/* Out of stock badge */}
                  {outOfStock && (
                    <span className="absolute top-2 left-2 z-10 inline-flex items-center gap-1.5 text-[9px] uppercase tracking-widest bg-zinc-900/90 dark:bg-zinc-800/90 text-zinc-200 backdrop-blur-md px-2.5 py-0.5 rounded-full font-bold border border-zinc-700/60 shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                      <span>Rupture</span>
                    </span>
                  )}

                  {/* Light Sweep Shimmer Effect */}
                  {!outOfStock && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out pointer-events-none" />
                  )}

                  {/* Floating Seasonal Animated Tag */}
                  <div className="absolute top-2 right-2 backdrop-blur-md bg-background/85 text-primary border border-primary/30 px-1.5 sm:px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] uppercase tracking-wider font-medium opacity-90 group-hover:scale-110 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 flex items-center gap-1 shadow-sm">
                    <SeasonIcon className="w-2.5 h-2.5 transition-transform duration-700 group-hover:rotate-180" />
                    <span>{seasonInfo.label}</span>
                  </div>
                </div>

                {/* Details */}
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground truncate transition-colors duration-300 group-hover:text-primary">
                  {p.maison}
                </p>
                <h3 className={`font-serif text-sm sm:text-lg mt-0.5 sm:mt-1 truncate font-medium transition-colors duration-300 ${
                  outOfStock ? "text-muted-foreground" : "text-foreground group-hover:text-primary"
                }`}>
                  {p.name}
                </h3>
                <div className="flex items-center justify-between mt-2 pt-1 border-t sm:border-t-0 border-border/30">
                  <span className={`text-[11px] sm:text-xs font-light ${
                    outOfStock ? "text-muted-foreground line-through opacity-70" : "text-foreground/80"
                  }`}>
                    {outOfStock
                      ? "Rupture de stock"
                      : isFull
                      ? formatMAD(p.full_bottle_price ?? 0)
                      : `À partir de ${formatMAD(p.price_5ml)}`}
                  </span>
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground bg-secondary/80 border border-border/40 px-1.5 sm:px-2 py-0.5 rounded-sm">
                    {p.gender}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default SeasonalSection;
