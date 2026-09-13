/**
 * Page Détail Parfum — Maison Kenzi
 *
 * Présentation immersive haute parfumerie d'un parfum avec affichage de la pyramide
 * olfactive, des saisons d'utilisation idéales, de la contenance et du formulaire de commande express.
 */

import { useState, useEffect, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import ProductImage from "@/components/ui/ProductImage";
import RelatedProducts from "@/components/content/RelatedProducts";
import ExpressOrderForm from "@/components/content/ExpressOrderForm";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import {
  Minus,
  Plus,
  ShieldCheck,
  Truck,
  ArrowLeft,
  Check,
  Sparkles,
  Droplets,
  Sun,
  Leaf,
  Wind,
  Snowflake,
  Calendar,
  Sparkle,
  Layers,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useParfum } from "@/hooks/useParfums";
import { useCart } from "@/store/cart";
import { toast } from "sonner";
import { SIZES, SIZE_META, formatMAD, priceFor } from "@/lib/sizes";
import { getParfumImages } from "@/lib/productImages";
import type { Size } from "@/types/database";
import type { OrderSelectionItem } from "@/components/content/ExpressOrderForm";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

import { getParfumSeasons, getSeasonMeta } from "@/lib/seasonsStore";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAutoTranslate } from "@/hooks/useAutoTranslate";

const ParfumDetail = () => {
  const { language, t } = useLanguage();
  const { parfumId } = useParams();
  const navigate = useNavigate();
  const { data: parfum, loading, error } = useParfum(parfumId);
  const { addItem, openCart } = useCart();

  const notesJoined = useMemo(() => {
    if (language === "en" && (parfum as any)?.notes_en) {
      return (parfum as any).notes_en;
    }
    return [
      ...(parfum?.notes_tete || []),
      ...(parfum?.notes_coeur || []),
      ...(parfum?.notes_fond || []),
    ]
      .filter(Boolean)
      .join(" • ");
  }, [parfum, language]);

  const rawDescription = useMemo(() => {
    if (language === "en" && (parfum as any)?.description_en) {
      return (parfum as any).description_en;
    }
    return parfum?.description;
  }, [parfum, language]);

  const translatedDescription = useAutoTranslate(rawDescription);
  const translatedNotes = useAutoTranslate(notesJoined);

  // State des quantités initialisé pour chaque format
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [parfumId]);

  useEffect(() => {
    if (!parfum) return;
    const isFull = parfum.sale_mode === "full_bottle";
    const fullStock = parfum.full_bottle_stock ?? 0;
    const decantStock = (parfum.stock_5ml ?? 0) + (parfum.stock_10ml ?? 0);
    const isOutOfStock =
      !parfum.is_active ||
      parfum.stock_status === "rupture" ||
      (isFull && fullStock <= 0) ||
      (!isFull && decantStock <= 0);

    const sizes: Size[] = isFull
      ? ["full"]
      : (["5ml", "10ml"] as Size[]).filter((s) => {
          const p = priceFor(parfum, s);
          return typeof p === "number" && !isNaN(p) && p > 0;
        });

    const initial: Record<string, number> = {};
    sizes.forEach((s, idx) => {
      initial[s] = idx === 0 && !isOutOfStock ? 1 : 0;
    });
    setQuantities(initial);
  }, [
    parfum?.id,
    parfum?.sale_mode,
    parfum?.is_active,
    parfum?.stock_status,
    parfum?.full_bottle_stock,
    parfum?.stock_5ml,
    parfum?.stock_10ml,
    parfum?.price_5ml,
    parfum?.price_10ml,
    parfum?.price_20ml,
  ]);

  const updateSizeQty = (s: Size, delta: number) => {
    setQuantities((prev) => {
      const current = prev[s] ?? 0;
      const next = Math.max(0, current + delta);
      if (delta > 0) {
        // Switch active format exclusively when adding quantity
        return { [s]: next };
      }
      return { ...prev, [s]: next };
    });
  };

  const setDirectSizeQty = (s: Size, qty: number) => {
    // Switch selection exclusively to selected format
    setQuantities({ [s]: Math.max(0, qty) });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 pt-6 px-4 max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-pulse">
            <div className="md:col-span-5 h-72 bg-muted rounded-2xl max-w-xs mx-auto w-full" />
            <div className="md:col-span-7 space-y-4">
              <div className="h-4 w-28 bg-muted rounded" />
              <div className="h-8 w-3/4 bg-muted rounded" />
              <div className="h-24 bg-muted rounded-xl" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !parfum) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-16">
          <h1 className="font-serif text-xl sm:text-2xl mb-3">Parfum introuvable</h1>
          {error && <p className="text-xs text-destructive mb-6">{error}</p>}
          <Button
            onClick={() => navigate("/collection/all")}
            className="rounded-full bg-primary text-primary-foreground text-xs uppercase tracking-wider px-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Voir la collection
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const isFullBottle = parfum.sale_mode === "full_bottle";

  // STRICTEMENT n'afficher que les formats ayant un prix > 0 configuré en base de données
  const availableSizes: Size[] = isFullBottle
    ? ["full"]
    : (["5ml", "10ml"] as Size[]).filter((s) => {
        const p = priceFor(parfum, s);
        return typeof p === "number" && !isNaN(p) && p > 0;
      });

  const fullStock = parfum.full_bottle_stock ?? 0;
  const outOfStock =
    !parfum.is_active ||
    parfum.stock_status === "rupture" ||
    (isFullBottle && fullStock <= 0);

  // Selected items with quantity > 0
  const selectedItems: OrderSelectionItem[] = availableSizes
    .filter((s) => (quantities[s] ?? 0) > 0)
    .map((s) => {
      const qty = quantities[s] ?? 0;
      const unitPrice = priceFor(parfum, s);
      return {
        size: s,
        sizeLabel:
          s === "full"
            ? parfum.full_bottle_volume_ml
              ? `${parfum.full_bottle_volume_ml} ml`
              : "Flacon Complet"
            : SIZE_META[s]?.label ?? s,
        quantity: qty,
        unitPrice,
        subtotal: unitPrice * qty,
      };
    });

  const totalQuantity = selectedItems.reduce((acc, it) => acc + it.quantity, 0);
  const totalPrice = selectedItems.reduce((acc, it) => acc + it.subtotal, 0);

  const handleAddToCart = () => {
    if (outOfStock) {
      toast.error("Ce produit est actuellement en rupture de stock.");
      return;
    }

    if (selectedItems.length === 0) {
      toast.error("Veuillez choisir une quantité pour au moins un format");
      return;
    }

    selectedItems.forEach((item) => {
      addItem({
        id: parfum.id,
        name: parfum.name,
        maison: parfum.maison,
        size: item.size as Size,
        quantity: item.quantity,
        price: item.unitPrice,
        imageLabel: parfum.image_label,
        imageUrl: parfum.image_url,
      });
    });

    const summary = selectedItems.map((i) => `${i.sizeLabel} × ${i.quantity}`).join(", ");
    toast.success("Ajouté au panier", {
      description: `${parfum.name} (${summary})`,
    });
    openCart();
  };

  const seoTitle = `${parfum.name} — ${parfum.maison} | Maison Kenzi`.slice(0, 70);
  const seoDescription = (
    parfum.description?.trim() ||
    `Produit authentique ${parfum.maison} ${parfum.name}, disponible chez Maison Kenzi au Maroc.`
  ).slice(0, 160);
  const canonical = `/parfum/${parfum.id}`;
  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: parfum.name,
    brand: { "@type": "Brand", name: parfum.maison },
    description: parfum.description || undefined,
    image: parfum.image_url || undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: priceFor(parfum, isFullBottle ? "full" : "10ml"),
      availability: parfum.is_active
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo
        title={seoTitle}
        description={seoDescription}
        path={canonical}
        ogType="product"
        jsonLd={productLd}
      />
      <Header />

      <main className="flex-1 pt-20 sm:pt-24 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Breadcrumb Navigation */}
          <Breadcrumb>
            <BreadcrumbList className="text-[10px] sm:text-xs">
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/" className="text-muted-foreground hover:text-primary">
                    Accueil
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link
                    to="/collection/all"
                    className="text-muted-foreground hover:text-primary"
                  >
                    Catalogue
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-foreground font-medium truncate max-w-[150px] sm:max-w-xs">
                  {parfum.name}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* MAIN PRODUCT CLEAN & AIRY GRID */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6 lg:gap-10 items-start">
            {/* LEFT COLUMN: Crystal Clear Product Image + Multi-photo Gallery Preview */}
            <div className="md:col-span-5 w-full space-y-3 md:sticky md:top-24">
              {(() => {
                const galleryImages = getParfumImages(parfum);
                const currentDisplayImage =
                  galleryImages[activeImageIndex] || parfum.image_url;

                const prevImg = () => {
                  if (galleryImages.length <= 1) return;
                  setActiveImageIndex(
                    (prev) => (prev - 1 + galleryImages.length) % galleryImages.length
                  );
                };

                const nextImg = () => {
                  if (galleryImages.length <= 1) return;
                  setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
                };

                return (
                  <div className="space-y-2.5">
                    {/* Conteneur de l'image principale */}
                    <div className="relative group overflow-hidden rounded-2xl bg-card/30 border border-border/60">
                      <ProductImage
                        src={currentDisplayImage}
                        alt={parfum.name}
                        label={parfum.image_label}
                        aspect="aspect-[4/5]"
                        fitMode="cover"
                        className={`max-h-[280px] sm:max-h-[380px] md:max-h-[440px] w-full mx-auto transition-all duration-500 ${
                          outOfStock ? "grayscale opacity-60 contrast-75" : ""
                        }`}
                      />

                      {/* Flèches de navigation si plusieurs images */}
                      {galleryImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={prevImg}
                            aria-label="Image précédente"
                            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-background/85 dark:bg-black/80 backdrop-blur-md border border-border/80 text-foreground flex items-center justify-center shadow-lg hover:scale-110 hover:bg-background transition-all cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                          </button>
                          <button
                            type="button"
                            onClick={nextImg}
                            aria-label="Image suivante"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-background/85 dark:bg-black/80 backdrop-blur-md border border-border/80 text-foreground flex items-center justify-center shadow-lg hover:scale-110 hover:bg-background transition-all cursor-pointer opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                          >
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                          </button>

                          {/* Indicateur de position (ex: 1 / 3) */}
                          <div className="absolute bottom-2.5 left-2.5 z-20 px-2.5 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-medium backdrop-blur-md border border-white/10 shadow-sm pointer-events-none">
                            {activeImageIndex + 1} / {galleryImages.length}
                          </div>
                        </>
                      )}

                      {outOfStock && (
                        <span className="absolute top-3 left-3 z-20 inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] uppercase tracking-widest bg-zinc-900/90 dark:bg-zinc-800/90 text-zinc-200 backdrop-blur-md px-2.5 sm:px-3 py-1 rounded-full font-bold border border-zinc-700/60 shadow-lg">
                          <span className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-red-500 animate-pulse" />
                          <span>Rupture de Stock</span>
                        </span>
                      )}

                      {/* Glass Spray Bottle Badge Preview */}
                      {!isFullBottle && !outOfStock && (
                        <div className="absolute top-2.5 right-2.5 z-20 bg-background/95 dark:bg-black/90 backdrop-blur-md border border-primary/50 rounded-2xl p-2 sm:p-2.5 shadow-xl animate-in zoom-in-95 fade-in duration-300 flex flex-col items-center gap-1 min-w-[60px] sm:min-w-[68px]">
                          <div className="flex items-center gap-1">
                            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-primary font-bold">
                              {quantities["10ml"] > 0
                                ? "10ml"
                                : quantities["5ml"] > 0
                                ? "5ml"
                                : "Decant"}
                            </span>
                            <Sparkles className="w-2.5 sm:w-3 h-2.5 sm:h-3 text-primary animate-pulse" />
                          </div>

                          <div className="flex flex-col items-center py-0.5">
                            <div
                              className="rounded-t-[3px] shadow-sm relative"
                              style={{
                                width: "12px",
                                height: quantities["10ml"] > 0 ? "16px" : "12px",
                                background:
                                  "linear-gradient(180deg, #111111 0%, #333333 40%, #0a0a0a 100%)",
                              }}
                            />
                            <div
                              className="border-x-2 border-b-2 border-primary/80 bg-gradient-to-b from-primary/10 via-primary/30 to-primary/15 rounded-b-[4px] relative shadow-inner"
                              style={{
                                width: "10px",
                                height: quantities["10ml"] > 0 ? "55px" : "36px",
                              }}
                            >
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-[90%] bg-foreground/50" />
                            </div>
                          </div>

                          <p className="text-[7px] sm:text-[7.5px] text-primary font-bold text-center">
                            {totalQuantity > 0
                              ? `${totalQuantity} flacon${totalQuantity > 1 ? "s" : ""}`
                              : "Flacons Verre"}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Rangée des miniatures (Vignettes cliquables) */}
                    {galleryImages.length > 1 && (
                      <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 scrollbar-none">
                        {galleryImages.map((img, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveImageIndex(idx)}
                            className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border transition-all shrink-0 cursor-pointer ${
                              idx === activeImageIndex
                                ? "border-primary ring-2 ring-primary/30 scale-[1.03] shadow-sm"
                                : "border-border/70 opacity-70 hover:opacity-100 hover:border-border"
                            }`}
                          >
                            <img
                              src={img}
                              alt={`${parfum.name} — vue ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Trust Badges */}
              <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground text-center">
                <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-card/40 border border-border/60">
                  <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{t.product.authenticity}</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-card/40 border border-border/60">
                  <Truck className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>{t.common.freeShipping}</span>
                </div>
              </div>

              {/* Product Olfactory & Seasonal Profile Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-card/40 border border-border/70 space-y-3 text-xs">
                {/* Saisons d'utilisation */}
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-primary flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Saisons
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {getParfumSeasons(parfum).map((season) => {
                      const meta = getSeasonMeta(season);
                      const IconComp = meta.icon;
                      return (
                        <span
                          key={season}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-background/80 border border-border text-[11px] font-medium text-foreground"
                        >
                          <IconComp className="w-3 h-3 text-primary" strokeWidth={1.75} />
                          <span>{meta.label}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Notes olfactives */}
                {translatedNotes && (
                  <div className="space-y-1.5 pt-1 border-t border-border/50">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-primary flex items-center gap-1.5">
                      <Sparkle className="w-3.5 h-3.5" /> {t.product.notes}
                    </span>
                    <p className="text-muted-foreground leading-relaxed text-[11px]">
                      {translatedNotes}
                    </p>
                  </div>
                )}

                {/* Description olfactive */}
                {translatedDescription && (
                  <div className="space-y-1 pt-1 border-t border-border/50">
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                      {t.product.description}
                    </span>
                    <p className="text-muted-foreground leading-relaxed text-[11px]">
                      {translatedDescription}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Product Information & Order Actions */}
            <div className="md:col-span-7 space-y-4">
              {/* Header Info Block */}
              <div className="space-y-1">
                <span className="text-[11px] sm:text-xs uppercase tracking-[0.25em] text-primary font-bold block">
                  {parfum.maison}
                </span>

                <h1 className="font-serif text-xl sm:text-2xl md:text-3xl text-foreground font-semibold leading-tight">
                  {parfum.name}
                </h1>

                <div className="flex items-center flex-wrap gap-1.5 pt-1">
                  {parfum.gender && (
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full border border-border/60 font-medium">
                      {parfum.gender}
                    </span>
                  )}

                  {parfum.is_new && (
                    <span className="text-[10px] uppercase tracking-wider text-primary-foreground bg-primary px-2.5 py-0.5 rounded-full font-medium shadow-xs animate-badge-glow">
                      Nouveau
                    </span>
                  )}

                  {parfum.full_bottle_volume_ml && (
                    <span className="text-[10px] tracking-wider text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full border border-border/60 font-medium">
                      {parfum.full_bottle_volume_ml} ml
                    </span>
                  )}

                  {/* Tags Saisons d'utilisation harmonisés */}
                  {getParfumSeasons(parfum).map((season) => {
                    const meta = getSeasonMeta(season);
                    const IconComp = meta.icon;
                    return (
                      <span
                        key={season}
                        className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground bg-secondary px-2.5 py-0.5 rounded-full border border-border/60 font-medium"
                      >
                        <IconComp className="w-3 h-3 text-primary" strokeWidth={1.75} />
                        <span>{meta.label}</span>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Multi-Format / Size Selection Cards with Independent Quantities */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between items-center flex-wrap gap-1">
                  <span className="text-[11px] sm:text-xs uppercase tracking-wider font-semibold text-foreground flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-primary shrink-0" /> {t.product.sizeSelect}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                  {availableSizes.map((s) => {
                    const formatLabel =
                      s === "full"
                        ? parfum.full_bottle_volume_ml
                          ? `${parfum.full_bottle_volume_ml} ml`
                          : "Flacon Complet"
                        : SIZE_META[s]?.label ?? s;

                    const formatSub =
                      s === "full"
                        ? parfum.category === "deodorants-stick"
                          ? "Stick Corporel"
                          : "Flacon Scellé Original"
                        : SIZE_META[s]?.sub ?? "Décantation";

                    const formatStock =
                      s === "full"
                        ? (parfum.full_bottle_stock ?? 0)
                        : s === "5ml"
                        ? (parfum.stock_5ml ?? 0)
                        : s === "10ml"
                        ? (parfum.stock_10ml ?? 0)
                        : 0;

                    const isFormatOutOfStock = outOfStock || (typeof formatStock === "number" && formatStock <= 0);

                    const qty = quantities[s] ?? 0;
                    const isSelected = qty > 0;
                    const unitPrice = priceFor(parfum, s);

                    return (
                      <div
                        key={s}
                        className={`p-3 sm:p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-2 sm:gap-3 ${
                          isFormatOutOfStock
                            ? "opacity-50 border-border/50 bg-muted/20 cursor-not-allowed"
                            : isSelected
                            ? "border-primary bg-primary/10 shadow-xs ring-1 ring-primary/30"
                            : "border-border/80 bg-card/40 hover:border-primary/40"
                        }`}
                      >
                        {/* Format Info */}
                        <div
                          className={`flex-1 min-w-0 select-none ${isFormatOutOfStock ? "cursor-not-allowed" : "cursor-pointer"}`}
                          onClick={() => {
                            if (!isFormatOutOfStock) setDirectSizeQty(s, 1);
                          }}
                        >
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-sm sm:text-base font-semibold ${isFormatOutOfStock ? "text-muted-foreground line-through" : "text-foreground"}`}>
                              {formatLabel}
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full border border-border/50 truncate">
                              {formatSub}
                            </span>
                            {isFormatOutOfStock && (
                              <span className="text-[9px] font-bold text-destructive uppercase tracking-wider bg-destructive/10 px-2 py-0.5 rounded-full border border-destructive/20 shrink-0">
                                Épuisé
                              </span>
                            )}
                          </div>
                          <div className={`text-xs sm:text-sm font-semibold tracking-tight mt-0.5 ${isFormatOutOfStock ? "text-muted-foreground" : "text-primary"}`}>
                            {isFormatOutOfStock ? "Indisponible" : `${formatMAD(unitPrice)} `}
                            {!isFormatOutOfStock && <span className="text-[10px] font-normal text-muted-foreground">/ unité</span>}
                          </div>
                        </div>

                        {/* Individual Quantity Stepper */}
                        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                          <div className={`flex items-center border rounded-full px-1 sm:px-1.5 py-0.5 shadow-xs ${
                            isFormatOutOfStock ? "border-border/40 bg-muted/40 opacity-40" : "border-border bg-background"
                          }`}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isFormatOutOfStock) updateSizeQty(s, -1);
                              }}
                              className="h-7 w-7 flex items-center justify-center rounded-full text-foreground hover:text-primary hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              disabled={qty === 0 || isFormatOutOfStock}
                              aria-label={`Diminuer ${formatLabel}`}
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-6 sm:w-8 text-center text-xs sm:text-sm font-semibold text-foreground select-none">
                              {qty}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isFormatOutOfStock) updateSizeQty(s, 1);
                              }}
                              className="h-7 w-7 flex items-center justify-center rounded-full text-foreground hover:text-primary hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                              disabled={isFormatOutOfStock || (typeof formatStock === "number" && qty >= formatStock)}
                              aria-label={`Augmenter ${formatLabel}`}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STATIC ORDER FORM (ALWAYS VISIBLE DIRECTLY UNDER FORMATS & QUANTITIES) */}
              <ExpressOrderForm
                parfumName={parfum.name}
                maison={parfum.maison}
                items={selectedItems}
                totalPrice={totalPrice}
                onAddToCart={handleAddToCart}
                outOfStock={outOfStock}
              />
            </div>
          </div>

          {/* Related Products Section */}
          <RelatedProducts currentParfumId={parfum.id} maison={parfum.maison} gender={parfum.gender} />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ParfumDetail;
