import { useState, useMemo } from "react";
import { useAdminOrders } from "@/hooks/useAdminOrders";
import { ORDER_STATUS_LABEL, type OrderStatus, type OrderItem, type Order } from "@/types/database";
import { toast } from "sonner";
import {
  LucideIcon,
  FileDown,
  MessageCircle,
  Trash2,
  Eye,
  Search,
  User,
  Phone,
  MapPin,
  Mail,
  Calendar,
  Layers,
  Clock,
  CheckCircle2,
  XCircle,
  Coins,
  Package,
} from "lucide-react";
import { downloadInvoice, sendInvoiceViaWhatsapp } from "@/admin/lib/invoice";
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

const STATUS_STYLE: Record<OrderStatus, string> = {
  en_attente: "bg-[#F59E0B]/10 text-[#F59E0B] border-[#F59E0B]/30",
  confirmee: "bg-[#3B82F6]/10 text-[#3B82F6] border-[#3B82F6]/30",
  livree: "bg-[#10B981]/10 text-[#10B981] border-[#10B981]/30",
  annulee: "bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/30",
};

const STATUS_ICONS: Record<OrderStatus, LucideIcon> = {
  en_attente: Clock,
  confirmee: Package,
  livree: CheckCircle2,
  annulee: XCircle,
};

const STATUSES: OrderStatus[] = ["en_attente", "confirmee", "livree", "annulee"];

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const summarizeItems = (items: OrderItem[]) =>
  items
    .map(
      (it) =>
        `${it.parfum_name || it.name || "Produit"} (${it.size}) × ${it.quantity}`
    )
    .join(", ");

const Commandes = () => {
  const { orders, loading, error, updateOrderStatus, deleteOrder } = useAdminOrders();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deletingOrder, setDeletingOrder] = useState<Order | null>(null);
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    const res = await updateOrderStatus(id, status);
    if (res.error) toast.error("Erreur: " + res.error);
    else {
      toast.success("Statut mis à jour");
      if (viewingOrder && viewingOrder.id === id) {
        setViewingOrder({ ...viewingOrder, status });
      }
    }
  };

  const confirmDeleteOrder = async () => {
    if (!deletingOrder) return;
    const res = await deleteOrder(deletingOrder.id);
    if (res.error) {
      toast.error("Erreur lors de la suppression : " + res.error);
    } else {
      toast.success(`Commande ${deletingOrder.order_number} supprimée`);
      if (viewingOrder && viewingOrder.id === deletingOrder.id) {
        setViewingOrder(null);
      }
      setDeletingOrder(null);
    }
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;

      if (q) {
        const matchNum = o.order_number.toLowerCase().includes(q);
        const matchName = o.customer_name.toLowerCase().includes(q);
        const matchPhone = o.customer_phone?.toLowerCase().includes(q);
        const matchEmail = o.customer_email?.toLowerCase().includes(q);
        const matchAddress = o.customer_address?.toLowerCase().includes(q);
        const matchItems = o.items.some((it) =>
          (it.parfum_name || (it as OrderItem & { name?: string }).name || "").toLowerCase().includes(q)
        );
        if (!matchNum && !matchName && !matchPhone && !matchEmail && !matchAddress && !matchItems) {
          return false;
        }
      }
      return true;
    });
  }, [orders, search, statusFilter]);

  // Statistics KPI
  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o) => o.status === "en_attente").length;
    const delivered = orders.filter((o) => o.status === "livree").length;
    const revenue = orders
      .filter((o) => o.status !== "annulee")
      .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    return { total, pending, delivered, revenue };
  }, [orders]);

  const StatusSelect = ({ id, status }: { id: string; status: OrderStatus }) => (
    <select
      value={status}
      onChange={(e) => handleStatusChange(id, e.target.value as OrderStatus)}
      className={`text-xs px-2.5 py-1 rounded-full border bg-transparent font-medium focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer ${STATUS_STYLE[status]}`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s} className="bg-card text-foreground">
          {ORDER_STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );

  const handlePdf = (o: Order) => {
    try {
      downloadInvoice(o);
      toast.success("Facture PDF téléchargée");
    } catch (e) {
      toast.error("Erreur PDF: " + (e as Error).message);
    }
  };

  const handleWhatsapp = (o: Order) => {
    if (!o.customer_phone) {
      toast.warning("Aucun numéro client — WhatsApp ouvert sans destinataire");
    }
    try {
      sendInvoiceViaWhatsapp(o);
      toast.success("PDF téléchargé · WhatsApp ouvert");
    } catch (e) {
      toast.error("Erreur: " + (e as Error).message);
    }
  };

  const Actions = ({ o }: { o: Order }) => (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => setViewingOrder(o)}
        title="Voir les détails de la commande"
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => handlePdf(o)}
        title="Télécharger la facture PDF"
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer"
      >
        <FileDown className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => handleWhatsapp(o)}
        title="Envoyer la facture via WhatsApp"
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[#25D366]/30 text-[#25D366] hover:bg-[#25D366]/10 transition-colors cursor-pointer"
      >
        <MessageCircle className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setDeletingOrder(o)}
        title="Supprimer la commande"
        className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Total Commandes</span>
            <div className="text-2xl font-bold tracking-tight text-foreground mt-1">{stats.total}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-amber-500 font-semibold">En Attente</span>
            <div className="text-2xl font-bold tracking-tight text-amber-500 mt-1">{stats.pending}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-emerald-500 font-semibold">Livrées</span>
            <div className="text-2xl font-bold tracking-tight text-emerald-500 mt-1">{stats.delivered}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-primary font-semibold">Chiffre d'Affaires</span>
            <div className="text-xl font-bold tracking-tight text-primary mt-1">
              {stats.revenue.toLocaleString("fr-FR")} MAD
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Coins className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-card border border-border rounded-xl p-3 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par N° commande, client, téléphone, produit..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-foreground text-background border-foreground"
                : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
            }`}
          >
            Toutes ({orders.length})
          </button>
          {STATUSES.map((s) => {
            const count = orders.filter((o) => o.status === s).length;
            const active = statusFilter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {ORDER_STATUS_LABEL[s]} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-card border border-border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/70 text-muted-foreground text-xs uppercase tracking-wide border-b border-border">
              <tr>
                <th className="text-left px-4 py-3"># Commande</th>
                <th className="text-left px-4 py-3">Client</th>
                <th className="text-left px-4 py-3">Produits</th>
                <th className="text-right px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Statut</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Chargement des commandes…</td></tr>
              )}
              {error && !loading && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-destructive">{error}</td></tr>
              )}
              {!loading && !error && filteredOrders.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Aucune commande ne correspond à cette recherche.</td></tr>
              )}
              {filteredOrders.map((o) => {
                const hasRealEmail = o.customer_email && o.customer_email.includes("@") && !o.customer_email.endsWith("@client.tabat.ma") && !o.customer_email.endsWith("@tabat.ma") && !o.customer_email.endsWith("@client.maisonkenzi.ma") && !o.customer_email.endsWith("@maisonkenzi.ma");
                return (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30 transition-colors align-top">
                    <td className="px-4 py-3 font-semibold text-foreground">
                      <button
                        onClick={() => setViewingOrder(o)}
                        className="hover:text-primary transition-colors text-left cursor-pointer"
                        title="Voir les détails"
                      >
                        {o.order_number}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{o.customer_name}</div>
                      {hasRealEmail && <div className="text-xs text-muted-foreground">{o.customer_email}</div>}
                      {o.customer_phone && <div className="text-xs text-muted-foreground">{o.customer_phone}</div>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs max-w-[280px] leading-relaxed">
                      {summarizeItems(o.items)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tracking-tight text-foreground whitespace-nowrap">
                      {Number(o.total_amount).toLocaleString("fr-FR")} MAD
                    </td>
                    <td className="px-4 py-3"><StatusSelect id={o.id} status={o.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">{formatDate(o.created_at)}</td>
                    <td className="px-4 py-3"><div className="flex justify-end"><Actions o={o} /></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading && <p className="text-center text-sm text-muted-foreground py-10">Chargement des commandes…</p>}
        {error && !loading && <p className="text-center text-sm text-destructive py-10">{error}</p>}
        {!loading && !error && filteredOrders.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">Aucune commande trouvée.</p>
        )}
        {filteredOrders.map((o) => {
          const hasRealEmail = o.customer_email && o.customer_email.includes("@") && !o.customer_email.endsWith("@client.tabat.ma") && !o.customer_email.endsWith("@tabat.ma") && !o.customer_email.endsWith("@client.maisonkenzi.ma") && !o.customer_email.endsWith("@maisonkenzi.ma");
          return (
            <div key={o.id} className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <button
                    onClick={() => setViewingOrder(o)}
                    className="font-semibold text-foreground text-sm hover:text-primary transition-colors text-left cursor-pointer"
                  >
                    {o.order_number}
                  </button>
                  <div className="text-xs text-muted-foreground">{formatDate(o.created_at)}</div>
                </div>
                <StatusSelect id={o.id} status={o.status} />
              </div>
              <div className="text-sm">
                <div className="font-semibold text-foreground truncate">{o.customer_name}</div>
                {hasRealEmail && <div className="text-xs text-muted-foreground truncate">{o.customer_email}</div>}
                {o.customer_phone && <div className="text-xs text-muted-foreground">{o.customer_phone}</div>}
              </div>
              <div className="text-xs text-muted-foreground border-t border-border pt-2 leading-relaxed">
                {summarizeItems(o.items)}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-muted-foreground font-semibold">Total à payer</span>
                <span className="font-bold tracking-tight text-foreground text-base">{Number(o.total_amount).toLocaleString("fr-FR")} MAD</span>
              </div>
              <div className="flex justify-end pt-2 border-t border-border"><Actions o={o} /></div>
            </div>
          );
        })}
      </div>

      {/* Order Details Modal (Voir les détails de la commande) */}
      <Dialog open={!!viewingOrder} onOpenChange={(open) => !open && setViewingOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card p-6 rounded-2xl">
          {viewingOrder && (
            <div className="space-y-5">
              <DialogHeader className="border-b border-border pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-primary font-bold block">
                      Détails de la commande
                    </span>
                    <DialogTitle className="font-serif text-xl font-bold text-foreground mt-0.5">
                      {viewingOrder.order_number}
                    </DialogTitle>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDate(viewingOrder.created_at)}
                    </span>
                  </div>

                  <div>
                    <StatusSelect id={viewingOrder.id} status={viewingOrder.status} />
                  </div>
                </div>
              </DialogHeader>

              {/* Customer Info Card */}
              <div className="bg-background border border-border rounded-xl p-4 space-y-3">
                <h4 className="text-xs uppercase tracking-wider font-bold text-foreground flex items-center gap-1.5">
                  <User className="w-4 h-4 text-primary" /> Informations Client & Livraison
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Nom & Prénom</span>
                    <span className="font-semibold text-foreground text-sm">{viewingOrder.customer_name}</span>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[11px]">Téléphone</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-semibold text-foreground">{viewingOrder.customer_phone || "Non renseigné"}</span>
                      {viewingOrder.customer_phone && (
                        <a
                          href={`https://wa.me/${viewingOrder.customer_phone.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] text-[#25D366] hover:underline font-semibold"
                        >
                          <MessageCircle className="w-3 h-3" /> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground block text-[11px]">Adresse de Livraison</span>
                    <span className="font-medium text-foreground flex items-start gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{viewingOrder.customer_address || "Non renseignée"}</span>
                    </span>
                  </div>

                  {viewingOrder.customer_email && (
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground block text-[11px]">Email</span>
                      <span className="text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <span>{viewingOrder.customer_email}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="border border-border rounded-xl overflow-hidden">
                <div className="bg-secondary/60 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground flex justify-between items-center">
                  <span>Articles ({viewingOrder.items.length})</span>
                  <span>Sous-total</span>
                </div>

                <div className="divide-y divide-border">
                  {viewingOrder.items.map((it, idx) => {
                    const itemName = it.parfum_name || it.name || "Parfum";
                    const unitPrice = Number(it.price || 0);
                    const qty = Number(it.quantity || 1);
                    const subtotal = Number(it.subtotal || unitPrice * qty);

                    return (
                      <div key={idx} className="p-3.5 flex items-center justify-between gap-3 text-xs bg-card">
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-foreground text-sm truncate">{itemName}</div>
                          <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
                            <span className="bg-secondary px-2 py-0.5 rounded text-[10px] font-medium border border-border/50">
                              Format : {it.size}
                            </span>
                            <span>× {qty} unité{qty > 1 ? "s" : ""}</span>
                            <span>à {unitPrice.toLocaleString("fr-FR")} MAD</span>
                          </div>
                        </div>

                        <div className="font-bold tracking-tight text-foreground text-sm text-right shrink-0">
                          {subtotal.toLocaleString("fr-FR")} MAD
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Total & Summary footer */}
                <div className="bg-secondary/40 p-3.5 space-y-1.5 text-xs border-t border-border">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Livraison Express</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Gratuite</span>
                  </div>
                  <div className="flex justify-between text-base font-bold pt-1 border-t border-border">
                    <span className="text-foreground">Total à encaisser (COD)</span>
                    <span className="font-bold tracking-tight text-primary">
                      {Number(viewingOrder.total_amount).toLocaleString("fr-FR")} MAD
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions inside Modal */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setDeletingOrder(viewingOrder)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/10 rounded-lg transition-colors w-full sm:w-auto justify-center cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer cette commande</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => handlePdf(viewingOrder)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground rounded-lg border border-border transition-colors cursor-pointer"
                  >
                    <FileDown className="w-4 h-4" />
                    <span>Facture PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleWhatsapp(viewingOrder)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingOrder} onOpenChange={(open) => !open && setDeletingOrder(null)}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Supprimer cette commande ?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              La commande <strong className="text-foreground">{deletingOrder?.order_number}</strong> (Client : {deletingOrder?.customer_name}) sera définitivement supprimée de la base de données. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteOrder}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer la commande
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Commandes;
