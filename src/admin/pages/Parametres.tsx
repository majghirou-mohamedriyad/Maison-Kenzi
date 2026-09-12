/**
 * Page de Paramètres & Statut de la Maison — Maison Kenzi Admin
 *
 * Configuration des informations de la boutique, du contact WhatsApp / Instagram,
 * de la gestion du mode maintenance et des accès administrateur.
 */

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Wrench,
  Eye,
  EyeOff,
  ShieldCheck,
  Store,
  MessageSquare,
  Instagram,
  Lock,
  Save,
  Loader2,
  Send,
  Activity,
  CheckCircle2,
  AlertCircle,
  Phone,
  Radio,
} from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/lib/supabase";
import { sendOpenWaMessage, checkOpenWaSessionStatus } from "@/services/whatsappService";

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
  const [storePhone, setStorePhone] = useState(settings.whatsapp_phone || "212752850156");
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
  const [waPhone, setWaPhone] = useState(settings.whatsapp_phone || "212752850156");
  const [savingMaint, setSavingMaint] = useState(false);

  // OpenWA WhatsApp State
  const [openwaUrl, setOpenwaUrl] = useState(settings.openwa_url || "http://185.197.249.4:2785");
  const [openwaSession, setOpenwaSession] = useState(settings.openwa_session || "default");
  const [openwaApiKey, setOpenwaApiKey] = useState(settings.openwa_api_key || "");
  const [openwaAdminPhone, setOpenwaAdminPhone] = useState(settings.openwa_admin_phone || "212752850156");
  const [openwaAutoOrder, setOpenwaAutoOrder] = useState(settings.openwa_auto_order_confirmation !== false);
  const [openwaAutoStatus, setOpenwaAutoStatus] = useState(settings.openwa_auto_status_update !== false);
  const [openwaAdminAlert, setOpenwaAdminAlert] = useState(settings.openwa_admin_notification !== false);
  const [savingOpenwa, setSavingOpenwa] = useState(false);

  // OpenWA Live Test State
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{ checked: boolean; ok: boolean; message: string } | null>(null);
  const [testPhone, setTestPhone] = useState("212752850156");
  const [sendingTestMsg, setSendingTestMsg] = useState(false);

  useEffect(() => {
    setStoreName(settings.store_name || "Maison Kenzi");
    setStorePhone(settings.whatsapp_phone || "212752850156");
    setFreeShippingThreshold(settings.free_shipping_threshold ?? 500);

    setMaintMode(settings.maintenance_mode);
    setMaintMessage(settings.maintenance_message);
    setIgUrl(settings.instagram_url);
    setWaPhone(settings.whatsapp_phone || "212752850156");

    setOpenwaUrl(settings.openwa_url || "http://185.197.249.4:2785");
    setOpenwaSession(settings.openwa_session || "default");
    setOpenwaApiKey(settings.openwa_api_key || "");
    setOpenwaAdminPhone(settings.openwa_admin_phone || "212752850156");
    setOpenwaAutoOrder(settings.openwa_auto_order_confirmation !== false);
    setOpenwaAutoStatus(settings.openwa_auto_status_update !== false);
    setOpenwaAdminAlert(settings.openwa_admin_notification !== false);
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

  const saveOpenwaSettings = async () => {
    setSavingOpenwa(true);
    const { error } = await update({
      openwa_url: openwaUrl.trim(),
      openwa_session: openwaSession.trim(),
      openwa_api_key: openwaApiKey.trim(),
      openwa_admin_phone: openwaAdminPhone.trim(),
      openwa_auto_order_confirmation: openwaAutoOrder,
      openwa_auto_status_update: openwaAutoStatus,
      openwa_admin_notification: openwaAdminAlert,
    });
    setSavingOpenwa(false);
    if (error) {
      toast.error("Erreur d'enregistrement: " + error.message);
    } else {
      toast.success("Configuration OpenWA WhatsApp enregistrée avec succès");
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    try {
      const res = await checkOpenWaSessionStatus({
        openwa_url: openwaUrl,
        openwa_session: openwaSession,
        openwa_api_key: openwaApiKey,
      });
      if (res.ok) {
        if (res.sessions && res.sessions.length > 0 && (!openwaSession || openwaSession === "default")) {
          setOpenwaSession(res.sessions[0]);
        }
        setConnectionStatus({ checked: true, ok: true, message: `Connecté : ${res.status}` });
        toast.success("Serveur OpenWA joint avec succès !");
      } else {
        setConnectionStatus({ checked: true, ok: false, message: res.error || "Serveur non joignable" });
        toast.error("Échec de connexion au serveur OpenWA.");
      }
    } catch (err: any) {
      setConnectionStatus({ checked: true, ok: false, message: err.message || "Erreur" });
      toast.error("Erreur lors du test de connexion.");
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!testPhone.trim()) {
      toast.error("Veuillez saisir un numéro de téléphone pour le test");
      return;
    }
    setSendingTestMsg(true);
    try {
      const testMsg = `*MAISON KENZI — TEST DE MESSAGERIE WHATSAPP*\n\nCe message confirme que le serveur OpenWA VPS (${openwaUrl}) est correctement configure et operationnel pour Maison Kenzi.\n\nDate : ${new Date().toLocaleString("fr-FR")}\nSession : ${openwaSession}`;
      const res = await sendOpenWaMessage(testPhone, testMsg, {
        openwa_url: openwaUrl,
        openwa_session: openwaSession,
        openwa_api_key: openwaApiKey,
      });

      if (res.success) {
        toast.success(`Message de test envoyé avec succès au ${testPhone} !`);
      } else {
        toast.error(`Échec d'envoi: ${res.error}`);
      }
    } catch (err: any) {
      toast.error(`Erreur: ${err.message}`);
    } finally {
      setSendingTestMsg(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
          <label className={labelCls}>Seuil de Livraison Gratuite (MAD)</label>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="10"
              className={inputCls}
              placeholder="500"
              value={freeShippingThreshold}
              onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary pointer-events-none">
              MAD
            </span>
          </div>
          <p className="text-[11px] text-[#7A726A] dark:text-[#A39B91] mt-1">
            Définit le montant d'achat à partir duquel la livraison devient offerte dans le panier client.
          </p>
        </div>
      </Card>

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

      {/* Configuration Serveur WhatsApp OpenWA VPS */}
      <div className="lg:col-span-2 bg-[#FFFFFF]/90 dark:bg-[#141312]/90 backdrop-blur-md border border-[#EAE3D8] dark:border-[#24211E] rounded-2xl p-6 sm:p-7 shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)] space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAE3D8] dark:border-[#24211E] pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-medium text-[#1A1816] dark:text-[#FAF7F2]">
                Serveur WhatsApp OpenWA (VPS)
              </h3>
              <p className="text-xs text-[#7A726A] dark:text-[#A39B91] mt-0.5">
                Automatisation des confirmations de commande, alertes gérant et notifications de suivi via votre VPS.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl border border-primary/30 hover:border-primary text-primary hover:bg-primary/5 transition-all cursor-pointer disabled:opacity-50"
            >
              {testingConnection ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
              <span>{testingConnection ? "Vérification..." : "Tester la Connexion VPS"}</span>
            </button>
          </div>
        </div>

        {/* Diagnostic Statut Connexion */}
        {connectionStatus && (
          <div
            className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs animate-in fade-in duration-200 ${
              connectionStatus.ok
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
                : "bg-destructive/10 border-destructive/30 text-destructive dark:text-destructive"
            }`}
          >
            {connectionStatus.ok ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <div className="flex-1">
              <span className="font-semibold">{connectionStatus.ok ? "Statut OpenWA : " : "Échec : "}</span>
              <span>{connectionStatus.message}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className={labelCls}>URL du Serveur OpenWA (VPS)</label>
            <input
              type="text"
              className={inputCls}
              value={openwaUrl}
              onChange={(e) => setOpenwaUrl(e.target.value)}
              placeholder="http://185.197.249.4:2785"
            />
            <span className="text-[10px] text-muted-foreground mt-1 block">
              Adresse IP ou domaine et port où tourne le conteneur OpenWA.
            </span>
          </div>

          <div>
            <label className={labelCls}>Nom de Session</label>
            <input
              type="text"
              className={inputCls}
              value={openwaSession}
              onChange={(e) => setOpenwaSession(e.target.value)}
              placeholder="default"
            />
          </div>

          <div>
            <label className={labelCls}>Clé API / Token Secret (Optionnel)</label>
            <input
              type="password"
              className={inputCls}
              value={openwaApiKey}
              onChange={(e) => setOpenwaApiKey(e.target.value)}
              placeholder="Laisser vide si non configuré"
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>Numéro WhatsApp Admin pour Alertes Commandes</label>
            <input
              type="text"
              className={inputCls}
              value={openwaAdminPhone}
              onChange={(e) => setOpenwaAdminPhone(e.target.value)}
              placeholder="212752850156"
            />
            <span className="text-[10px] text-muted-foreground mt-1 block">
              Reçoit une notification WhatsApp détaillée dès qu'une commande est validée sur la boutique.
            </span>
          </div>
        </div>

        {/* Interrupteurs d'automatisation */}
        <div className="pt-2 border-t border-[#EAE3D8] dark:border-[#24211E] space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#4A453E] dark:text-[#D1C9BF]">
            Déclencheurs Automatiques de Messages
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* 1. Confirmation client */}
            <label className="flex items-center gap-3 p-3 rounded-xl border border-border/70 hover:border-primary/40 bg-card/60 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={openwaAutoOrder}
                onChange={(e) => setOpenwaAutoOrder(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary accent-[#C9A96E]"
              />
              <div className="text-xs">
                <span className="font-semibold block text-foreground">Confirmation Client</span>
                <span className="text-[10px] text-muted-foreground block font-light">Envoi automatique après commande</span>
              </div>
            </label>

            {/* 2. Notification de Statut */}
            <label className="flex items-center gap-3 p-3 rounded-xl border border-border/70 hover:border-primary/40 bg-card/60 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={openwaAutoStatus}
                onChange={(e) => setOpenwaAutoStatus(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary accent-[#C9A96E]"
              />
              <div className="text-xs">
                <span className="font-semibold block text-foreground">Suivi & Statut</span>
                <span className="text-[10px] text-muted-foreground block font-light">Notification si Expédiée / Livrée</span>
              </div>
            </label>

            {/* 3. Alerte Admin */}
            <label className="flex items-center gap-3 p-3 rounded-xl border border-border/70 hover:border-primary/40 bg-card/60 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={openwaAdminAlert}
                onChange={(e) => setOpenwaAdminAlert(e.target.checked)}
                className="w-4 h-4 rounded text-primary focus:ring-primary accent-[#C9A96E]"
              />
              <div className="text-xs">
                <span className="font-semibold block text-foreground">Alerte Gérant Admin</span>
                <span className="text-[10px] text-muted-foreground block font-light">Notification instantanée nouvelle commande</span>
              </div>
            </label>
          </div>
        </div>

        {/* Outil d'envoi de test en direct */}
        <div className="pt-3 border-t border-[#EAE3D8] dark:border-[#24211E] bg-muted/20 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Envoi d'un Message Test WhatsApp en Direct
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Phone className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="Numéro WhatsApp (ex: 212752850156 ou 0612345678)"
                className={`${inputCls} pl-10`}
              />
            </div>

            <button
              type="button"
              onClick={handleSendTestMessage}
              disabled={sendingTestMsg || !testPhone.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {sendingTestMsg ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{sendingTestMsg ? "Envoi en cours..." : "Envoyer le Test"}</span>
            </button>
          </div>
        </div>

        {/* Bouton de sauvegarde de la configuration OpenWA */}
        <div className="pt-3 border-t border-[#EAE3D8] dark:border-[#24211E] flex justify-end">
          <button
            type="button"
            onClick={saveOpenwaSettings}
            disabled={savingOpenwa}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.15em] rounded-xl bg-[#1A1816] hover:bg-[#2B2724] dark:bg-[#C9A96E] dark:hover:bg-[#B8985F] text-[#FAF7F2] dark:text-[#121110] transition-all shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {savingOpenwa ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{savingOpenwa ? "Sauvegarde en cours…" : "Enregistrer la Configuration WhatsApp"}</span>
          </button>
        </div>
      </div>

      <div className="lg:col-span-2 bg-[#FFFFFF] dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-lg p-5 space-y-4">
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
              placeholder="212752850156"
            />
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={saveMaintenance}
            disabled={savingMaint}
            className="px-4 py-2 text-sm rounded-md bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] hover:bg-[#1F2937] disabled:opacity-50"
          >
            {savingMaint ? "Enregistrement..." : "Sauvegarder"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Parametres;
