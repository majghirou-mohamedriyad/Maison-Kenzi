import { cn } from "@/lib/utils";

interface PlaceholderProps {
  label: string;
  className?: string;
  aspect?: string; // tailwind aspect class e.g. "aspect-square", "aspect-[16/9]"
}

/**
 * Image placeholder block. NO real or AI-generated imagery.
 * Used everywhere a product / brand photo will later be inserted manually.
 */
const Placeholder = ({ label, className, aspect = "aspect-square" }: PlaceholderProps) => {
  return (
    <div
      className={cn(
        "w-full bg-muted border border-border flex items-center justify-center text-center",
        aspect,
        className
      )}
    >
      <div className="px-4 py-2">
        <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground/70 mb-1">
          Image
        </p>
        <p className="text-xs font-mono text-primary/80 break-all">{label}</p>
      </div>
    </div>
  );
};

export default Placeholder;
