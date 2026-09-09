import { Link } from "react-router-dom";
import ProductImage from "@/components/ui/ProductImage";
import { useParfums } from "@/hooks/useParfums";
import { formatMAD } from "@/lib/sizes";

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
      p.maison.trim().toLowerCase() === maison.trim().toLowerCase()
  );

  // 2. Fallback products if same maison has fewer items
  const otherParfums = availableParfums.filter(
    (p) =>
      !maison || p.maison.trim().toLowerCase() !== maison.trim().toLowerCase()
  );

  // Combine: Prioritize same provider first
  const related = [...sameMaison, ...otherParfums].slice(0, 4);

  if (!loading && related.length === 0) {
    return null;
  }

  return (
    <section className="w-full mt-10 sm:mt-24 pt-6 sm:pt-10 border-t border-border/40 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-6 sm:mb-8 pb-3 border-b border-border/40">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-bold mb-1">
            {maison ? `Maison ${maison}` : "Haute Parfumerie"}
          </p>
          <h2 className="font-serif text-xl sm:text-3xl text-foreground font-medium">
            Produits Apparentés
          </h2>
        </div>
        <Link
          to="/collection/all"
          className="text-[10px] sm:text-xs uppercase tracking-wider text-primary hover:text-primary-hover font-semibold border-b border-primary/40 pb-0.5"
        >
          Voir Tout
        </Link>
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
                <div className="relative mb-2 overflow-hidden rounded-xl bg-muted/40">
                  <ProductImage
                    src={p.image_url}
                    alt={p.name}
                    label={p.image_label}
                    aspect="aspect-[4/5]"
                    fitMode="contain"
                    className="max-h-48 sm:max-h-56 mx-auto transition-all duration-300 group-hover:scale-105"
                  />
                </div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                  {p.maison}
                </p>
                <h3 className="font-serif text-xs sm:text-sm font-medium truncate mt-0.5 text-foreground">
                  {p.name}
                </h3>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/40">
                  <span className="text-xs font-serif font-bold text-primary">
                    {isFull
                      ? formatMAD(p.full_bottle_price ?? 0)
                      : `À partir de ${formatMAD(p.price_5ml)}`}
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full border border-border/50">
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

export default RelatedProducts;
