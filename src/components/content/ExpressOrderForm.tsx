/**
 * Formulaire de Commande Directe & Express — Maison Kenzi
 *
 * Permet au client de passer commande directement et instantanément pour les formats sélectionnés
 * sans passer par l'application externe WhatsApp. Enregistre la commande dans Supabase,
 * déclenche l'automatisation de notification en arrière-plan et affiche un récapitulatif avec lien de suivi.
 */

import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatMAD } from "@/lib/sizes";
import { toast } from "sonner";
import {
  User,
  Phone,
  MapPin,
  Sparkles,
  CheckCircle2,
  ShoppingBag,
  AlertCircle,
  Bell,
  Building2,
  ShieldCheck,
  Truck,
  Loader2,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { POPULAR_CITIES, searchMoroccanCities } from "@/data/moroccanCities";
import { useAppSettings } from "@/hooks/useAppSettings";
import { saveLastOrderNumber } from "@/hooks/useOrderTracking";
import { dispatchOrderCreatedWhatsAppNotifications } from "@/services/whatsappService";

export interface OrderSelectionItem {
  size: string;
  sizeLabel: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface ExpressOrderFormProps {
  parfumName: string;
  maison: string;
  items?: OrderSelectionItem[];
  sizeLabel?: string;
  quantity?: number;
  totalPrice: number;
  onAddToCart?: () => void;
  outOfStock?: boolean;
}

const ExpressOrderForm = ({
  parfumName,
  maison,
  items,
  sizeLabel = "10ml",
  quantity = 1,
  totalPrice,
  onAddToCart,
  outOfStock = false,
}: ExpressOrderFormProps) => {
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Casablanca");
  const [cityQuery, setCityQuery] = useState("Casablanca");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityWrapperRef = useRef<HTMLDivElement>(null);
  const [address, setAddress] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // État de confirmation de commande réussie
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    totalPrice: number;
    items: OrderSelectionItem[];
  } | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityWrapperRef.current && !cityWrapperRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const matchingCities = searchMoroccanCities(cityQuery, 8);

  // Normalisation de la liste des formats sélectionnés
  const activeItems: OrderSelectionItem[] = items && items.length > 0
    ? items.filter((i) => i.quantity > 0)
    : sizeLabel && quantity
    ? [
        {
          size: sizeLabel,
          sizeLabel: sizeLabel,
          quantity: quantity,
          unitPrice: totalPrice / quantity,
          subtotal: totalPrice,
        },
      ]
    : [];

  const handleCopyOrderNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedCode(true);
    toast.success("Numéro de commande copié dans le presse-papier !");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDirectOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (outOfStock) {
      toast.error("Ce produit est actuellement en rupture de stock.");
      return;
    }

    if (activeItems.length === 0) {
      toast.error("Veuillez sélectionner au moins un format disponible");
      return;
    }
    if (!fullName.trim()) {
      toast.error("Veuillez saisir votre Nom & Prénom");
      return;
    }
    if (!phone.trim()) {
      toast.error("Veuillez saisir votre numéro de téléphone");
      return;
    }
    if (!city.trim()) {
      toast.error("Veuillez sélectionner votre ville");
      return;
    }
    if (!address.trim()) {
      toast.error("Veuillez saisir votre adresse de livraison");
      return;
    }

    setIsSubmitting(true);

    // Génération du numéro de commande unique MK-XXXXXX
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `MK-${randomSuffix}`;
    const cleanEmail = `${fullName.trim().toLowerCase().replace(/[^a-z0-9]/g, "") || "client"}@client.maisonkenzi.ma`;
    const fullAddressText = `${address.trim()}, ${city.trim()}, Maroc`;
    saveLastOrderNumber(orderNumber);

    // Enregistrement de la commande dans Supabase
    try {
      const { data, error: dbError } = await supabase.from("orders").insert([
        {
          order_number: orderNumber,
          customer_name: fullName.trim(),
          customer_email: cleanEmail,
          customer_phone: phone.trim(),
          customer_address: fullAddressText,
          total_amount: totalPrice,
          status: "en_attente",
          items: activeItems.map((it) => ({
            name: `${maison} — ${parfumName}`,
            size: it.sizeLabel,
            quantity: it.quantity,
            price: it.unitPrice,
            subtotal: it.subtotal,
          })),
        },
      ]);

      if (dbError) {
        console.error("Erreur enregistrement commande Supabase:", dbError);
      } else {
        console.log("Commande enregistrée avec succès dans Supabase Admin:", data);
      }

      // Enregistrement et mise à jour automatique dans la base clients
      const cleanPhone = phone.trim();
      const { data: existingCust } = await supabase
        .from("customers")
        .select("*")
        .or(`phone.eq.${cleanPhone},email.eq.${cleanEmail}`)
        .maybeSingle();

      if (existingCust) {
        await supabase
          .from("customers")
          .update({
            name: fullName.trim(),
            address: fullAddressText,
            phone: cleanPhone,
            total_orders: (existingCust.total_orders || 0) + 1,
            total_spent: Number(existingCust.total_spent || 0) + Number(totalPrice || 0),
          })
          .eq("id", existingCust.id);
      } else {
        await supabase.from("customers").insert([
          {
            name: fullName.trim(),
            phone: cleanPhone,
            address: fullAddressText,
            email: cleanEmail,
            total_orders: 1,
            total_spent: Number(totalPrice || 0),
          },
        ]);
      }
    } catch (err) {
      console.warn("Exception lors de l'enregistrement de la commande/client:", err);
    }

    // Déclenchement automatique des notifications WhatsApp OpenWA en tâche de fond (Client + Admin)
    dispatchOrderCreatedWhatsAppNotifications({
      order_number: orderNumber,
      customer_name: fullName.trim(),
      customer_phone: phone.trim(),
      customer_address: fullAddressText,
      total_amount: totalPrice,
      items: activeItems.map((it) => ({
        name: `${maison} — ${parfumName}`,
        size: it.sizeLabel,
        quantity: it.quantity,
        price: it.unitPrice,
      })),
    }).catch((err) => {
      console.warn("Notification WhatsApp auto info:", err);
    });

    // Mémorisation de l'état de complétion
    setCompletedOrder({
      orderNumber,
      customerName: fullName.trim(),
      customerPhone: phone.trim(),
      customerAddress: fullAddressText,
      totalPrice,
      items: [...activeItems],
    });

    setIsSubmitting(false);
    toast.success(`Commande n° ${orderNumber} validée avec succès !`);
  };

  const handleResetForm = () => {
    setCompletedOrder(null);
    setFullName("");
    setPhone("");
    setAddress("");
  };

  if (outOfStock) {
    const targetPhoneRaw = settings.whatsapp_phone || settings.store_phone || "212752850156";
    const targetWaNumber = targetPhoneRaw.replace(/[^0-9]/g, "") || "212752850156";
    const notifyMsg = `Bonjour, je souhaite être notifié(e) du retour en stock du parfum : ${maison} — ${parfumName}`;
    const notifyUrl = `https://wa.me/${targetWaNumber}?text=${encodeURIComponent(notifyMsg)}`;

    return (
      <div className="relative overflow-hidden bg-card/90 backdrop-blur-md border-2 border-border/80 rounded-2xl p-5 space-y-4 shadow-xl text-center animate-in fade-in zoom-in-95">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
          <AlertCircle className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[10px] uppercase tracking-widest text-destructive font-bold bg-destructive/10 border border-destructive/20 px-2.5 py-0.5 rounded-full">
            Indisponible à la commande
          </span>
          <h3 className="font-serif text-lg font-bold text-foreground">
            Produit en Rupture de Stock
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Ce parfum est actuellement épuisé. Les commandes pour ce produit sont temporairement suspendues jusqu'au prochain réapprovisionnement.
          </p>
        </div>

        <div className="pt-2 border-t border-border/40">
          <a
            href={notifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full h-11 rounded-full bg-primary/10 border border-primary/40 text-primary hover:bg-primary hover:text-primary-foreground font-semibold text-xs uppercase tracking-wider transition-all duration-300 shadow-xs"
          >
            <Bell className="w-4 h-4" />
            <span>M'alerter du retour en stock</span>
          </a>
        </div>
      </div>
    );
  }

  // ÉCRAN DE CONFIRMATION DE COMMANDE EFFECTUÉE DIRECTEMENT
  if (completedOrder) {
    return (
      <div className="relative overflow-hidden bg-card/95 backdrop-blur-md border-2 border-primary/40 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold block">
            Commande Confirmée
          </span>
          <h3 className="font-serif text-lg sm:text-xl font-bold text-foreground">
            Merci pour votre commande !
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
            Votre commande pour <strong>{maison} — {parfumName}</strong> a été enregistrée avec succès. Notre conciergerie prépare votre flacon pour une expédition rapide sous 24-48h.
          </p>
        </div>

        {/* Bloc Numéro de Commande & Récapitulatif */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                Référence de commande
              </span>
              <span className="font-mono text-sm sm:text-base font-bold text-primary tracking-wide">
                {completedOrder.orderNumber}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleCopyOrderNumber(completedOrder.orderNumber)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-border/80 hover:border-primary/50 text-foreground bg-background/80 transition-colors cursor-pointer"
              title="Copier la référence"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{copiedCode ? "Copié" : "Copier"}</span>
            </button>
          </div>

          <div className="border-t border-border/50 pt-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Total à régler à la livraison :</span>
            <span className="font-bold text-foreground text-sm tracking-tight">
              {formatMAD(completedOrder.totalPrice)}
            </span>
          </div>

          <div className="text-[10.5px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
            <Truck className="w-3.5 h-3.5 text-primary shrink-0" />
            <span>Livraison à {completedOrder.customerAddress}</span>
          </div>
        </div>

        {/* Boutons d'action : Suivi ou Nouvelle commande */}
        <div className="space-y-2 pt-1">
          <Button
            type="button"
            onClick={() => navigate(`/suivi?code=${completedOrder.orderNumber}`)}
            className="w-full h-11 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground uppercase tracking-[0.14em] text-xs font-bold shadow-md hover:shadow-lg transition-all duration-300 gap-2 cursor-pointer"
          >
            <span>Suivre l'état de ma commande</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleResetForm}
            className="w-full h-10 rounded-full border-border/80 hover:bg-secondary/70 text-foreground text-xs font-medium gap-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Commander un autre article</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleDirectOrder}
      className="relative overflow-hidden bg-card/90 backdrop-blur-md border-2 border-primary/40 rounded-2xl p-3.5 sm:p-5 space-y-3 sm:space-y-3.5 shadow-xl transition-all duration-300 hover:border-primary animate-in fade-in zoom-in-95"
    >
      {/* Glow highlight background ornament */}
      <div className="absolute -top-12 -right-12 w-28 h-28 bg-primary/15 rounded-full blur-2xl pointer-events-none" />

      {/* DYNAMICALLY UPDATED FORMAT & PRICE SUMMARY BANNER */}
      <div
        className="bg-primary/10 border border-primary/40 rounded-xl p-2.5 sm:p-3 flex flex-row items-center justify-between gap-2 animate-in fade-in duration-300"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
            <div className="flex items-center gap-1 flex-wrap">
              {activeItems.length > 0 ? (
                activeItems.map((it, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-primary bg-primary/15 px-2 py-0.5 rounded-md truncate"
                  >
                    {it.sizeLabel} × {it.quantity}
                  </span>
                ))
              ) : (
                <span className="text-[10px] sm:text-xs uppercase tracking-wider font-bold text-destructive">
                  Aucun format sélectionné
                </span>
              )}
            </div>
          </div>
          <p className="text-[9.5px] sm:text-[10px] text-muted-foreground font-light mt-0.5 truncate">
            {maison} — {parfumName}
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-[8.5px] sm:text-[9px] uppercase tracking-wider text-muted-foreground font-semibold block">
            Prix Total
          </span>
          <span className="text-sm sm:text-lg font-bold tracking-tight text-primary">
            {formatMAD(totalPrice)}
          </span>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 pb-2 flex-wrap gap-1">
        <h3 className="font-serif text-xs sm:text-sm font-semibold text-foreground tracking-wide">
          Informations de Livraison
        </h3>

        <span className="text-[8.5px] sm:text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
          <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
          <span>Paiement à la livraison</span>
        </span>
      </div>

      {/* Form Fields */}
      <div className="space-y-2.5">
        {/* Field 1: Nom et Prénom */}
        <div className="space-y-1">
          <Label
            htmlFor="fullName"
            className="text-[10px] sm:text-[11px] font-medium text-foreground/90 flex items-center gap-1"
          >
            <User className="w-3 h-3 text-primary shrink-0" />
            <span>Prénom et Nom</span>
          </Label>
          <Input
            id="fullName"
            type="text"
            required
            placeholder="Ex: Mohamed Alami"
            value={fullName}
            onFocus={() => setFocusedField("fullName")}
            onBlur={() => setFocusedField(null)}
            onChange={(e) => setFullName(e.target.value)}
            className={`h-9.5 text-[13px] sm:text-xs rounded-xl bg-background/80 border-border/80 transition-all ${
              focusedField === "fullName" ? "border-primary ring-2 ring-primary/20" : ""
            }`}
          />
        </div>

        {/* Field 2: Numéro de Téléphone */}
        <div className="space-y-1">
          <Label
            htmlFor="phone"
            className="text-[10px] sm:text-[11px] font-medium text-foreground/90 flex items-center justify-between"
          >
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3 text-primary shrink-0" />
              <span>Numéro de Téléphone</span>
            </span>
            <span className="text-[8.5px] text-muted-foreground font-mono">06 XX XX XX XX</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            required
            placeholder="0600000000"
            value={phone}
            onFocus={() => setFocusedField("phone")}
            onBlur={() => setFocusedField(null)}
            onChange={(e) => setPhone(e.target.value)}
            className={`h-9.5 text-[13px] sm:text-xs rounded-xl bg-background/80 border-border/80 transition-all ${
              focusedField === "phone" ? "border-primary ring-2 ring-primary/20" : ""
            }`}
          />
        </div>

        {/* Field 3: Ville de Destination */}
        <div className="space-y-1 relative" ref={cityWrapperRef}>
          <Label
            htmlFor="city"
            className="text-[10px] sm:text-[11px] font-medium text-foreground/90 flex items-center justify-between"
          >
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3 text-primary shrink-0" />
              <span>Ville de Destination *</span>
            </span>
          </Label>

          {/* Quick city badges */}
          <div className="flex flex-wrap gap-1 pb-1">
            {POPULAR_CITIES.slice(0, 6).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setCity(c);
                  setCityQuery(c);
                  setShowCityDropdown(false);
                }}
                className={`px-2 py-0.5 rounded-md text-[9.5px] sm:text-[10px] font-medium transition-all cursor-pointer ${
                  city.toLowerCase() === c.toLowerCase()
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "bg-secondary/70 text-muted-foreground hover:text-foreground border border-border/50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="relative">
            <Input
              id="city"
              type="text"
              required
              placeholder="Ex: Casablanca, Rabat, Marrakech..."
              value={cityQuery}
              onFocus={() => {
                setFocusedField("city");
                setShowCityDropdown(true);
              }}
              onBlur={() => setFocusedField(null)}
              onChange={(e) => {
                setCityQuery(e.target.value);
                setCity(e.target.value);
                setShowCityDropdown(true);
              }}
              className={`h-9.5 text-[13px] sm:text-xs rounded-xl bg-background/80 border-border/80 transition-all ${
                focusedField === "city" ? "border-primary ring-2 ring-primary/20" : ""
              }`}
            />
          </div>

          {/* City Dropdown */}
          {showCityDropdown && matchingCities.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-xl z-50 p-1 max-h-40 overflow-y-auto space-y-0.5">
              {matchingCities.map((cityName) => (
                <button
                  key={cityName}
                  type="button"
                  onClick={() => {
                    setCity(cityName);
                    setCityQuery(cityName);
                    setShowCityDropdown(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                    city.toLowerCase() === cityName.toLowerCase()
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-foreground hover:bg-secondary/80"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3 h-3 text-primary/70 shrink-0" />
                    <span>{cityName}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Field 4: Adresse de Livraison Précise */}
        <div className="space-y-1">
          <Label
            htmlFor="address"
            className="text-[10px] sm:text-[11px] font-medium text-foreground/90 flex items-center gap-1"
          >
            <MapPin className="w-3 h-3 text-primary shrink-0" />
            <span>Adresse de Livraison Précise *</span>
          </Label>
          <Input
            id="address"
            type="text"
            required
            placeholder="Quartier, Rue, N° Immeuble / Résidence..."
            value={address}
            onFocus={() => setFocusedField("address")}
            onBlur={() => setFocusedField(null)}
            onChange={(e) => setAddress(e.target.value)}
            className={`h-9.5 text-[13px] sm:text-xs rounded-xl bg-background/80 border-border/80 transition-all ${
              focusedField === "address" ? "border-primary ring-2 ring-primary/20" : ""
            }`}
          />
        </div>
      </div>

      {/* ACTION BUTTONS (Ajouter au Panier + Commander Directement) */}
      <div className="space-y-2 pt-1">
        {onAddToCart && (
          <Button
            type="button"
            onClick={onAddToCart}
            className="w-full h-10 sm:h-11 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground uppercase tracking-[0.14em] sm:tracking-[0.18em] text-[11px] font-bold shadow-md hover:shadow-lg hover:shadow-primary/25 border border-primary/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 gap-2 cursor-pointer select-none"
          >
            <ShoppingBag className="w-4 h-4 stroke-[2]" />
            <span>Ajouter au Panier</span>
          </Button>
        )}

        {/* BOUTON COMMANDER DIRECTEMENT */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="relative overflow-hidden group w-full h-11 sm:h-12 rounded-full bg-[#1A1816] hover:bg-[#2B2724] dark:bg-[#C9A96E] dark:hover:bg-[#B8985F] text-[#FAF7F2] dark:text-[#121110] font-bold text-xs sm:text-sm uppercase tracking-[0.14em] sm:tracking-[0.18em] shadow-lg hover:shadow-xl transition-all duration-300 gap-2.5 cursor-pointer disabled:opacity-60 select-none border-0"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Validation de votre commande…</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
              <span>Commander Directement</span>
            </>
          )}
        </Button>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground pt-0.5">
          <Truck className="w-3 h-3 text-primary shrink-0" />
          <span>Livraison express 24–48h partout au Maroc • Paiement à la réception</span>
        </div>
      </div>
    </form>
  );
};

export default ExpressOrderForm;
