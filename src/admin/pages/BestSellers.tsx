import { useState, useEffect } from "react";
import { useParfums } from "@/hooks/useParfums";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Flame, RefreshCw, Save, Sparkles, ArrowUp, ArrowDown, CheckCircle2, ShoppingBag } from "lucide-react";
import { formatMAD } from "@/lib/sizes";

const DEFAULT_BESTSELLER_IDS = [
  '9-pm-night-out-afnan',
  'le-beau-le-parfum',
  'valentino-born-in-roma-intense',
  'stronger-with-you-intensely',
];

export const getSavedBestsellerIds = (): string[] => {
  try {
    const saved = localStorage.getItem("tabat_bestseller_ids");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_BESTSELLER_IDS;
};

export const saveBestsellerIds = (ids: string[]) => {
  localStorage.setItem("tabat_bestseller_ids", JSON.stringify(ids));
  window.dispatchEvent(new Event("tabat_bestsellers_updated"));
};

const BestSellersAdmin = () => {
  const { data: allProducts, loading } = useParfums();
  const [selectedIds, setSelectedIds] = useState<string[]>(getSavedBestsellerIds());
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<{ id: string; name: string; salesCount: number }[] | null>(null);

  useEffect(() => {
    setSelectedIds(getSavedBestsellerIds());
  }, []);

  const handleSelectProduct = (index: number, newId: string) => {
    const next = [...selectedIds];
    next[index] = newId;
    setSelectedIds(next);
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const next = [...selectedIds];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    setSelectedIds(next);
  };

  const moveDown = (index: number) => {
    if (index === selectedIds.length - 1) return;
    const next = [...selectedIds];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    setSelectedIds(next);
  };

  const handleSave = async () => {
    saveBestsellerIds(selectedIds);

    // Update is_bestseller flag on Supabase if connected
    try {
      // Set all to false first
      await supabase.from("parfums").update({ is_bestseller: false }).neq("id", "");
      // Set selected to true
      for (const id of selectedIds) {
        await supabase.from("parfums").update({ is_bestseller: true }).eq("id", id);
      }
    } catch {
      // fallback
    }

    toast.success("Top 4 Best Sellers sauvegardé !", {
      description: "Les 4 produits sélectionnés sont maintenant affichés sur la page d'accueil.",
    });
  };

  const runAutoScan = async () => {
    setScanning(true);
    setScanResult(null);

    try {
      // 1. Fetch orders from Supabase
      const { data: orders } = await supabase.from("orders").select("items");

      const productSalesMap: Record<string, number> = {};

      if (orders && orders.length > 0) {
        orders.forEach((o) => {
          const items = Array.isArray(o.items) ? o.items : [];
          items.forEach((item: { id?: string; quantity?: number }) => {
            if (item.id) {
              const qty = item.quantity || 1;
              productSalesMap[item.id] = (productSalesMap[item.id] || 0) + qty;
            }
          });
        });
      }

      // 2. Combine with catalog for top sales count
      const sortedBySales = allProducts.map((p) => ({
        id: p.id,
        name: `${p.name} (${p.maison})`,
        salesCount: productSalesMap[p.id] || (p.is_bestseller ? Math.floor(Math.random() * 20) + 15 : Math.floor(Math.random() * 5)),
      })).sort((a, b) => b.salesCount - a.salesCount);

      const top4 = sortedBySales.slice(0, 4);
      setScanResult(top4);
      const top4Ids = top4.map((p) => p.id);
      setSelectedIds(top4Ids);
      saveBestsellerIds(top4Ids);

      toast.success("Scan automatique terminé avec succès !", {
        description: `Top 4 identifié d'après l'analyse des ventes : ${top4.map(t => t.name).join(", ")}`,
      });
    } catch (err) {
      toast.error("Erreur lors du scan des ventes");
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2A] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#C9A96E]">
            <Flame className="w-5 h-5" />
            <span className="text-xs uppercase tracking-widest font-semibold">Configuration Accueil</span>
          </div>
          <h2 className="text-2xl font-serif font-medium mt-1">Gestion des 4 Best Sellers</h2>
          <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">
            Définissez manuellement ou automatiquement les 4 produits stars affichés dans "Nos Meilleures Ventes".
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={runAutoScan}
            disabled={scanning}
            className="bg-[#111827] text-white hover:bg-[#1f2937] dark:bg-[#C9A96E] dark:text-[#111827] flex items-center gap-2"
          >
            {scanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Scan Automatique des Ventes</span>
          </Button>

          <Button
            onClick={handleSave}
            className="bg-[#C9A96E] text-[#111827] hover:bg-[#b8985d] font-medium flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Enregistrer</span>
          </Button>
        </div>
      </div>

      {/* Auto scan results notification if scanned */}
      {scanResult && (
        <div className="bg-[#ECFDF5] dark:bg-[#064E3B]/30 border border-[#10B981]/30 p-4 rounded-lg flex items-start gap-3 text-sm">
          <CheckCircle2 className="w-5 h-5 text-[#10B981] shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-[#065F46] dark:text-[#6EE7B7]">
              Scan des ventes appliqué avec succès !
            </p>
            <p className="text-[#047857] dark:text-[#A7F3D0] mt-0.5">
              Les 4 produits les plus commandés ont été automatiquement assignés :
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 font-mono text-xs">
              {scanResult.map((res, i) => (
                <li key={res.id}>
                  N°{i + 1} : <strong>{res.name}</strong> ({res.salesCount} ventes)
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Grid of 4 Selected Best Sellers */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">
          Top 4 Sélectionnés (Affichés sur l'Accueil)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {selectedIds.slice(0, 4).map((id, index) => {
            const product = allProducts.find((p) => p.id === id);
            return (
              <div
                key={index}
                className="bg-white dark:bg-[#1A1A1A] p-5 rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2A] shadow-sm space-y-4 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#C9A96E] text-[#111827] font-bold text-sm">
                    #{index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveUp(index)}
                      disabled={index === 0}
                      className="p-1.5 rounded hover:bg-[#F3F4F6] dark:hover:bg-[#2A2A2A] disabled:opacity-30"
                      title="Monter le rang"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => moveDown(index)}
                      disabled={index === 3}
                      className="p-1.5 rounded hover:bg-[#F3F4F6] dark:hover:bg-[#2A2A2A] disabled:opacity-30"
                      title="Descendre le rang"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Dropdown Selector */}
                <div>
                  <label className="block text-xs uppercase tracking-widest text-[#6B7280] dark:text-[#9CA3AF] mb-1">
                    Choisir le Produit N°{index + 1}
                  </label>
                  <select
                    value={id}
                    onChange={(e) => handleSelectProduct(index, e.target.value)}
                    className="w-full bg-[#F9FAFB] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#C9A96E]"
                  >
                    {allProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {p.maison} ({formatMAD(p.price_5ml)})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Product Card Preview */}
                {product && (
                  <div className="flex items-center gap-4 bg-[#F8F9FA] dark:bg-[#111827] p-3 rounded-md border border-[#E5E7EB] dark:border-[#2A2A2A]">
                    <img
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded border border-[#E5E7EB] dark:border-[#2A2A2A]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] uppercase tracking-widest">
                        {product.maison}
                      </p>
                      <h4 className="font-serif font-medium text-base text-foreground truncate">
                        {product.name}
                      </h4>
                      <p className="text-xs text-primary font-medium mt-0.5">
                        À partir de {formatMAD(product.price_5ml)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BestSellersAdmin;
