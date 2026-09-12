/**
 * Page de Paramètres & Statut de la Maison — Maison Kenzi Admin
 *
 * Configuration des informations de la boutique, du seuil de livraison offerte,
 * du contact WhatsApp / Instagram, de la gestion du mode maintenance et des accès administrateur.
 * Conforme Haute Parfumerie & Zéro Emoji (lucide-react uniquement).
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Wrench,
  Eye,
  EyeOff,
  Save,
  Loader2,
  Languages,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/lib/supabase";
import { checkDeeplUsage, DeepLUsageResult } from "@/services/deeplService";

const inputCls =
  "w-full px-3.5 py-2.5 text-xs sm:text-sm bg-[#FAF7F2]/80 dark:bg-[#1C1A17]/80 border border-[#E5DDD0] dark:border-[#2D2A26] rounded-xl focus:outline-none focus:border-[#C9A96E] text-[#1A1816] dark:text-[#F3EFEA] placeholder-[#A8A196] dark:placeholder-[#5E5851] transition-colors";
const labelCls = "block text-[11px] font-medium tracking-[0.15em] uppercase text-[#4A453E] dark:text-[#D1C9BF] mb-1.5";

const Card = ({
  title,
  subtitle,
  children,
  onSave,
  saving = false,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onSave: () => void;
  saving?: boolean;
}) => (
  <div className="bg-[#FFFFFF]/90 dark:bg-[#141312]/90 backdrop-blur-md border border-[#EAE3D8] dark:border-[#24211E] rounded-2xl p-6 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] space-y-5">
    <div>
      <h3 className="font-serif text-lg font-medium text-[#1A1816] dark:text-[#FAF7F2]">{title}</h3>
      {subtitle && <p className="text-xs text-[#7A726A] dark:text-[#A39B91] mt-0.5">{subtitle}</p>}
    </div>
    <div className="space-y-4">{children}</div>
    <div className="pt-3 border-t border-[#EAE3D8] dark:border-[#24211E] flex justify-end">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] rounded-xl bg-[#1A1816] hover:bg-[#2B2724] dark:bg-[#C9A96E] dark:hover:bg-[#B8985F] text-[#FAF7F2] dark:text-[#121110] transition-all shadow-sm disabled:opacity-50 cursor-pointer"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
        <span>{saving ? "Sauvegarde en cours…" : "Enregistrer"}</span>
      </button>
    </div>
  </div>
);

const Parametres = () => {
  const { settings, update } = useAppSettings();

  // Store Info State
  const [storeName, setStoreName] = useState(settings.store_name || "Maison Kenzi");
  const [storePhone, setStorePhone] = useState(settings.whatsapp_phone || "212652535301");
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    settings.free_shipping_threshold ?? 500
  );
  const [savingStore, setSavingStore] = useState(false);

  // Admin Account State
  const [adminEmail, setAdminEmail] = useState("admin@maisonkenzi.ma");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminConfirmPassword, setAdminConfirmPassword] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showAdminConfirmPassword, setShowAdminConfirmPassword] = useState(false);
  const [savingAdmin, setSavingAdmin] = useState(false);

  // Maintenance State
  const [maintMode, setMaintMode] = useState(settings.maintenance_mode);
  const [maintMessage, setMaintMessage] = useState(settings.maintenance_message);
  const [igUrl, setIgUrl] = useState(settings.instagram_url);
  const [waPhone, setWaPhone] = useState(settings.whatsapp_phone || "212652535301");
  const [savingMaint, setSavingMaint] = useState(false);

  // DeepL API State
  const [deeplKey, setDeeplKey] = useState(settings.deepl_api_key || "");
  const [showDeeplKey, setShowDeeplKey] = useState(false);
  const [savingDeepl, setSavingDeepl] = useState(false);
  const [testingDeepl, setTestingDeepl] = useState(false);
  const [deeplQuota, setDeeplQuota] = useState<DeepLUsageResult | null>(null);

  useEffect(() => {
    setStoreName(settings.store_name || "Maison Kenzi");
    setStorePhone(settings.whatsapp_phone || "212652535301");
    setFreeShippingThreshold(settings.free_shipping_threshold ?? 500);

    setMaintMode(settings.maintenance_mode);
    setMaintMessage(settings.maintenance_message);
    setIgUrl(settings.instagram_url);
    setWaPhone(settings.whatsapp_phone || "212652535301");

    setDeeplKey(settings.deepl_api_key || "");
  }, [settings]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) {
        setAdminEmail(data.user.email);
      }
    });
  }, []);

  const saveStoreInfo = async () => {
    setSavingStore(true);
    const parsedThreshold = Number(freeShippingThreshold) > 0 ? Number(freeShippingThreshold) : 500;
    const { error } = await update({
      store_name: storeName,
      whatsapp_phone: storePhone,
      free_shipping_threshold: parsedThreshold,
    });
    setSavingStore(false);
    if (error) toast.error("Erreur de sauvegarde: " + error.message);
    else toast.success("Paramètres et seuil de livraison gratuite enregistrés");
  };

  const saveAdminAccount = async () => {
    if (adminPassword && adminPassword !== adminConfirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setSavingAdmin(true);
    try {
      if (adminPassword) {
        const { error } = await supabase.auth.updateUser({ password: adminPassword });
        if (error) throw error;
        toast.success("Mot de passe administrateur mis à jour dans Supabase Auth");
        setAdminPassword("");
        setAdminConfirmPassword("");
      } else {
        toast.info("Compte administrateur vérifié (Entrez un nouveau mot de passe pour le modifier)");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Échec de la mise à jour";
      toast.error("Erreur mise à jour compte: " + msg);
    } finally {
      setSavingAdmin(false);
    }
  };

  const toggleMaintenanceMode = async () => {
    const nextMode = !maintMode;
    setMaintMode(nextMode);
    const { error } = await update({
      maintenance_mode: nextMode,
      maintenance_message: maintMessage,
      instagram_url: igUrl,
      whatsapp_phone: waPhone,
      free_shipping_threshold: Number(freeShippingThreshold) || 500,
    });
    if (error) {
      toast.error("Erreur: " + error.message);
    } else {
      toast.success(nextMode ? "Mode maintenance activé (Site client bloqué)" : "Mode maintenance désactivé (Boutique accessible)");
    }
  };

  const saveMaintenance = async () => {
    setSavingMaint(true);
    const { error } = await update({
      maintenance_mode: maintMode,
      maintenance_message: maintMessage,
      instagram_url: igUrl,
      whatsapp_phone: waPhone,
      free_shipping_threshold: Number(freeShippingThreshold) || 500,
    });
    setSavingMaint(false);
    if (error) toast.error("Erreur: " + error.message);
    else toast.success("Paramètres de maintenance enregistrés");
  };

  const testDeeplConnection = async () => {
    if (!deeplKey.trim()) {
      toast.error("Veuillez saisir votre clé API DeepL.");
      return;
    }
    setTestingDeepl(true);
    setDeeplQuota(null);
    try {
      const res = await checkDeeplUsage(deeplKey.trim());
      setDeeplQuota(res);
      if (res.ok) {
        toast.success(`Connexion DeepL réussie ! (${res.isFreeKey ? "Clé Gratuite :fx" : "Clé Pro"})`);
      } else {
        toast.error(res.error || "Échec de validation de la clé DeepL.");
      }
    } catch (e: any) {
      toast.error("Erreur de test DeepL: " + (e.message || String(e)));
    } finally {
      setTestingDeepl(false);
    }
  };

  const saveDeeplConfig = async () => {
    setSavingDeepl(true);
    const { error } = await update({
      deepl_api_key: deeplKey.trim(),
    });
    setSavingDeepl(false);
    if (error) {
      toast.error("Erreur d'enregistrement DeepL: " + error.message);
    } else {
      toast.success("Clé API DeepL enregistrée avec succès !");
      testDeeplConnection();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Informations Générales & Livraison */}
      <Card title="Informations & Tarifs de Livraison" subtitle="Configuration générale et seuil de gratuité" onSave={saveStoreInfo} saving={savingStore}>
        <div>
          <label className={labelCls}>Nom de la boutique</label>
          <input
            className={inputCls}
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Téléphone (WhatsApp)</label>
          <input
            className={inputCls}
            value={storePhone}
            onChange={(e) => setStorePhone(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Seuil de Livraison Gratuite (€)</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="1"
              className={inputCls}
              placeholder="50"
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary pointer-events-none">
              €
            </span>
          </div>
          <p className="text-[11px] text-[#7A726A] dark:text-[#A39B91] mt-1">
            Définit le montant d'achat à partir duquel la livraison devient offerte dans le panier client.
          </p>
        </div>
      </Card>

      {/* 2. DeepL API — Traduction Automatique des Parfums */}
      <Card
        title="Traduction Intelligente DeepL (FR ↔ EN)"
        subtitle="Automatisation des fiches parfums et descriptions olfactives"
        onSave={saveDeeplConfig}
        saving={savingDeepl}
      >
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className={labelCls}>Clé d'authentification DeepL API</label>
            <a
              href="https://www.deepl.com/fr/pro-api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary hover:underline inline-flex items-center gap-1 font-semibold"
            >
              <span>Obtenir ma clé gratuite</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <div className="relative">
            <input
              type={showDeeplKey ? "text" : "password"}
              className={`${inputCls} pr-20 font-mono text-xs`}
              placeholder="Ex: 8a9b2c...:fx"
              value={deeplKey}
              onChange={(e) => {
                setDeeplKey(e.target.value);
                setDeeplQuota(null);
              }}
            />
            <button
              type="button"
              onClick={() => setShowDeeplKey(!showDeeplKey)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors cursor-pointer"
              title={showDeeplKey ? "Masquer la clé" : "Afficher la clé"}
            >
              {showDeeplKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[10.5px] text-[#7A726A] dark:text-[#A39B91] mt-1.5 leading-relaxed">
            Compatible avec le plan <strong>DeepL API Free</strong> (se terminant par <code>:fx</code>, 500k car./mois offerts) et <strong>DeepL Pro</strong>.
          </p>
        </div>

        {/* Bouton de test et statut du quota */}
        <div className="pt-2 border-t border-[#EAE3D8] dark:border-[#24211E] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={testDeeplConnection}
            disabled={testingDeepl || !deeplKey.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            {testingDeepl ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>{testingDeepl ? "Vérification..." : "Tester la connexion DeepL"}</span>
          </button>

          {deeplQuota && (
            <div className="text-xs">
              {deeplQuota.ok ? (
                <div className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Connecté · Quota : {deeplQuota.character_count?.toLocaleString()} / {deeplQuota.character_limit?.toLocaleString()} car.
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 text-red-600 dark:text-red-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate max-w-xs">{deeplQuota.error}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* 2. Compte Administrateur */}
      <Card title="Compte administrateur" onSave={saveAdminAccount} saving={savingAdmin}>
        <div>
          <label className={labelCls}>Email administrateur</label>
          <input
            type="email"
            className={inputCls}
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
          />
        </div>
        <div>
          <label className={labelCls}>Nouveau mot de passe</label>
          <div className="relative">
            <input
              type={showAdminPassword ? "text" : "password"}
              className={`${inputCls} pr-10`}
              placeholder="••••••••"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowAdminPassword(!showAdminPassword)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors cursor-pointer"
              title={showAdminPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className={labelCls}>Confirmer le mot de passe</label>
          <div className="relative">
            <input
              type={showAdminConfirmPassword ? "text" : "password"}
              className={`${inputCls} pr-10`}
              placeholder="••••••••"
              value={adminConfirmPassword}
              onChange={(e) => setAdminConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowAdminConfirmPassword(!showAdminConfirmPassword)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#111827] dark:hover:text-[#F9FAFB] transition-colors cursor-pointer"
              title={showAdminConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
            >
              {showAdminConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </Card>

      {/* 3. Mode Maintenance */}
      <div className="lg:col-span-2 bg-[#FFFFFF] dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-2xl p-6 sm:p-7 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${maintMode ? "bg-[#C9A96E]/15 text-[#C9A96E]" : "bg-[#F8F9FA] dark:bg-white/5 text-[#6B7280] dark:text-[#9CA3AF]"}`}>
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">Mode maintenance</h3>
              <p className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
                Quand activé, le site client affiche une page de maintenance avec les liens Instagram et WhatsApp. Le panneau admin reste accessible.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={maintMode}
            onClick={toggleMaintenanceMode}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${maintMode ? "bg-[#C9A96E]" : "bg-[#E5E7EB] dark:bg-[#2A2A2A]"}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${maintMode ? "translate-x-5" : "translate-x-0.5"} translate-y-0.5`} />
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label className={labelCls}>Message affiché aux clients</label>
            <textarea
              className={inputCls + " min-h-[72px] resize-y"}
              value={maintMessage}
              onChange={(e) => setMaintMessage(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Lien Instagram</label>
            <input
              className={inputCls}
              value={igUrl}
              onChange={(e) => setIgUrl(e.target.value)}
              placeholder="https://instagram.com/votrecompte"
            />
          </div>
          <div>
            <label className={labelCls}>Numéro WhatsApp (avec indicatif, sans +)</label>
            <input
              className={inputCls}
              value={waPhone}
              onChange={(e) => setWaPhone(e.target.value)}
              placeholder="212652535301"
            />
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={saveMaintenance}
            disabled={savingMaint}
            className="px-4 py-2 text-sm rounded-md bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] hover:bg-[#1F2937] disabled:opacity-50 cursor-pointer"
          >
            {savingMaint ? "Enregistrement..." : "Sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Parametres;

