import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Wrench, Eye, EyeOff } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { supabase } from "@/lib/supabase";

const inputCls =
  "w-full px-3 py-2 text-sm bg-[#FFFFFF] dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-md focus:outline-none focus:ring-2 focus:ring-[#C9A96E] text-[#111827] dark:text-[#F9FAFB]";
const labelCls = "block text-xs font-medium text-[#111827] dark:text-[#F9FAFB] mb-1";

const Card = ({
  title,
  children,
  onSave,
  saving = false,
}: {
  title: string;
  children: React.ReactNode;
  onSave: () => void;
  saving?: boolean;
}) => (
  <div className="bg-[#FFFFFF] dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-lg p-5 space-y-4">
    <h3 className="text-sm font-semibold text-[#111827] dark:text-[#F9FAFB]">{title}</h3>
    <div className="space-y-3">{children}</div>
    <div className="pt-2">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="px-4 py-2 text-sm rounded-md bg-[#111827] dark:bg-[#C9A96E] text-white dark:text-[#111827] hover:bg-[#1F2937] dark:hover:bg-[#C9A96E] dark:hover:text-[#111827] disabled:opacity-50"
      >
        {saving ? "Sauvegarde..." : "Sauvegarder"}
      </button>
    </div>
  </div>
);

const Parametres = () => {
  const { settings, update } = useAppSettings();

  // Store Info State
  const [storeName, setStoreName] = useState(settings.store_name || "Maison Kenzi");
  const [storePhone, setStorePhone] = useState(settings.whatsapp_phone || "212752850156");
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

  useEffect(() => {
    setStoreName(settings.store_name || "Maison Kenzi");
    setStorePhone(settings.whatsapp_phone || "212752850156");

    setMaintMode(settings.maintenance_mode);
    setMaintMessage(settings.maintenance_message);
    setIgUrl(settings.instagram_url);
    setWaPhone(settings.whatsapp_phone || "212752850156");
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
    const { error } = await update({
      store_name: storeName,
      whatsapp_phone: storePhone,
    });
    setSavingStore(false);
    if (error) toast.error("Erreur de sauvegarde: " + error.message);
    else toast.success("Informations de la boutique enregistrées dans Supabase");
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
    });
    setSavingMaint(false);
    if (error) toast.error("Erreur: " + error.message);
    else toast.success("Paramètres de maintenance enregistrés");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card title="Informations de la boutique" onSave={saveStoreInfo} saving={savingStore}>
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
