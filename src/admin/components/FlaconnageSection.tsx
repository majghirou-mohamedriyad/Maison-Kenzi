import { useEffect, useState } from "react";
import { AlertTriangle, Droplet, Save } from "lucide-react";
import { toast } from "sonner";
import { useFlaconnage, type FlaconStats } from "@/hooks/useFlaconnage";

const Row = ({ s, onSave }: { s: FlaconStats; onSave: (stock: number, threshold: number) => Promise<void> }) => {
  const [stock, setStock] = useState(String(s.stock));
  const [threshold, setThreshold] = useState(String(s.low_threshold));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setStock(String(s.stock));
    setThreshold(String(s.low_threshold));
  }, [s.stock, s.low_threshold]);

  const total = s.stock + s.used;
  const pctUsed = total > 0 ? Math.round((s.used / total) * 100) : 0;

  const submit = async () => {
    setSaving(true);
    await onSave(Math.max(0, Number(stock) || 0), Math.max(0, Number(threshold) || 0));
    setSaving(false);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center ${
              s.isLow ? "bg-rose-500/10 text-rose-500" : "bg-primary/10 text-primary"
            }`}
          >
            <Droplet className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-medium text-foreground">{s.label}</h3>
        </div>
        {s.isLow && (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3" />
            Stock bas
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Disponibles</p>
          <p className={`text-2xl font-serif mt-1 ${s.isLow ? "text-rose-500" : "text-foreground"}`}>
            {s.stock}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Utilisés</p>
          <p className="text-2xl font-serif text-accent mt-1">{s.used}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Seuil</p>
          <p className="text-2xl font-serif text-muted-foreground mt-1">{s.low_threshold}</p>
        </div>
      </div>

      <div className="h-2 rounded-full bg-secondary overflow-hidden mb-4">
        <div
          className={`h-full transition-all ${s.isLow ? "bg-rose-500" : "bg-primary"}`}
          style={{ width: `${pctUsed}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 mb-2">
        <label className="block">
          <span className="text-[11px] text-muted-foreground">Stock disponible</span>
          <input
            type="number"
            min={0}
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            className="mt-1 w-full bg-background border border-border rounded-md px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-[11px] text-muted-foreground">Seuil d'alerte</span>
          <input
            type="number"
            min={0}
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            className="mt-1 w-full bg-background border border-border rounded-md px-2 py-1.5 text-sm"
          />
        </label>
      </div>
      <button
        onClick={submit}
        disabled={saving}
        className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-md px-3 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? "Enregistrement…" : "Mettre à jour"}
      </button>
    </div>
  );
};

const FlaconnageSection = () => {
  const { stats, loading, error, update } = useFlaconnage();
  const lowCount = stats.filter((s) => s.isLow && (s.size as string) !== "20ml").length;

  const onSave = (size: FlaconStats["size"]) => async (stock: number, low_threshold: number) => {
    const res = await update(size, { stock, low_threshold });
    if (res.error) toast.error(res.error);
    else toast.success("Stock mis à jour");
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-medium text-foreground">Gestion du flaconnage</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Suivez vos flacons vides disponibles, utilisés et recevez une alerte quand le stock est bas.
          </p>
        </div>
        {lowCount > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/30">
            <AlertTriangle className="w-3.5 h-3.5" />
            {lowCount} format(s) en alerte
          </span>
        )}
      </div>
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
          {error}
        </div>
      )}
      {loading ? (
        <p className="text-sm text-muted-foreground py-6">Chargement…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats
            .filter((s) => (s.size as string) !== "20ml")
            .map((s) => (
              <Row key={s.size} s={s} onSave={onSave(s.size)} />
            ))}
        </div>
      )}
    </section>
  );
};

export default FlaconnageSection;
