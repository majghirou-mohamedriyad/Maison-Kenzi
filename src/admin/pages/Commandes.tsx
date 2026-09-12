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
  ChevronDown,
  Check,
  Copy,
  Send,
  Loader2,
} from "lucide-react";
import { downloadInvoice, sendInvoiceViaWhatsapp } from "@/admin/lib/invoice";
import {
  dispatchOrderStatusChangedWhatsAppNotification,
  sendOpenWaMessage,
  buildOrderConfirmationMessage,
} from "@/services/whatsappService";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const STATUS_CONFIG: Record<
  OrderStatus,
  {
    label: string;
    sublabel: string;
    icon: LucideIcon;
    badgeCls: string;
    dotCls: string;
    hoverCls: string;
  }
> = {
  en_attente: {
    label: "En attente",
    sublabel: "Nouvelle commande à traiter",
    icon: Clock,
    badgeCls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20",
    dotCls: "bg-amber-500 animate-pulse",
    hoverCls: "hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400",
  },
  confirmee: {
    label: "Confirmée",
    sublabel: "Préparation soignée à l'atelier",
    icon: Package,
    badgeCls: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20",
    dotCls: "bg-blue-500",
    hoverCls: "hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400",
  },
  livree: {
    label: "Livrée",
    sublabel: "Remise au client & encaissée",
    icon: CheckCircle2,
    badgeCls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20",
    dotCls: "bg-emerald-500",
    hoverCls: "hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400",
  },
  annulee: {
    label: "Annulée",
    sublabel: "Commande annulée / retour",
    icon: XCircle,
    badgeCls: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20",
    dotCls: "bg-rose-500",
    hoverCls: "hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400",
  },
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingDirectWa, setSendingDirectWa] = useState(false);

  const handleCopyOrderNumber = (e: React.MouseEvent, orderNumber: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(orderNumber);
    setCopiedId(orderNumber);
    toast.success(`N° de commande ${orderNumber} copié dans le presse-papier`);
    setTimeout(() => {
      setCopiedId((curr) => (curr === orderNumber ? null : curr));
    }, 2000);
  };

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    const res = await updateOrderStatus(id, status);
    if (res.error) toast.error("Erreur: " + res.error);
    else {
      toast.success("Statut mis à jour");

      // Notification automatique WhatsApp OpenWA vers le client
      const targetOrder = orders.find((o) => o.id === id) || viewingOrder;
      if (targetOrder && targetOrder.customer_phone) {
        dispatchOrderStatusChangedWhatsAppNotification({
          order_number: targetOrder.order_number,
          customer_name: targetOrder.customer_name,
          customer_phone: targetOrder.customer_phone,
          status,
        }).then((sendRes) => {
          if (sendRes.success) {
            toast.success("Notification WhatsApp de statut transmise au client");
          }
        }).catch(() => {});
      }

      if (viewingOrder && viewingOrder.id === id) {
        setViewingOrder({ ...viewingOrder, status });
      }
    }
  };

  const handleSendOpenWaConfirmation = async (o: Order) => {
    if (!o.customer_phone) {
      toast.error("Cette commande ne dispose d'aucun numéro de téléphone client");
      return;
    }
    setSendingDirectWa(true);
    try {
      const msg = buildOrderConfirmationMessage({
        order_number: o.order_number,
        customer_name: o.customer_name,
        total_amount: o.total_amount,
        shipping_address: o.customer_address,
        items: o.items.map((it) => ({
          name: it.parfum_name || (it as any).name || "Parfum",
          quantity: it.quantity,
          size: it.size,
        })),
      });

      const res = await sendOpenWaMessage(o.customer_phone, msg);
      if (res.success) {
        toast.success(`Confirmation WhatsApp transmise avec succès au ${o.customer_phone} via la VPS !`);
      } else {
        toast.error(`Échec d'envoi OpenWA: ${res.error}`);
      }
    } catch (err: any) {
      toast.error("Erreur: " + err.message);
    } finally {
      setSendingDirectWa(false);
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

  const StatusSelect = ({ id, status }: { id: string; status: OrderStatus }) => {
    const current = STATUS_CONFIG[status] || STATUS_CONFIG.en_attente;
    const CurrentIcon = current.icon;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={`group inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border transition-all duration-200 cursor-pointer shadow-2xs hover:scale-[1.02] active:scale-[0.98] ${current.badgeCls}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${current.dotCls} shrink-0`} />
            <CurrentIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
            <span>{current.label}</span>
            <ChevronDown className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="w-56 p-1.5 bg-card/95 backdrop-blur-xl border border-border/80 shadow-xl rounded-xl z-50 animate-in fade-in-0 zoom-in-95"
        >
          <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold tracking-widest text-muted-foreground border-b border-border/50 mb-1">
            Changer le statut
          </div>

          <div className="space-y-0.5">
            {STATUSES.map((s) => {
              const cfg = STATUS_CONFIG[s];
              const IconComp = cfg.icon;
              const isSelected = s === status;

              return (
                <DropdownMenuItem
                  key={s}
                  onClick={() => handleStatusChange(id, s)}
                  className={`flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-secondary font-semibold text-foreground"
                      : `${cfg.hoverCls} text-muted-foreground hover:text-foreground`
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5">
                      <IconComp className="w-3.5 h-3.5 shrink-0" />
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-foreground leading-none">
                        {cfg.label}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-normal mt-0.5 leading-tight">
                        {cfg.sublabel}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

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
              {stats.revenue.toLocaleString("fr-FR")} €
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
                        type="button"
                        onClick={(e) => handleCopyOrderNumber(e, o.order_number)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/80 hover:bg-primary/15 text-foreground hover:text-primary border border-border/80 hover:border-primary/40 font-mono text-xs font-bold transition-all cursor-pointer group shadow-2xs"
                        title="Cliquer pour copier le N° de commande"
                      >
                        <span>{o.order_number}</span>
                        {copiedId === o.order_number ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 stroke-[2.5]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                        )}
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
                      {Number(o.total_amount).toLocaleString("fr-FR")} €
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
                    type="button"
                    onClick={(e) => handleCopyOrderNumber(e, o.order_number)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/80 hover:bg-primary/15 text-foreground hover:text-primary border border-border/80 hover:border-primary/40 font-mono text-xs font-bold transition-all cursor-pointer group"
                    title="Cliquer pour copier le N° de commande"
                  >
                    <span>{o.order_number}</span>
                    {copiedId === o.order_number ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 stroke-[2.5]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                    )}
                  </button>
                  <div className="text-xs text-muted-foreground mt-1">{formatDate(o.created_at)}</div>
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
                <span className="font-bold tracking-tight text-foreground text-base">{Number(o.total_amount).toLocaleString("fr-FR")} €</span>
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
                            <span>à {unitPrice.toLocaleString("fr-FR")} €</span>
                          </div>
                        </div>

                        <div className="font-bold tracking-tight text-foreground text-sm text-right shrink-0">
                          {subtotal.toLocaleString("fr-FR")} €
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
                      {Number(viewingOrder.total_amount).toLocaleString("fr-FR")} €
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

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
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
                    onClick={() => handleSendOpenWaConfirmation(viewingOrder)}
                    disabled={sendingDirectWa}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                    title="Envoyer automatiquement le message de confirmation via le serveur OpenWA VPS"
                  >
                    {sendingDirectWa ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{sendingDirectWa ? "Envoi..." : "Envoyer OpenWA"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleWhatsapp(viewingOrder)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-lg transition-colors cursor-pointer shadow-xs"
                    title="Ouvrir WhatsApp Web / App avec le message prérempli"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Manuel</span>
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
