import { cn } from "@/lib/utils";
import Placeholder from "./Placeholder";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  label: string;
  className?: string;
  aspect?: string;
  fitMode?: "cover" | "contain";
}

const ProductImage = ({
  src,
  alt,
  label,
  className,
  aspect = "aspect-square",
  fitMode = "contain",
}: ProductImageProps) => {
  if (!src) {
    return <Placeholder label={label} className={className} aspect={aspect} />;
  }

  return (
    <div
      className={cn(
        "group/img relative w-full overflow-hidden flex items-center justify-center transition-all",
        aspect,
        className
      )}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={cn(
          "w-full h-full transition-transform duration-500 ease-out group-hover/img:scale-105 animate-fade-in",
          fitMode === "cover" ? "object-cover" : "object-contain"
        )}
      />
    </div>
  );
};

export default ProductImage;
