import { useState, useEffect } from "react";
import { useParfums } from "@/hooks/useParfums";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Sun,
  Leaf,
  Snowflake,
  Sparkles,
  Save,
  ArrowUp,
  ArrowDown,
  Calendar,
  Sparkle,
  CheckCircle2,
  Info,
  Zap,
} from "lucide-react";
import { formatMAD } from "@/lib/sizes";
import {
  getSavedSeasonalSettings,
  saveSeasonalSettings,
  getCurrentSeason,
  resolveActiveSeason,
  SEASONS,
  SeasonMode,
  SeasonKey,
  SeasonalSettings,
} from "@/lib/season";

const seasonIconMap = {
  Sun,
  Leaf,
  Snowflake,
  Sparkles,
};

const SeasonalAdmin = () => {
  const { data: allProducts, loading } = useParfums();

  const [settings, setSettings] = useState<SeasonalSettings>(getSavedSeasonalSettings());
  const [selectedIds, setSelectedIds] = useState<string[]>(settings.productIds);

  const detectedSeason = getCurrentSeason();
  const activeSeasonKey: SeasonKey = resolveActiveSeason(settings.mode);
  const activeSeasonInfo = SEASONS[activeSeasonKey];

  const SeasonIcon = seasonIconMap[activeSeasonInfo.icon as keyof typeof seasonIconMap] || Sun;

  useEffect(() => {
    const current = getSavedSeasonalSettings();
    setSettings(current);
    setSelectedIds(current.productIds);
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

  const handleSave = () => {
    const newSettings: SeasonalSettings = {
      ...settings,
      productIds: selectedIds,
    };
    saveSeasonalSettings(newSettings);
    toast.success("Paramètres de la section Saison enregistrés avec succès !");
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#1A1A1A] p-6 rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2A] shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-[#C9A96E] font-medium text-xs uppercase tracking-widest mb-1">
            <Calendar className="w-4 h-4" />
            Gestion des Parfums de Saison
          </div>
          <h2 className="text-xl font-bold text-[#111827] dark:text-[#F9FAFB]">
            Section Saisonnière (Vitrine Accueil)
          </h2>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">
            Configurez la détection automatique de la saison ou imposez une sélection spécifique.
          </p>
        </div>
        <Button
          onClick={handleSave}
          className="bg-[#C9A96E] hover:bg-[#b89558] text-[#111827] font-semibold gap-2 shadow-sm"
        >
          <Save className="w-4 h-4" />
          Enregistrer les modifications
        </Button>
      </div>

      {/* Season Selection & Auto Mode Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mode Selector Card */}
        <div className="bg-white dark:bg-[#1A1A1A] p-5 rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2A] shadow-sm space-y-4 md:col-span-2">
          <h3 className="font-semibold text-sm text-[#111827] dark:text-[#F9FAFB] flex items-center gap-2">
            <Sparkle className="w-4 h-4 text-[#C9A96E]" />
            Mode de Saison
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Auto option */}
            <button
              type="button"
              onClick={() => setSettings({ ...settings, mode: "auto" })}
              className={`p-3.5 rounded-md border text-left flex items-start justify-between transition-all ${
                settings.mode === "auto"
                  ? "border-[#C9A96E] bg-[#C9A96E]/10 ring-1 ring-[#C9A96E]"
                  : "border-[#E5E7EB] dark:border-[#2A2A2A] hover:bg-[#F9FAFB] dark:hover:bg-[#111827]"
              }`}
            >
              <div>
                <span className="font-medium text-xs text-[#111827] dark:text-[#F9FAFB] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#C9A96E]" />
                  <span>Automatique (Météo / Mois)</span>
                </span>
                <span className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] block mt-0.5">
                  Saison actuelle détectée: <strong className="text-[#C9A96E] capitalize">{SEASONS[detectedSeason].label}</strong>
                </span>
              </div>
              {settings.mode === "auto" && <CheckCircle2 className="w-4 h-4 text-[#C9A96E] shrink-0" />}
            </button>

            {/* Manual options */}
            {(["summer", "autumn", "winter", "spring"] as SeasonKey[]).map((sk) => {
              const info = SEASONS[sk];
              const IconComp = seasonIconMap[info.icon as keyof typeof seasonIconMap];
              const isSelected = settings.mode === sk;
              return (
                <button
                  key={sk}
                  type="button"
                  onClick={() => setSettings({ ...settings, mode: sk })}
                  className={`p-3.5 rounded-md border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? "border-[#C9A96E] bg-[#C9A96E]/10 ring-1 ring-[#C9A96E]"
                      : "border-[#E5E7EB] dark:border-[#2A2A2A] hover:bg-[#F9FAFB] dark:hover:bg-[#111827]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className="w-4 h-4 text-[#C9A96E]" />
                    <span className="font-medium text-xs text-[#111827] dark:text-[#F9FAFB]">
                      {info.label} ({info.badge})
                    </span>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-[#C9A96E] shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Titles customization */}
          <div className="pt-3 border-t border-[#E5E7EB] dark:border-[#2A2A2A] space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-1">
                Titre Personnalisé (Optionnel)
              </label>
              <input
                type="text"
                value={settings.customTitle}
                onChange={(e) => setSettings({ ...settings, customTitle: e.target.value })}
                placeholder={`Défaut: ${activeSeasonInfo.defaultTitle}`}
                className="w-full bg-[#F9FAFB] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#C9A96E]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6B7280] dark:text-[#9CA3AF] mb-1">
                Sous-titre Personnalisé (Optionnel)
              </label>
              <input
                type="text"
                value={settings.customSubtitle}
                onChange={(e) => setSettings({ ...settings, customSubtitle: e.target.value })}
                placeholder={`Défaut: ${activeSeasonInfo.defaultSubtitle}`}
                className="w-full bg-[#F9FAFB] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#C9A96E]"
              />
            </div>
          </div>
        </div>

        {/* Active Status Overview Card */}
        <div className="bg-white dark:bg-[#1A1A1A] p-5 rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2A] shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm text-[#111827] dark:text-[#F9FAFB] mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-[#C9A96E]" />
              Aperçu en Direct
            </h3>

            <div className="p-4 rounded-md bg-[#F8F9FA] dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#2A2A2A] space-y-3">
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#C9A96E]/20 text-[#C9A96E] text-[10px] font-medium uppercase tracking-widest">
                <SeasonIcon className="w-3 h-3" />
                {activeSeasonInfo.badge}
              </div>

              <h4 className="font-serif text-lg font-medium text-[#111827] dark:text-[#F9FAFB]">
                {settings.customTitle.trim() || activeSeasonInfo.defaultTitle}
              </h4>

              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] leading-relaxed">
                {settings.customSubtitle.trim() || activeSeasonInfo.defaultSubtitle}
              </p>
            </div>
          </div>

          <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] bg-[#F3F4F6] dark:bg-[#111827] p-3 rounded flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-[#C9A96E] shrink-0 mt-0.5" />
            <span>
              En mode <strong>Automatique</strong>, le site affichera <strong>Été</strong> en Juin-Août, <strong>Automne</strong> en Sept-Nov, <strong>Hiver</strong> en Déc-Fév, <strong>Printemps</strong> en Mars-Mai.
            </span>
          </div>
        </div>
      </div>

      {/* Selected Products Selection */}
      <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2A] shadow-sm space-y-6">
        <div>
          <h3 className="font-semibold text-base text-[#111827] dark:text-[#F9FAFB]">
            Parfums Sélectionnés pour la Saison ({selectedIds.length})
          </h3>
          <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF]">
            Sélectionnez les 4 produits affichés dans la vitrine saisonnière et ajustez l'ordre.
          </p>
        </div>

        {loading ? (
          <div className="py-8 text-center text-sm text-[#6B7280]">Chargement du catalogue...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {selectedIds.map((id, index) => {
              const product = allProducts.find((p) => p.id === id);
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-[#111827] p-4 rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2A] shadow-sm space-y-3 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#C9A96E] text-[#111827] font-bold text-xs">
                      #{index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-[#F3F4F6] dark:hover:bg-[#2A2A2A] disabled:opacity-30"
                        title="Monter"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === selectedIds.length - 1}
                        className="p-1 rounded hover:bg-[#F3F4F6] dark:hover:bg-[#2A2A2A] disabled:opacity-30"
                        title="Descendre"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF] mb-1">
                      Produit N°{index + 1}
                    </label>
                    <select
                      value={id}
                      onChange={(e) => handleSelectProduct(index, e.target.value)}
                      className="w-full bg-[#F9FAFB] dark:bg-[#0F0F0F] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-md px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#C9A96E]"
                    >
                      {allProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {p.maison} ({formatMAD(p.price_5ml)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {product && (
                    <div className="flex items-center gap-3 bg-[#F8F9FA] dark:bg-[#0F0F0F] p-2.5 rounded border border-[#E5E7EB] dark:border-[#2A2A2A]">
                      <img
                        src={product.image_url || "/placeholder.svg"}
                        alt={product.name}
                        className="w-12 h-12 object-cover rounded border border-[#E5E7EB] dark:border-[#2A2A2A]"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-[#6B7280] uppercase truncate">
                          {product.maison}
                        </p>
                        <h4 className="font-serif font-medium text-xs truncate">
                          {product.name}
                        </h4>
                        <p className="text-[10px] text-[#C9A96E] font-medium">
                          {formatMAD(product.price_5ml)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonalAdmin;
