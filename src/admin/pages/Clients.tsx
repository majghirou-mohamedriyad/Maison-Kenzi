/**
 * Page d'Administration du Répertoire des Clients — Maison Kenzi
 *
 * Affiche la liste exhaustive des clients du site avec leurs informations personnelles détaillées :
 * - Nom & Prénom
 * - Adresse Email (avec copie 1-clic et contact direct)
 * - Numéro de Téléphone (avec format international et lien direct)
 * - Date de Naissance (avec calcul d'âge et formatage français)
 * - Adresse, Ville & Pays
 * - Historique des commandes et total cumulé des achats
 * 
 * Comprend la recherche instantanée, les filtres, le tri, l'exportation CSV,
 * la création et l'édition de fiches clients.
 * Conforme aux directives d'ingénierie : zéro emoji, icônes vectorielles lucide-react, commentaires en français.
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users,
  Search,
  Mail,
  Phone,
  Calendar,
  MapPin,
  ShoppingBag,
  Download,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  UserCheck,
  ArrowUpDown,
  ExternalLink,
  Cake,
  Eye,
  X,
  Loader2,
} from "lucide-react";
import {
  fetchAdminCustomers,
  saveCustomer,
  deleteCustomer,
  type AdminCustomerItem,
} from "@/services/customerService";
import { formatMAD } from "@/lib/sizes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

// Calcul de l'âge à partir de la date de naissance YYYY-MM-DD
function calculateAge(birthDateStr?: string): number | null {
  if (!birthDateStr) return null;
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

// Formatage de la date en français (ex: 15 mai 1994)
function formatFrenchDate(dateStr?: string): string {
  if (!dateStr) return "Non renseignée";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      // Si format YYYY-MM-DD direct
      const parts = dateStr.split("-");
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
    }
    return d.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

// Génération des initiales du client pour l'avatar
function getInitials(firstName?: string, lastName?: string): string {
  const f = (firstName || "").trim().charAt(0).toUpperCase();
  const l = (lastName || "").trim().charAt(0).toUpperCase();
  if (f && l) return `${f}${l}`;
  if (f) return f;
  if (l) return l;
  return "MK";
}

const Clients: React.FC = () => {
  const [customers, setCustomers] = useState<AdminCustomerItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterType, setFilterType] = useState<"all" | "with_orders" | "with_birthdate">("all");
  const [sortBy, setSortBy] = useState<"recent" | "name_asc" | "spent_desc" | "orders_desc">("recent");

  // États pour les modales
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomerItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [isEditOpen, setIsEditOpen] = useState<boolean>(false);
  const [customerToDelete, setCustomerToDelete] = useState<AdminCustomerItem | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Formulaire d'édition / création
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    birth_date: "",
    address: "",
    city: "",
    country: "Belgique",
  });
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Chargement des données (avec option de rafraîchissement silencieux)
  const loadCustomers = useCallback(async (showGlobalLoader = true) => {
    if (showGlobalLoader) {
      setIsLoading(true);
    }
    try {
      const data = await fetchAdminCustomers();
      setCustomers(data);
    } catch (err) {
      console.error("Erreur chargement clients :", err);
      toast.error("Impossible de charger la liste des clients.");
    } finally {
      if (showGlobalLoader) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    loadCustomers(true);
  }, [loadCustomers]);

  // Copie dans le presse-papier avec feedback visuel
  const handleCopy = (text: string, fieldId: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    toast.success(`${label} copié !`, { description: text });
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Filtrage et Tri
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        (c.first_name && c.first_name.toLowerCase().includes(q)) ||
        (c.last_name && c.last_name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.city && c.city.toLowerCase().includes(q)) ||
        (c.country && c.country.toLowerCase().includes(q));

      if (!matchSearch) return false;

      if (filterType === "with_orders") return c.orders_count > 0;
      if (filterType === "with_birthdate") return Boolean(c.birth_date && c.birth_date.trim());

      return true;
    }).sort((a, b) => {
      if (sortBy === "name_asc") {
        const nameA = `${a.last_name} ${a.first_name}`.toLowerCase();
        const nameB = `${b.last_name} ${b.first_name}`.toLowerCase();
        return nameA.localeCompare(nameB);
      }
      if (sortBy === "spent_desc") {
        return b.total_spent - a.total_spent;
      }
      if (sortBy === "orders_desc") {
        return b.orders_count - a.orders_count;
      }
      // Par défaut : plus récent
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [customers, searchQuery, filterType, sortBy]);

  // Statistiques KPIs
  const stats = useMemo(() => {
    const total = customers.length;
    const withOrders = customers.filter((c) => c.orders_count > 0).length;
    const withBirthDate = customers.filter((c) => Boolean(c.birth_date && c.birth_date.trim())).length;
    const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0);

    return { total, withOrders, withBirthDate, totalRevenue };
  }, [customers]);

  // Ouverture du formulaire de modification
  const handleOpenEdit = (customer?: AdminCustomerItem) => {
    if (customer) {
      setSelectedCustomer(customer);
      setFormData({
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: customer.phone || "",
        birth_date: customer.birth_date || "",
        address: customer.address || "",
        city: customer.city || "",
        country: customer.country || "Belgique",
      });
    } else {
      setSelectedCustomer(null);
      setFormData({
        email: "",
        first_name: "",
        last_name: "",
        phone: "",
        birth_date: "",
        address: "",
        city: "",
        country: "Belgique",
      });
    }
    setIsEditOpen(true);
  };

  // Enregistrement de la fiche client
  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim()) {
      toast.error("L'adresse email est requise.");
      return;
    }

    setIsSaving(true);
    const res = await saveCustomer(formData);
    setIsSaving(false);

    if (res.success) {
      toast.success(selectedCustomer ? "Fiche client mise à jour avec succès !" : "Nouveau client ajouté !");
      setIsEditOpen(false);
      loadCustomers(false);
    } else {
      toast.error(res.error || "Erreur lors de la sauvegarde.");
    }
  };

  // Suppression d'un client avec mise à jour optimiste fluide (zéro scintillement ni rechargement de page)
  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;
    const targetEmail = customerToDelete.email;

    // Retrait optimiste immédiat de la ligne du tableau
    setCustomers((prev) => prev.filter((c) => c.email.toLowerCase() !== targetEmail.toLowerCase()));
    setCustomerToDelete(null);
    toast.success("Client supprimé avec succès.");

    try {
      const res = await deleteCustomer(targetEmail);
      if (!res.success) {
        toast.error(res.error || "Erreur lors de la suppression en base de données.");
        loadCustomers(false);
      }
    } catch {
      toast.error("Erreur de connexion lors de la suppression.");
      loadCustomers(false);
    }
  };

  // Exportation CSV pour Excel
  const handleExportCSV = () => {
    if (customers.length === 0) {
      toast.info("Aucun client à exporter.");
      return;
    }

    const headers = [
      "Nom",
      "Prénom",
      "Email",
      "Numéro de Téléphone",
      "Date de Naissance",
      "Âge",
      "Adresse",
      "Ville",
      "Pays",
      "Nombre de Commandes",
      "Total Dépensé (MAD)",
      "Date d'inscription",
    ];

    const rows = filteredCustomers.map((c) => {
      const age = calculateAge(c.birth_date);
      return [
        `"${(c.last_name || "").replace(/"/g, '""')}"`,
        `"${(c.first_name || "").replace(/"/g, '""')}"`,
        `"${(c.email || "").replace(/"/g, '""')}"`,
        `"${(c.phone || "").replace(/"/g, '""')}"`,
        `"${c.birth_date || ""}"`,
        `"${age !== null ? age : ""}"`,
        `"${(c.address || "").replace(/"/g, '""')}"`,
        `"${(c.city || "").replace(/"/g, '""')}"`,
        `"${(c.country || "").replace(/"/g, '""')}"`,
        c.orders_count,
        c.total_spent.toFixed(2),
        `"${c.created_at ? new Date(c.created_at).toLocaleDateString("fr-FR") : ""}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `clients_maison_kenzi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Fichier CSV téléchargé avec succès !");
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* EN-TÊTE DE LA PAGE */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/25 flex items-center justify-center text-primary shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Répertoire des Clients
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-light">
                Consultez et gérez les coordonnées des clients du site (Nom, Prénom, Email, Téléphone, Date de Naissance).
              </p>
            </div>
          </div>
        </div>

        {/* Boutons d'Action Principaux */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={loadCustomers}
            disabled={isLoading}
            className="h-9 gap-1.5 text-xs font-semibold rounded-xl border-border/80 hover:bg-muted cursor-pointer"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Actualiser</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-9 gap-1.5 text-xs font-semibold rounded-xl border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter CSV</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => handleOpenEdit()}
            className="h-9 gap-1.5 text-xs font-bold rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Client</span>
          </Button>
        </div>
      </div>

      {/* CARTES KPIS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Total Clients */}
        <div className="bg-card/80 border border-border/70 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Total Inscrits
            </span>
            <p className="text-2xl font-serif font-bold text-foreground">
              {stats.total}
            </p>
            <span className="text-[10px] text-muted-foreground">Comptes & acheteurs</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Clients avec Commandes */}
        <div className="bg-card/80 border border-border/70 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Clients Actifs
            </span>
            <p className="text-2xl font-serif font-bold text-emerald-600 dark:text-emerald-400">
              {stats.withOrders}
            </p>
            <span className="text-[10px] text-muted-foreground">Ayant déjà commandé</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Dates de Naissance Renseignées */}
        <div className="bg-card/80 border border-border/70 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Dates de Naissance
            </span>
            <p className="text-2xl font-serif font-bold text-primary">
              {stats.withBirthDate}
            </p>
            <span className="text-[10px] text-muted-foreground">Profils complets</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Chiffre d'Affaires Cumulé */}
        <div className="bg-card/80 border border-border/70 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Volume d'Achats
            </span>
            <p className="text-xl font-serif font-bold text-primary truncate">
              {formatMAD(stats.totalRevenue)}
            </p>
            <span className="text-[10px] text-muted-foreground">Chiffre d'affaires clients</span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* BARRE DE RECHERCHE, FILTRES & TRI */}
      <div className="bg-card/80 border border-border/70 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Recherche textuelle */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              type="text"
              placeholder="Rechercher par Nom, Prénom, Email, Téléphone, Ville..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 pl-10 pr-8 text-xs sm:text-sm rounded-xl bg-background border-border/80 focus:border-primary"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filtres par type */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setFilterType("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterType === "all"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Tous ({customers.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("with_orders")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterType === "with_orders"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Avec commandes ({stats.withOrders})
            </button>
            <button
              type="button"
              onClick={() => setFilterType("with_birthdate")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterType === "with_birthdate"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              Avec date de naissance ({stats.withBirthDate})
            </button>
          </div>

          {/* Sélecteur de Tri */}
          <div className="flex items-center gap-2 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-9 px-3 text-xs rounded-xl bg-background border border-border/80 text-foreground focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="recent">Plus récents d'abord</option>
              <option value="name_asc">Nom alphabétique (A-Z)</option>
              <option value="spent_desc">Total dépensé (Décroissant)</option>
              <option value="orders_desc">Nombre de commandes</option>
            </select>
          </div>
        </div>
      </div>

      {/* TABLEAU DES CLIENTS */}
      <div className="bg-card/90 border border-border/80 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-xs text-muted-foreground font-light">
              Chargement des profils clients...
            </p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-16 px-4 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground mx-auto">
              <Users className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="font-serif text-sm sm:text-base font-bold text-foreground">
                Aucun client trouvé
              </h3>
              <p className="text-xs text-muted-foreground font-light">
                {searchQuery
                  ? "Aucun client ne correspond à votre recherche. Essayez d'autres mots-clés."
                  : "Aucun profil client n'a encore été enregistré sur la boutique."}
              </p>
            </div>
            {searchQuery && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="text-xs font-semibold rounded-xl"
              >
                Réinitialiser la recherche
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/70 bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Nom & Prénom</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Téléphone</th>
                  <th className="py-3 px-4">Date de Naissance</th>
                  <th className="py-3 px-4">Ville / Pays</th>
                  <th className="py-3 px-4 text-right">Commandes</th>
                  <th className="py-3 px-4 text-right">Total Dépensé</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredCustomers.map((c) => {
                  const fullName = `${c.first_name} ${c.last_name}`.trim() || "Client sans nom";
                  const age = calculateAge(c.birth_date);
                  const initials = getInitials(c.first_name, c.last_name);

                  return (
                    <tr
                      key={c.id || c.email}
                      className="hover:bg-muted/30 transition-colors group"
                    >
                      {/* Avatar & Initiales */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/15 text-primary border border-primary/30 flex items-center justify-center font-bold text-[11px] shrink-0 font-serif">
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <span className="font-serif font-bold text-foreground block truncate">
                              {fullName}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              Inscrit le {new Date(c.created_at || Date.now()).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Nom & Prénom Séparés */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground">
                            {c.last_name || "—"}
                          </p>
                          <p className="text-muted-foreground text-[11px]">
                            {c.first_name || "—"}
                          </p>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 max-w-[200px]">
                          <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <a
                            href={`mailto:${c.email}`}
                            className="text-foreground hover:text-primary transition-colors truncate hover:underline"
                            title={c.email}
                          >
                            {c.email}
                          </a>
                          <button
                            type="button"
                            onClick={() => handleCopy(c.email, `email_${c.id}`, "Email")}
                            className="text-muted-foreground hover:text-primary p-0.5 rounded cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                            title="Copier l'email"
                          >
                            {copiedField === `email_${c.id}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Téléphone */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {c.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <a
                              href={`tel:${c.phone}`}
                              className="font-mono text-[11px] text-foreground hover:text-primary transition-colors hover:underline"
                            >
                              {c.phone}
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCopy(c.phone!, `phone_${c.id}`, "Téléphone")}
                              className="text-muted-foreground hover:text-primary p-0.5 rounded cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                              title="Copier le numéro"
                            >
                              {copiedField === `phone_${c.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground italic">Non renseigné</span>
                        )}
                      </td>

                      {/* Date de Naissance */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {c.birth_date ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5 text-foreground font-medium">
                              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                              <span>{formatFrenchDate(c.birth_date)}</span>
                            </div>
                            {age !== null && (
                              <span className="text-[10px] text-muted-foreground font-mono block pl-5">
                                ({age} ans)
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                            Non renseignée
                          </span>
                        )}
                      </td>

                      {/* Ville & Pays */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>{c.city ? `${c.city}, ` : ""}{c.country || "Belgique"}</span>
                        </div>
                      </td>

                      {/* Nombre de Commandes */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                            c.orders_count > 0
                              ? "bg-primary/10 text-primary font-bold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {c.orders_count} commande{c.orders_count > 1 ? "s" : ""}
                        </span>
                      </td>

                      {/* Total Dépensé */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-foreground">
                        {c.total_spent > 0 ? (
                          <span className="text-primary">{formatMAD(c.total_spent)}</span>
                        ) : (
                          <span className="text-muted-foreground font-normal">0,00 MAD</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCustomer(c);
                              setIsDetailOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                            title="Voir la fiche détaillée"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                            title="Modifier les coordonnées"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomerToDelete(c)}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                            title="Supprimer ce client"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALE DE FICHE DÉTAILLÉE DU CLIENT */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-card border-border/80 p-5 sm:p-6 space-y-4">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center font-serif font-bold text-base">
                {selectedCustomer ? getInitials(selectedCustomer.first_name, selectedCustomer.last_name) : "MK"}
              </div>
              <div>
                <DialogTitle className="font-serif text-lg font-bold text-foreground">
                  {selectedCustomer?.first_name} {selectedCustomer?.last_name}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Fiche personnelle et coordonnées de livraison
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedCustomer && (
            <div className="space-y-3 text-xs divide-y divide-border/60">
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="bg-muted/40 p-2.5 rounded-xl space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Prénom
                  </span>
                  <p className="font-bold text-foreground">{selectedCustomer.first_name || "—"}</p>
                </div>
                <div className="bg-muted/40 p-2.5 rounded-xl space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Nom
                  </span>
                  <p className="font-bold text-foreground">{selectedCustomer.last_name || "—"}</p>
                </div>
              </div>

              <div className="space-y-2 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-primary" /> Email :
                  </span>
                  <span className="font-semibold text-foreground">{selectedCustomer.email}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-primary" /> Téléphone :
                  </span>
                  <span className="font-mono font-semibold text-foreground">{selectedCustomer.phone || "Non renseigné"}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" /> Date de Naissance :
                  </span>
                  <span className="font-semibold text-foreground">
                    {formatFrenchDate(selectedCustomer.birth_date)}
                    {selectedCustomer.birth_date && ` (${calculateAge(selectedCustomer.birth_date)} ans)`}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> Adresse :
                  </span>
                  <span className="font-semibold text-foreground text-right max-w-[200px] truncate">
                    {selectedCustomer.address || "Non renseignée"}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> Ville / Pays :
                  </span>
                  <span className="font-semibold text-foreground">
                    {selectedCustomer.city ? `${selectedCustomer.city}, ` : ""}{selectedCustomer.country || "Belgique"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3">
                <div className="bg-primary/10 border border-primary/20 p-2.5 rounded-xl space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                    Commandes
                  </span>
                  <p className="text-base font-bold text-foreground">{selectedCustomer.orders_count}</p>
                </div>
                <div className="bg-primary/10 border border-primary/20 p-2.5 rounded-xl space-y-0.5">
                  <span className="text-[10px] uppercase tracking-wider text-primary font-semibold">
                    Total Dépensé
                  </span>
                  <p className="text-base font-bold text-primary">{formatMAD(selectedCustomer.total_spent)}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDetailOpen(false)}
              className="w-full rounded-xl text-xs font-semibold"
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODALE DE CRÉATION / MODIFICATION CLIENT */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg rounded-2xl bg-card border-border/80 p-5 sm:p-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="font-serif text-lg font-bold text-foreground">
              {selectedCustomer ? "Modifier la Fiche Client" : "Créer une Nouvelle Fiche Client"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Renseignez les coordonnées personnelles et postales du client.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveCustomer} className="space-y-3.5 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Prénom */}
              <div className="space-y-1">
                <Label htmlFor="first_name" className="text-xs font-semibold text-foreground">
                  Prénom *
                </Label>
                <Input
                  id="first_name"
                  type="text"
                  required
                  placeholder="Ex: Yassine"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="h-10 text-xs rounded-xl bg-background border-border/80 focus:border-primary"
                />
              </div>

              {/* Nom */}
              <div className="space-y-1">
                <Label htmlFor="last_name" className="text-xs font-semibold text-foreground">
                  Nom *
                </Label>
                <Input
                  id="last_name"
                  type="text"
                  required
                  placeholder="Ex: Bennani"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="h-10 text-xs rounded-xl bg-background border-border/80 focus:border-primary"
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                Adresse Email *
              </Label>
              <Input
                id="email"
                type="email"
                required
                disabled={Boolean(selectedCustomer)}
                placeholder="Ex: yassine.bennani@gmail.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="h-10 text-xs rounded-xl bg-background border-border/80 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Téléphone */}
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-semibold text-foreground">
                  Numéro de Téléphone
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Ex: +32 478 12 34 56"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-10 text-xs rounded-xl bg-background border-border/80 focus:border-primary"
                />
              </div>

              {/* Date de Naissance */}
              <div className="space-y-1">
                <Label htmlFor="birth_date" className="text-xs font-semibold text-foreground">
                  Date de Naissance
                </Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                  className="h-10 text-xs rounded-xl bg-background border-border/80 focus:border-primary"
                />
              </div>
            </div>

            {/* Adresse */}
            <div className="space-y-1">
              <Label htmlFor="address" className="text-xs font-semibold text-foreground">
                Adresse de Livraison
              </Label>
              <Input
                id="address"
                type="text"
                placeholder="Ex: Avenue Louise 120"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="h-10 text-xs rounded-xl bg-background border-border/80 focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Ville */}
              <div className="space-y-1">
                <Label htmlFor="city" className="text-xs font-semibold text-foreground">
                  Ville
                </Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="Ex: Bruxelles"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="h-10 text-xs rounded-xl bg-background border-border/80 focus:border-primary"
                />
              </div>

              {/* Pays */}
              <div className="space-y-1">
                <Label htmlFor="country" className="text-xs font-semibold text-foreground">
                  Pays
                </Label>
                <Input
                  id="country"
                  type="text"
                  placeholder="Ex: Belgique"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="h-10 text-xs rounded-xl bg-background border-border/80 focus:border-primary"
                />
              </div>
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                className="rounded-xl text-xs font-semibold cursor-pointer"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer shadow-xs"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE CONFIRMATION DE SUPPRESSION */}
      <AlertDialog
        open={Boolean(customerToDelete)}
        onOpenChange={(open) => {
          if (!open) setCustomerToDelete(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl bg-card border-border/80 p-5 sm:p-6">
          <AlertDialogHeader className="space-y-2">
            <AlertDialogTitle className="font-serif text-lg font-bold text-foreground">
              Supprimer ce client ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Êtes-vous certain de vouloir supprimer la fiche de{" "}
              <strong className="text-foreground">
                {customerToDelete?.first_name} {customerToDelete?.last_name} ({customerToDelete?.email})
              </strong>{" "}
              ? Cette action retirera le profil du répertoire.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="pt-2">
            <AlertDialogCancel className="rounded-xl text-xs font-semibold">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="rounded-xl text-xs font-bold bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer Définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Clients;
