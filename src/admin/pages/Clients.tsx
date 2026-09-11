import { useState, useMemo } from "react";
import { useAdminCustomers, type EnrichedCustomer } from "@/hooks/useAdminCustomers";
import { ORDER_STATUS_LABEL } from "@/types/database";
import { toast } from "sonner";
import {
  Users,
  Crown,
  TrendingUp,
  Coins,
  Search,
  MessageCircle,
  Eye,
  Trash2,
  Phone,
  MapPin,
  Calendar,
  Package,
  Download,
  Plus,
  User,
  ShoppingBag,
  Sparkles,
  RefreshCw,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const Clients = () => {
  const { customers, loading, error, refetch, addCustomer, deleteCustomer } = useAdminCustomers();
  const [search, setSearch] = useState("");
  const [viewingCustomer, setViewingCustomer] = useState<EnrichedCustomer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<EnrichedCustomer | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);

  // New Customer Form State
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [adding, setAdding] = useState(false);

  // Filtered customers
  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return customers.filter((c) => {
      if (q) {
        const matchName = c.name?.toLowerCase().includes(q);
        const matchPhone = c.phone?.toLowerCase().includes(q);
        const matchAddress = c.address?.toLowerCase().includes(q);
        const matchEmail = c.email?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchAddress && !matchEmail) return false;
      }
      return true;
    });
  }, [customers, search]);

  // Statistics KPI
  const stats = useMemo(() => {
    const total = customers.length;
    const vip = customers.filter((c) => c.total_spent >= 500 || c.total_orders >= 2).length;
    const totalRevenue = customers.reduce((sum, c) => sum + Number(c.total_spent || 0), 0);
    const totalOrders = customers.reduce((sum, c) => sum + Number(c.total_orders || 0), 0);
    const avgBasket = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    return { total, vip, totalRevenue, avgBasket };
  }, [customers]);

  const handleExportCSV = () => {
    if (customers.length === 0) {
      toast.info("Aucun client à exporter.");
      return;
    }

    const headers = ["Nom", "Telephone", "Adresse", "Email", "Total_Commandes", "Total_Depense_MAD", "Date_Inscription"];
    const rows = customers.map((c) => [
      `"${(c.name || "").replace(/"/g, '""')}"`,
      `"${(c.phone || "").replace(/"/g, '""')}"`,
      `"${(c.address || "").replace(/"/g, '""')}"`,
      `"${(c.email || "").replace(/"/g, '""')}"`,
      c.total_orders,
      c.total_spent,
      c.created_at ? formatDate(c.created_at) : "",
    ]);

    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `clients-maison-kenzi-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Fichier CSV des clients téléchargé !");
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error("Le nom du client est requis");
      return;
    }
    setAdding(true);
    const res = await addCustomer({
      name: newName.trim(),
      phone: newPhone.trim() || null,
      address: newAddress.trim() || null,
      email: newEmail.trim() || undefined,
    });
    setAdding(false);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success("Client ajouté avec succès");
      setIsAddOpen(false);
      setNewName("");
      setNewPhone("");
      setNewAddress("");
      setNewEmail("");
    }
  };

  const confirmDelete = async () => {
    if (!deletingCustomer) return;
    const res = await deleteCustomer(deletingCustomer);
    if (res.error) {
      toast.error("Erreur lors de la suppression : " + res.error);
    } else {
      toast.success(`Client ${deletingCustomer.name} retiré`);
      if (viewingCustomer && viewingCustomer.id === deletingCustomer.id) {
        setViewingCustomer(null);
      }
      setDeletingCustomer(null);
    }
  };

  const openWhatsApp = (phone?: string | null, name?: string) => {
    if (!phone) {
      toast.warning("Aucun numéro de téléphone renseigné pour ce client");
      return;
    }
    const cleanDigits = phone.replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(`Bonjour ${name || ""} ! Nous vous remercions pour votre confiance envers Maison Kenzi.`);
    window.open(`https://wa.me/${cleanDigits}?text=${msg}`, "_blank");
  };

  return (
    <div className="space-y-4">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Total Clients</span>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-1">{stats.total}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-amber-500 font-semibold">Clients VIP / Fidèles</span>
            <div className="text-2xl font-bold tracking-tight text-amber-500 mt-1">{stats.vip}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Crown className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-emerald-500 font-semibold">Panier Moyen / Client</span>
            <div className="text-2xl font-bold tracking-tight text-emerald-500 mt-1">{stats.avgBasket.toLocaleString("fr-FR")} MAD</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-primary font-semibold">Total Ventes Clients</span>
            <div className="text-xl font-bold tracking-tight text-primary mt-1">
              {stats.totalRevenue.toLocaleString("fr-FR")} MAD
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card border border-border rounded-xl p-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client (nom, téléphone, ville, adresse)..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              refetch();
              toast.success("Base de données clients actualisée");
            }}
            title="Rafraîchir les données"
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground rounded-lg border border-border transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            title="Exporter la liste en fichier CSV"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground rounded-lg border border-border transition-colors whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporter CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Client</span>
          </button>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/70 text-muted-foreground text-xs uppercase tracking-wide border-b border-border">
              <tr>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Téléphone & WhatsApp</th>
                <th className="text-left px-4 py-3">Adresse & Ville</th>
                <th className="text-center px-4 py-3">Commandes</th>
                <th className="text-right px-4 py-3">Total Dépensé</th>
                <th className="text-left px-4 py-3">Dernière Activité</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Chargement des clients…</td></tr>
              )}
              {error && !loading && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-destructive">{error}</td></tr>
              )}
              {!loading && !error && filteredCustomers.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Aucun client ne correspond à cette recherche.</td></tr>
              )}
              {filteredCustomers.map((c) => {
                const isVip = c.total_spent >= 500 || c.total_orders >= 2;
                return (
                  <tr key={c.id} className="border-t border-border hover:bg-muted/30 transition-colors align-top">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setViewingCustomer(c)}
                          className="font-semibold text-foreground hover:text-primary transition-colors text-left cursor-pointer"
                        >
                          {c.name}
                        </button>
                        {isVip && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
                            <Crown className="w-3 h-3" /> VIP
                          </span>
                        )}
                      </div>
                      {c.email && !c.email.endsWith("@client.tabat.ma") && !c.email.endsWith("@client.maisonkenzi.ma") && (
                        <div className="text-xs text-muted-foreground mt-0.5">{c.email}</div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {c.phone ? (
                        <div className="flex items-center gap-2">
                          <span className="text-foreground font-medium">{c.phone}</span>
                          <button
                            type="button"
                            onClick={() => openWhatsApp(c.phone, c.name)}
                            title="Ouvrir la conversation WhatsApp"
                            className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[220px]">
                      {c.address ? (
                        <span className="flex items-start gap-1">
                          <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                          <span className="truncate">{c.address}</span>
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-foreground border border-border">
                        {c.total_orders} commande{c.total_orders > 1 ? "s" : ""}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right font-bold tracking-tight text-primary whitespace-nowrap">
                      {Number(c.total_spent).toLocaleString("fr-FR")} MAD
                    </td>

                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                      {c.last_order_date ? formatDate(c.last_order_date) : c.created_at ? formatDate(c.created_at) : "—"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewingCustomer(c)}
                          title="Voir la fiche client et ses commandes"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {c.phone && (
                          <button
                            type="button"
                            onClick={() => openWhatsApp(c.phone, c.name)}
                            title="Envoyer un message WhatsApp"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 transition-colors cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeletingCustomer(c)}
                          title="Supprimer ce client"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading && <p className="text-center text-sm text-muted-foreground py-10">Chargement des clients…</p>}
        {error && !loading && <p className="text-center text-sm text-destructive py-10">{error}</p>}
        {!loading && !error && filteredCustomers.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">Aucun client trouvé.</p>
        )}
        {filteredCustomers.map((c) => {
          const isVip = c.total_spent >= 500 || c.total_orders >= 2;
          return (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setViewingCustomer(c)}
                      className="font-semibold text-foreground text-sm hover:text-primary transition-colors text-left cursor-pointer"
                    >
                      {c.name}
                    </button>
                    {isVip && (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30">
                        <Crown className="w-2.5 h-2.5" /> VIP
                      </span>
                    )}
                  </div>
                  {c.phone && <div className="text-xs text-muted-foreground mt-0.5">{c.phone}</div>}
                </div>
                <div className="text-right">
                  <span className="font-bold tracking-tight text-primary text-sm block">{Number(c.total_spent).toLocaleString("fr-FR")} MAD</span>
                  <span className="text-[10px] text-muted-foreground">{c.total_orders} commande(s)</span>
                </div>
              </div>

              {c.address && (
                <div className="text-xs text-muted-foreground flex items-start gap-1 border-t border-border pt-2">
                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="truncate">{c.address}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-[11px] text-muted-foreground">
                  Inscrit le {formatDate(c.created_at)}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setViewingCustomer(c)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground rounded-md border border-border transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Fiche</span>
                  </button>
                  {c.phone && (
                    <button
                      type="button"
                      onClick={() => openWhatsApp(c.phone, c.name)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#25D366] rounded-md border border-[#25D366]/30 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeletingCustomer(c)}
                    className="inline-flex items-center justify-center w-7 h-7 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-md border border-red-500/30 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Customer Details & History Modal */}
      <Dialog open={!!viewingCustomer} onOpenChange={(open) => !open && setViewingCustomer(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card p-6 rounded-2xl">
          {viewingCustomer && (
            <div className="space-y-5">
              <DialogHeader className="border-b border-border pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-primary font-bold block">
                      Fiche Client Détaillée
                    </span>
                    <DialogTitle className="font-serif text-xl font-bold text-foreground">
                      {viewingCustomer.name}
                    </DialogTitle>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3.5 h-3.5" />
                      Inscrit le {formatDate(viewingCustomer.created_at)}
                    </span>
                  </div>

                  {(viewingCustomer.total_spent >= 500 || viewingCustomer.total_orders >= 2) && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 shrink-0">
                      <Crown className="w-3.5 h-3.5" /> Client VIP
                    </span>
                  )}
                </div>
              </DialogHeader>

              {/* Metrics cards */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="bg-background border border-border rounded-xl p-3">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Commandes</span>
                  <span className="text-lg font-bold tracking-tight text-foreground mt-0.5 block">{viewingCustomer.total_orders}</span>
                </div>
                <div className="bg-background border border-border rounded-xl p-3">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Total Dépensé</span>
                  <span className="text-lg font-bold tracking-tight text-primary mt-0.5 block">{Number(viewingCustomer.total_spent).toLocaleString("fr-FR")} MAD</span>
                </div>
                <div className="bg-background border border-border rounded-xl p-3">
                  <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Panier Moyen</span>
                  <span className="text-lg font-bold tracking-tight text-emerald-500 mt-0.5 block">{Number(viewingCustomer.average_basket || 0).toLocaleString("fr-FR")} MAD</span>
                </div>
              </div>

              {/* Coordonnées */}
              <div className="bg-background border border-border rounded-xl p-4 space-y-2 text-xs">
                <h4 className="text-xs uppercase font-bold text-foreground flex items-center gap-1.5 mb-2">
                  <User className="w-4 h-4 text-primary" /> Coordonnées du Client
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Téléphone</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-foreground">{viewingCustomer.phone || "Non renseigné"}</span>
                      {viewingCustomer.phone && (
                        <a
                          href={`tel:${viewingCustomer.phone.replace(/\s+/g, "")}`}
                          className="text-primary text-[11px] font-semibold hover:underline"
                        >
                          Appeler
                        </a>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[11px]">Email</span>
                    <span className="text-muted-foreground mt-0.5 block">
                      {viewingCustomer.email && !viewingCustomer.email.endsWith("@client.tabat.ma") && !viewingCustomer.email.endsWith("@client.maisonkenzi.ma") ? viewingCustomer.email : "Non renseigné"}
                    </span>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground block text-[11px]">Adresse de livraison</span>
                    <span className="text-foreground flex items-center gap-1 mt-0.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{viewingCustomer.address || "Non renseignée"}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Order History */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-secondary/60 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                  <span className="flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-primary" /> Historique des Commandes ({viewingCustomer.orders?.length || 0})
                  </span>
                </div>

                {viewingCustomer.orders && viewingCustomer.orders.length > 0 ? (
                  <div className="divide-y divide-border">
                    {viewingCustomer.orders.map((ord) => (
                      <div key={ord.id} className="p-3.5 flex items-center justify-between gap-3 text-xs bg-card">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{ord.order_number}</span>
                            <span className="text-muted-foreground">• {formatDate(ord.created_at)}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-secondary border border-border">
                              {ORDER_STATUS_LABEL[ord.status]}
                            </span>
                          </div>
                          <div className="text-muted-foreground text-[11px] truncate mt-1">
                            {ord.items.map((it) => `${it.parfum_name || it.name || "Produit"} (${it.size || ""}) × ${it.quantity}`).join(", ")}
                          </div>
                        </div>

                        <div className="font-bold tracking-tight text-foreground text-sm text-right shrink-0">
                          {Number(ord.total_amount).toLocaleString("fr-FR")} MAD
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-muted-foreground">
                    Aucune commande détaillée enregistrée pour ce profil.
                  </div>
                )}
              </div>

              {/* Bottom Actions inside Modal */}
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setDeletingCustomer(viewingCustomer)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer ce profil</span>
                </button>

                <button
                  type="button"
                  onClick={() => setViewingCustomer(null)}
                  className="px-4 py-2 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground rounded-lg border border-border transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Customer Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-card p-6 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg font-bold text-foreground">
              Ajouter un Nouveau Client
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleAddSubmit} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Nom complet *</label>
              <input
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Youssef El Amrani"
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Numéro de Téléphone / WhatsApp</label>
              <input
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="Ex: 06 12 34 56 78"
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Adresse & Ville</label>
              <input
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                placeholder="Ex: Quartier Racine, Casablanca"
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Email (optionnel)</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="client@gmail.com"
                className="w-full px-3 py-2 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground rounded-lg border border-border transition-colors cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={adding}
                className="px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
              >
                {adding ? "Enregistrement…" : "Créer le Client"}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCustomer} onOpenChange={(open) => !open && setDeletingCustomer(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Supprimer ce client ?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Le profil de <strong className="text-foreground">{deletingCustomer?.name}</strong> sera retiré de la base de données client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer le profil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Clients;
