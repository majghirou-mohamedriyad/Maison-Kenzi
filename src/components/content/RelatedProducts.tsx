/**
 * Section Produits Similaires — Maison Kenzi
 *
 * Suggère des fragrances de la même maison ou du même univers olfactif
 * avec étiquettes de genre et saisons d'utilisation.
 */

import { Link } from "react-router-dom";
import ProductImage from "@/components/ui/ProductImage";
import { useParfums } from "@/hooks/useParfums";
import { formatMAD } from "@/lib/sizes";
import { Sun, Leaf, Wind, Snowflake } from "lucide-react";
import { getParfumSeasons, getSeasonMeta } from "@/lib/seasonsStore";

interface RelatedProductsProps {
  currentParfumId?: string;
  maison?: string;
  gender?: string;
}

const RelatedProducts = ({ currentParfumId, maison, gender }: RelatedProductsProps) => {
  const { data: allParfums, loading } = useParfums();

  // Filter out current product AND out of stock / inactive products
  const availableParfums = allParfums.filter((p) => {
    if (p.id === currentParfumId) return false;
    const isFull = p.sale_mode === "full_bottle";
    const decantStock = (p.stock_5ml ?? 0) + (p.stock_10ml ?? 0);
    const outOfStock =
      !p.is_active ||
      p.stock_status === "rupture" ||
      (isFull ? (p.full_bottle_stock ?? 0) <= 0 : decantStock <= 0);
    return !outOfStock;
  });

  // 1. Filter products from the SAME maison/provider
  const sameMaison = availableParfums.filter(
    (p) =>
      maison &&
      p.maison &&
      p.maison.trim().toLowerCase() === maison.trim().toLowerCase()
  );

  // 2. Filter products from the SAME gender (if different from maison)
  const sameGender = availableParfums.filter(
    (p) =>
      gender &&
      p.gender === gender &&
      (!maison || p.maison?.trim().toLowerCase() !== maison.trim().toLowerCase())
  );

  // 3. Fallback: other active products
  const remaining = availableParfums.filter(
    (p) =>
      (!maison || p.maison?.trim().toLowerCase() !== maison.trim().toLowerCase()) &&
      (!gender || p.gender !== gender)
  );

  // Combine to get up to 4 recommendations prioritizing same maison, then same gender
  const related = [...sameMaison, ...sameGender, ...remaining].slice(0, 4);

  if (!loading && related.length === 0) {
    return null;
  }

  return (
    <section className="mt-12 sm:mt-16 pt-8 sm:pt-12 border-t border-border/60 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-primary font-bold block">
            Découverte Olfactive
          </span>
          <h2 className="font-serif text-lg sm:text-2xl text-foreground font-semibold">
            Vous Aimerez Aussi
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="aspect-[4/5] bg-muted rounded-2xl" />
              <div className="h-3 w-20 bg-muted rounded" />
              <div className="h-4 w-32 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {related.map((p) => {
            const isFull = p.sale_mode === "full_bottle";

            return (
              <Link
                key={p.id}
                to={`/parfum/${p.id}`}
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="group block rounded-2xl p-2 sm:p-3 transition-all hover:bg-card/40 relative text-left"
              >
                <div className="relative mb-2 overflow-hidden rounded-xl bg-muted/40 aspect-[4/5]">
                  <ProductImage
                    src={p.image_url}
                    images={p.images}
                    alt={p.name}
                    label={p.image_label}
                    aspect="aspect-[4/5]"
                    fitMode="cover"
                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                  {p.maison}
                </p>
                <h3 className="font-serif text-xs sm:text-sm font-medium truncate mt-0.5 text-foreground">
                  {p.name}
                </h3>

                {/* Étiquettes Genre & Saisons d'utilisation */}
                <div className="flex items-center flex-wrap gap-1 mt-1.5 mb-1">
                  {p.gender && (
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground bg-secondary/90 border border-border/50 px-2 py-0.5 rounded-full font-medium">
                      {p.gender}
                    </span>
                  )}
                  {getParfumSeasons(p).map((season) => {
                    const meta = getSeasonMeta(season);
                    const SeasonIconComp = meta.icon;
                    return (
                      <span
                        key={season}
                        className="inline-flex items-center gap-1 text-[9px] uppercase tracking-wider text-muted-foreground bg-secondary/90 border border-border/50 px-2 py-0.5 rounded-full font-medium"
                      >
                        <SeasonIconComp className="w-2.5 h-2.5 text-primary" strokeWidth={1.75} />
                        <span>{meta.label}</span>
                      </span>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-border/40">
                  <span className="text-xs font-serif font-bold text-primary">
                    {isFull
                      ? formatMAD(p.full_bottle_price ?? 0)
                      : `Dès ${formatMAD(p.price_5ml || p.price_10ml || 0)}`}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-primary font-medium">
                    {isFull ? (p.full_bottle_volume_ml ? `${p.full_bottle_volume_ml} ml` : "Flacon") : "Décant"}
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

export default RelatedProducts;
