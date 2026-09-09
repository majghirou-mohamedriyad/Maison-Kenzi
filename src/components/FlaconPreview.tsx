import type { Size } from "@/types/database";

/**
 * Aperçu visuel du flacon spray decant original.
 * Dimensions réelles :
 *  - 5 ml  : 75 mm × 14 mm
 *  - 10 ml : 120 mm × 14 mm
 */

const SPECS = {
  "5ml":  { realH: 75,  realW: 14, label: "5 ml" },
  "10ml": { realH: 120, realW: 14, label: "10 ml" },
} as const;

type FlaconSize = keyof typeof SPECS;

interface Props {
  size: Size;
}

// Échelle originale : 1 mm = 1.6 px
const SCALE = 1.6;

function Flacon({ k, active }: { k: FlaconSize; active: boolean }) {
  const s = SPECS[k];
  const h = s.realH * SCALE;
  const w = s.realW * SCALE;
  const capH = h * 0.28;
  const bodyH = h - capH;

  return (
    <div
      className="flex flex-col items-center transition-all duration-500 ease-out"
      style={{
        opacity: active ? 1 : 0.4,
        transform: `scale(${active ? 1 : 0.94})`,
      }}
    >
      {/* Capuchon spray noir */}
      <div
        className="relative rounded-t-[3px]"
        style={{
          width: `${w * 1.05}px`,
          height: `${capH}px`,
          background:
            "linear-gradient(180deg, #1a1a1a 0%, #2b2b2b 35%, #0d0d0d 100%)",
          boxShadow: active
            ? "0 2px 8px hsl(var(--primary) / 0.35)"
            : "0 1px 3px rgba(0,0,0,0.3)",
        }}
      >
        {/* nervures du capuchon */}
        <div className="absolute inset-x-1 top-1 bottom-1 flex flex-col justify-between opacity-40">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-px bg-white/20" />
          ))}
        </div>
      </div>

      {/* Corps en verre transparent */}
      <div
        className={`relative overflow-hidden border-x border-b transition-colors duration-500 ${
          active ? "border-primary/40" : "border-foreground/15"
        }`}
        style={{
          width: `${w}px`,
          height: `${bodyH}px`,
          borderBottomLeftRadius: "4px",
          borderBottomRightRadius: "4px",
          background: active
            ? "linear-gradient(135deg, hsl(var(--primary) / 0.10) 0%, hsl(var(--primary) / 0.22) 45%, hsl(var(--primary) / 0.08) 100%)"
            : "linear-gradient(135deg, hsl(var(--foreground) / 0.04) 0%, hsl(var(--foreground) / 0.10) 45%, hsl(var(--foreground) / 0.04) 100%)",
          boxShadow: active
            ? "inset 0 0 12px hsl(var(--primary) / 0.15)"
            : "inset 0 0 8px rgba(255,255,255,0.05)",
        }}
      >
        {/* tube interne (pompe) */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 bg-foreground/20"
          style={{ width: "1px", height: "92%" }}
        />
        {/* reflet brillant */}
        <div
          className="absolute top-1 left-1 bg-background/60 blur-[1px] rounded-full"
          style={{ width: "2px", height: "70%" }}
        />
        {/* reflet droit */}
        <div
          className="absolute top-2 right-1 bg-background/30 blur-[1px] rounded-full"
          style={{ width: "1px", height: "55%" }}
        />
        {/* base */}
        <div className="absolute bottom-0 inset-x-0 h-[3px] bg-foreground/15" />
      </div>

      {/* Label sous le flacon */}
      <p
        className={`mt-3 text-[10px] uppercase tracking-widest transition-colors duration-500 ${
          active ? "text-primary font-medium" : "text-muted-foreground"
        }`}
      >
        {s.label}
      </p>
      <p className="text-[9px] text-muted-foreground/70">
        {s.realH} × {s.realW} mm
      </p>
    </div>
  );
}

export default function FlaconPreview({ size }: Props) {
  if (size !== "5ml" && size !== "10ml") return null;
  const current = size as FlaconSize;
  const maxH = SPECS["10ml"].realH * SCALE + 40;

  return (
    <div className="relative w-full border border-border rounded-2xl bg-card/60 py-4 px-4 overflow-hidden animate-fade-in mt-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground text-center mb-3 font-semibold">
        Aperçu du flacon spray
      </p>

      <div
        className="relative flex items-end justify-center gap-12"
        style={{ height: `${maxH}px` }}
      >
        {(Object.keys(SPECS) as FlaconSize[]).map((k) => (
          <Flacon key={k} k={k} active={k === current} />
        ))}
      </div>
    </div>
  );
}
