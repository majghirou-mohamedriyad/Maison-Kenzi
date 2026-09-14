/**
 * Composant d'Image Produit avec Transition au Survol — Maison Kenzi
 *
 * Affiche l'image principale du parfum et bascule avec un fondu doux
 * vers la deuxième photo du produit lorsque le curseur survole la carte.
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import Placeholder from "./Placeholder";

interface ProductImageProps {
  src?: string | null;
  secondarySrc?: string | null;
  images?: string[];
  alt: string;
  label: string;
  className?: string;
  aspect?: string;
  fitMode?: "cover" | "contain";
}

const ProductImage = ({
  src,
  secondarySrc,
  images,
  alt,
  label,
  className,
  aspect = "aspect-[4/5]",
  fitMode = "cover",
}: ProductImageProps) => {
  const [primaryError, setPrimaryError] = useState(false);
  const [secondaryError, setSecondaryError] = useState(false);

  useEffect(() => {
    setPrimaryError(false);
    setSecondaryError(false);
  }, [src, secondarySrc, images]);

  const rawPrimary = src || (Array.isArray(images) && images.length > 0 ? images[0] : null);
  const rawSecondary = secondarySrc || (Array.isArray(images) && images.length > 1 ? images[1] : null);

  const primary = primaryError ? null : rawPrimary;
  const secondary = secondaryError ? null : rawSecondary;

  if (!primary) {
    return <Placeholder label={label} className={className} aspect={aspect} />;
  }

  const objectFitClass = fitMode === "cover" ? "object-cover" : "object-contain";

  return (
    <div
      className={cn(
        "group/img relative w-full overflow-hidden flex items-center justify-center transition-all bg-card/10 p-2 sm:p-2.5",
        aspect,
        className
      )}
    >
      {/* Image Principale (Photo 1) */}
      <img
        src={primary}
        alt={alt}
        loading="lazy"
        onError={() => setPrimaryError(true)}
        className={cn(
          "w-full h-full transition-all duration-700 ease-out scale-[0.92] group-hover:scale-[0.98] group-hover/img:scale-[0.98] animate-fade-in",
          objectFitClass,
          secondary ? "transition-opacity duration-700 group-hover:opacity-0" : ""
        )}
      />

      {/* Image Secondaire (Photo 2 — Révélée au survol du curseur) */}
      {secondary && (
        <img
          src={secondary}
          alt={`${alt} — vue alternative`}
          loading="lazy"
          onError={() => setSecondaryError(true)}
          className={cn(
            "absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 group-hover/img:opacity-100 transition-all duration-700 ease-out scale-[0.88] group-hover:scale-[0.98] group-hover/img:scale-[0.98] pointer-events-none p-2 sm:p-2.5",
            objectFitClass
          )}
        />
      )}
    </div>
  );
};

export default ProductImage;

