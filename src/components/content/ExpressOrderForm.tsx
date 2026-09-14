/**
 * Formulaire de Commande Directe Multi-Parfums & Express — Maison Kenzi
 *
 * Permet au client de passer commande directement et instantanément pour les formats sélectionnés
 * et d'ajouter d'autres parfums du catalogue dans une même commande sans passer par WhatsApp.
 * Enregistre la commande dans Supabase, déclenche l'automatisation de notification en arrière-plan
 * et affiche un récapitulatif élégant avec lien de suivi direct.
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatMAD, SIZE_META } from "@/lib/sizes";
import { toast } from "sonner";
import {
  User,
  Phone,
  MapPin,
  Sparkles,
  CheckCircle2,
  ShoppingBag,
  AlertCircle,
  Building2,
  ShieldCheck,
  Truck,
  Loader2,
  ArrowRight,
  RotateCcw,
  Copy,
  Check,
  Plus,
  Minus,
  Trash2,
  Search,
  X,
  PlusCircle,
  Globe,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useCountries } from "@/hooks/useCountries";
import { COUNTRIES, POPULAR_DESTINATIONS, searchDestinations } from "@/data/destinations";
import { useAppSettings } from "@/hooks/useAppSettings";
import { saveLastOrderNumber } from "@/hooks/useOrderTracking";
import { dispatchOrderCreatedWhatsAppNotifications } from "@/services/whatsappService";
import { useParfums } from "@/hooks/useParfums";
import { getPrimaryImage } from "@/lib/productImages";
import type { Parfum } from "@/types/database";
import { useLanguage } from "@/contexts/LanguageContext";
import { getProductGender, getProductName } from "@/lib/productLocalization";
import { StripePaymentSection } from "@/components/checkout/StripePaymentSection";

export interface OrderSelectionItem {
  size: string;
  sizeLabel: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  parfumName?: string;
  maison?: string;
  imageUrl?: string;
}

export interface ExtraOrderItem {
  id: string;
  parfumId: string;
  parfumName: string;
  maison: string;
  size: string;
  sizeLabel: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  imageUrl?: string;
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
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { settings } = useAppSettings();
  const { data: parfums = [] } = useParfums();

  const { countries, getCities } = useCountries();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Maroc");
  const [countryQuery, setCountryQuery] = useState("Maroc");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryWrapperRef = useRef<HTMLDivElement>(null);

  const [city, setCity] = useState("Casablanca");
  const [cityQuery, setCityQuery] = useState("Casablanca");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityWrapperRef = useRef<HTMLDivElement>(null);

  const [address, setAddress] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // État d'ajout multi-parfums à la commande directe
  const [extraItems, setExtraItems] = useState<ExtraOrderItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchCatalogQuery, setSearchCatalogQuery] = useState("");
  const [selectedAddParfum, setSelectedAddParfum] = useState<Parfum | null>(null);
  const [selectedAddSize, setSelectedAddSize] = useState<string>("10ml");
  const [selectedAddQty, setSelectedAddQty] = useState<number>(1);

  // État de confirmation de commande réussie
  const [completedOrder, setCompletedOrder] = useState<{
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    totalPrice: number;
    items: Array<{ name: string; size: string; quantity: number; price: number; subtotal: number }>;
  } | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cityWrapperRef.current && !cityWrapperRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
      }
      if (countryWrapperRef.current && !countryWrapperRef.current.contains(event.target as Node)) {
        setShowCountryDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtrage des pays issus de l'API REST Countries
  const filteredCountries = useMemo(() => {
    if (!countryQuery || countryQuery.trim() === "") return countries.slice(0, 12);
    const q = countryQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [countries, countryQuery]);

  // Villes suggérées selon le pays choisi
  const suggestedCities = useMemo(() => {
    return getCities(country, cityQuery, 10);
  }, [country, cityQuery, getCities]);

  const topCitiesForCountry = useMemo(() => {
    return getCities(country, "", 6);
  }, [country, getCities]);

  // Normalisation de la liste des formats sélectionnés du parfum principal
  const activeMainItems: OrderSelectionItem[] = items && items.length > 0
    ? items.filter((i) => i.quantity > 0)
    : sizeLabel && quantity
    ? [
        {
          size: sizeLabel,
          sizeLabel: sizeLabel,
          quantity: quantity,
          unitPrice: totalPrice / quantity,
          subtotal: totalPrice,
          parfumName,
          maison,
        },
      ]
    : [];

  // Total cumulé de la commande (parfum courant + parfums additionnels)
  const cumulativeTotalPrice = useMemo(() => {
    const mainTotal = activeMainItems.reduce((acc, it) => acc + it.subtotal, 0);
    const extraTotal = extraItems.reduce((acc, it) => acc + it.subtotal, 0);
    return mainTotal + extraTotal;
  }, [activeMainItems, extraItems]);

  // Filtrage du catalogue pour l'ajout multi-parfums
  const filteredCatalog = useMemo(() => {
    const list = Array.isArray(parfums) ? parfums : [];
    const q = searchCatalogQuery.trim().toLowerCase();
    if (!q) return list.slice(0, 10);
    return list.filter(
      (p) =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.maison && p.maison.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
    ).slice(0, 15);
  }, [parfums, searchCatalogQuery]);

  const handleCopyOrderNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedCode(true);
    toast.success("Numéro de commande copié dans le presse-papier !");
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Ajout d'un parfum supplémentaire à la commande en cours
  const handleConfirmAddExtraParfum = () => {
    if (!selectedAddParfum) return;

    let unitPrice = selectedAddParfum.price_10ml || 100;
    let sizeLabel = "10 ml";
    if (selectedAddSize === "5ml") {
      unitPrice = selectedAddParfum.price_5ml || 60;
      sizeLabel = "5 ml";
    } else if (selectedAddSize === "full") {
      unitPrice = selectedAddParfum.full_bottle_price || selectedAddParfum.price_10ml * 4 || 400;
      const parts: string[] = [];
      if (selectedAddParfum.weight_value) parts.push(`${selectedAddParfum.weight_value} ${selectedAddParfum.weight_unit || "g"}`);
      if (selectedAddParfum.volume_value) parts.push(`${selectedAddParfum.volume_value} ${selectedAddParfum.volume_unit || "ml"}`);
      sizeLabel = parts.length > 0
        ? parts.join(" • ")
        : (selectedAddParfum.full_bottle_volume_ml ? `${selectedAddParfum.full_bottle_volume_ml} ml` : "Flacon complet");
    }

    const newItem: ExtraOrderItem = {
      id: `extra_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      parfumId: selectedAddParfum.id,
      parfumName: selectedAddParfum.name,
      maison: selectedAddParfum.maison,
      size: selectedAddSize,
      sizeLabel,
      quantity: selectedAddQty,
      unitPrice,
      subtotal: unitPrice * selectedAddQty,
      imageUrl: getPrimaryImage(selectedAddParfum) || undefined,
    };

    setExtraItems((prev) => [...prev, newItem]);
    toast.success(`${selectedAddParfum.name} (${sizeLabel}) ajouté à votre commande !`);
    setSelectedAddParfum(null);
    setSelectedAddQty(1);
    setShowAddModal(false);
  };

  const handleRemoveExtraItem = (id: string) => {
    setExtraItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateExtraQty = (id: string, delta: number) => {
    setExtraItems((prev) =>
      prev
        .map((it) => {
          if (it.id === id) {
            const newQty = it.quantity + delta;
            if (newQty <= 0) return null;
            return {
              ...it,
              quantity: newQty,
              subtotal: it.unitPrice * newQty,
            };
          }
          return it;
        })
        .filter(Boolean) as ExtraOrderItem[]
    );
  };

    const isFormValid = Boolean(
      fullName.trim() !== "" &&
        phone.trim() !== "" &&
        city.trim() !== "" &&
        address.trim() !== ""
    );

    const validateFormBeforePayPal = (): boolean => {
      if (outOfStock && extraItems.length === 0) {
        toast.error("Ce produit est actuellement en rupture de stock.");
        return false;
      }
      if (!fullName.trim()) {
        toast.error("Veuillez saisir votre Nom & Prénom");
        return false;
      }
      if (!phone.trim()) {
        toast.error("Veuillez saisir votre numéro de téléphone");
        return false;
      }
      if (!city.trim()) {
        toast.error("Veuillez sélectionner votre ville");
        return false;
      }
      if (!address.trim()) {
        toast.error("Veuillez saisir votre adresse de livraison");
        return false;
      }
      return true;
    };

    const handleStripePaymentSuccess = async (details: {
      paymentIntentId?: string;
      payerName?: string;
      payerEmail?: string;
    }) => {
      const allItemsToOrder: Array<{
        name: string;
        size: string;
        quantity: number;
        price: number;
        subtotal: number;
      }> = [
        ...activeMainItems.map((it) => ({
          name: `${maison} — ${parfumName}`,
          size: it.sizeLabel,
          quantity: it.quantity,
          price: it.unitPrice,
          subtotal: it.subtotal,
        })),
        ...extraItems.map((it) => ({
          name: `${it.maison} — ${it.parfumName}`,
          size: it.sizeLabel,
          quantity: it.quantity,
          price: it.unitPrice,
          subtotal: it.subtotal,
        })),
      ];

      if (allItemsToOrder.length === 0) {
        toast.error("Veuillez sélectionner au moins un format ou parfum pour commander");
        setIsSubmitting(false);
        return;
      }

      const randomSuffix = Math.floor(100000 + Math.random() * 900000);
      const orderNumber = `MK-${randomSuffix}`;
      const customerFinalName = fullName.trim() || details.payerName || "Client Maison Kenzi";
      const cleanEmail =
        details.payerEmail ||
        `${customerFinalName.toLowerCase().replace(/[^a-z0-9]/g, "") || "client"}@client.maisonkenzi.ma`;
      const fullAddressText = `${address.trim()}, ${city.trim()}, ${country}`;
      saveLastOrderNumber(orderNumber);

      // Enregistrement de la commande dans Supabase
      try {
        const { data, error: dbError } = await supabase.from("orders").insert([
          {
            order_number: orderNumber,
            customer_name: customerFinalName,
            customer_email: cleanEmail,
            customer_phone: phone.trim(),
            customer_address: fullAddressText,
            total_amount: cumulativeTotalPrice,
            status: "en_attente",
            notes: `Commande express validée en ligne (Stripe — Réf: ${details.paymentIntentId || "Payé"})`,
            items: allItemsToOrder,
          },
        ]);

        if (dbError) {
          console.error("Erreur enregistrement commande Supabase:", dbError);
          toast.error("Erreur d'enregistrement de la commande", {
            description: dbError.message,
          });
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
              name: customerFinalName,
              address: fullAddressText,
              phone: cleanPhone,
              total_orders: (existingCust.total_orders || 0) + 1,
              total_spent: Number(existingCust.total_spent || 0) + Number(cumulativeTotalPrice || 0),
            })
            .eq("id", existingCust.id);
        } else {
          await supabase.from("customers").insert([
            {
              name: customerFinalName,
              phone: cleanPhone,
              address: fullAddressText,
              email: cleanEmail,
              total_orders: 1,
              total_spent: Number(cumulativeTotalPrice || 0),
            },
          ]);
        }
      } catch (err) {
        console.warn("Exception lors de l'enregistrement de la commande/client:", err);
      }

      // Déclenchement automatique des notifications WhatsApp OpenWA en tâche de fond (Client + Admin)
      dispatchOrderCreatedWhatsAppNotifications({
        order_number: orderNumber,
        customer_name: customerFinalName,
        customer_phone: phone.trim(),
        customer_address: fullAddressText,
        total_amount: cumulativeTotalPrice,
        items: allItemsToOrder,
      }).catch((err) => {
        console.warn("Notification WhatsApp auto info:", err);
      });

      // Mémorisation de l'état de complétion
      setCompletedOrder({
        orderNumber,
        customerName: customerFinalName,
        customerPhone: phone.trim(),
        customerAddress: fullAddressText,
        totalPrice: cumulativeTotalPrice,
        items: allItemsToOrder,
      });

      setIsSubmitting(false);
      toast.success(`Paiement validé avec succès ! Commande n° ${orderNumber} confirmée.`);
    };

  const handleResetForm = () => {
    setCompletedOrder(null);
    setExtraItems([]);
    setFullName("");
    setPhone("");
    setAddress("");
  };

  if (outOfStock && extraItems.length === 0) {
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
            Ce parfum est actuellement épuisé. Vous pouvez toutefois ajouter d'autres parfums disponibles à votre commande.
          </p>
        </div>

        <div className="pt-2 border-t border-border/40">
          <Button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="w-full h-10 rounded-full bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-xs uppercase tracking-wider transition-all duration-300 gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Commander d'autres parfums du catalogue</span>
          </Button>
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
            Votre commande contenant <strong>{completedOrder.items.length} article{completedOrder.items.length > 1 ? "s" : ""}</strong> a été enregistrée avec succès. Notre conciergerie prépare vos flacons pour une expédition rapide sous 24-48h.
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

          {/* Liste détaillée des parfums commandés */}
          <div className="divide-y divide-border/40 max-h-36 overflow-y-auto text-xs pr-1">
            {completedOrder.items.map((it, idx) => (
              <div key={idx} className="py-1.5 flex justify-between items-center text-[11px]">
                <div className="truncate pr-2">
                  <span className="font-semibold text-foreground">{it.name}</span>
                  <span className="text-muted-foreground ml-1.5">({it.size} × {it.quantity})</span>
                </div>
                <span className="font-medium text-primary shrink-0">{formatMAD(it.subtotal)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-border/50 pt-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-semibold">Total réglé en ligne :</span>
            <span className="font-bold text-foreground text-sm sm:text-base tracking-tight text-primary">
              {formatMAD(completedOrder.totalPrice)}
            </span>
          </div>

          <div className="text-[10.5px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
            <Truck className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="truncate">Livraison à {completedOrder.customerAddress}</span>
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
            <span>Passer une nouvelle commande</span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <form
        onSubmit={(e) => e.preventDefault()}
        className="relative overflow-hidden bg-card/90 backdrop-blur-md border-2 border-primary/40 rounded-2xl p-3.5 sm:p-5 space-y-3 sm:space-y-3.5 shadow-xl transition-all duration-300 hover:border-primary animate-in fade-in zoom-in-95"
      >
        {/* Glow highlight background ornament */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-primary/15 rounded-full blur-2xl pointer-events-none" />

        {/* DYNAMICALLY UPDATED FORMAT & PRICE SUMMARY BANNER */}
        <div className="bg-primary/10 border border-primary/40 rounded-xl p-2.5 sm:p-3 space-y-2 animate-in fade-in duration-300">
          <div className="flex flex-row items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 animate-pulse" />
                <div className="flex items-center gap-1 flex-wrap">
                  {activeMainItems.length > 0 ? (
                    activeMainItems.map((it, idx) => (
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
                {t.expressOrder.summary}
              </span>
              <span className="text-sm sm:text-lg font-bold tracking-tight text-primary">
                {formatMAD(cumulativeTotalPrice)}
              </span>
            </div>
          </div>

          {/* LISTE DES PARFUMS SUPPLÉMENTAIRES AJOUTÉS */}
          {extraItems.length > 0 && (
            <div className="border-t border-primary/20 pt-2 space-y-1.5">
              <span className="text-[9px] uppercase tracking-wider font-semibold text-primary block">
                {t.expressOrder.extraTitle}
              </span>
              <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                {extraItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 bg-background/80 border border-border/60 rounded-lg p-1.5 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.parfumName}
                          className="w-7 h-7 rounded object-cover border shrink-0"
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold text-foreground truncate">
                          {item.maison} — {item.parfumName}
                        </p>
                        <p className="text-[9px] text-muted-foreground">
                          {item.sizeLabel} • {formatMAD(item.unitPrice)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="flex items-center border border-border rounded-md bg-card">
                        <button
                          type="button"
                          onClick={() => handleUpdateExtraQty(item.id, -1)}
                          className="w-5 h-5 flex items-center justify-center hover:bg-muted text-foreground cursor-pointer"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="px-1 text-[10px] font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateExtraQty(item.id, 1)}
                          className="w-5 h-5 flex items-center justify-center hover:bg-muted text-foreground cursor-pointer"
                        >
                          <Plus size={10} />
                        </button>
                      </div>

                      <span className="text-[11px] font-bold text-primary w-14 text-right">
                        {formatMAD(item.subtotal)}
                      </span>

                      <button
                        type="button"
                        onClick={() => handleRemoveExtraItem(item.id)}
                        className="text-muted-foreground hover:text-destructive p-1 cursor-pointer transition-colors"
                        title="Retirer ce parfum"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bouton pour ajouter un autre parfum à cette commande */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:text-primary-hover transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{t.expressOrder.addExtra}</span>
            </button>
          </div>
        </div>

        {/* Header Livraison */}
        <div className="flex items-center justify-between border-b border-border/50 pb-2 flex-wrap gap-1">
          <h3 className="font-serif text-xs sm:text-sm font-semibold text-foreground tracking-wide">
            {t.expressOrder.deliveryInfo}
          </h3>

          <span className="text-[8.5px] sm:text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
            <span>{t.common.securePayment}</span>
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
              <span>{t.expressOrder.fullName}</span>
            </Label>
            <Input
              id="fullName"
              type="text"
              required
              placeholder={t.expressOrder.fullNamePlaceholder}
              value={fullName}
              onFocus={() => setFocusedField("fullName")}
              onBlur={() => setFocusedField(null)}
              onChange={(e) => setFullName(e.target.value)}
              className={`h-9.5 text-[13px] sm:text-xs rounded-xl bg-background/80 border-border/80 transition-all ${
                focusedField === "fullName" ? "border-primary ring-2 ring-primary/20" : ""
              }`}
            />
          </div>

          {/* Field 2: Numéro de Téléphone avec Indicatif */}
          <div className="space-y-1">
            <Label
              htmlFor="phone"
              className="text-[10px] sm:text-[11px] font-medium text-foreground/90 flex items-center justify-between"
            >
              <span className="flex items-center gap-1">
                <Phone className="w-3 h-3 text-primary shrink-0" />
                <span>{t.expressOrder.phone}</span>
              </span>
              <span className="text-[8.5px] text-primary font-mono font-medium">{t.expressOrder.phoneHelper}</span>
            </Label>
            <div className="relative">
              <Input
                id="phone"
                type="tel"
                required
                placeholder={t.expressOrder.phonePlaceholder}
                value={phone}
                onFocus={() => setFocusedField("phone")}
                onBlur={() => setFocusedField(null)}
                onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ""))}
                className={`h-9.5 text-[13px] sm:text-xs rounded-xl bg-background/80 border-border/80 transition-all ${
                  focusedField === "phone" ? "border-primary ring-2 ring-primary/20" : ""
                }`}
              />
            </div>
          </div>

          {/* Field 3 & 4 (Côte à côte): Destination (Pays REST Countries) & Ville */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Colonne 1: Destination / Pays (API REST Countries) */}
            <div className="space-y-1 relative" ref={countryWrapperRef}>
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="country"
                  className="text-[10px] sm:text-[11px] font-medium text-foreground/90 flex items-center gap-1"
                >
                  <Globe className="w-3 h-3 text-primary shrink-0" />
                  <span>{t.expressOrder.country}</span>
                </Label>
              </div>

              <div className="relative">
                <Input
                  id="country"
                  type="text"
                  required
                  placeholder={t.expressOrder.countryPlaceholder}
                  value={countryQuery}
                  onFocus={() => {
                    setFocusedField("country");
                    setShowCountryDropdown(true);
                  }}
                  onBlur={() => setFocusedField(null)}
                  onChange={(e) => {
                    setCountryQuery(e.target.value);
                    setCountry(e.target.value);
                    setShowCountryDropdown(true);
                  }}
                  className={`h-9.5 text-[13px] sm:text-xs rounded-xl bg-background/80 border-border/80 transition-all ${
                    focusedField === "country" ? "border-primary ring-2 ring-primary/20" : ""
                  }`}
                />
              </div>

              {/* Dropdown Pays (REST Countries filtré Maroc & Europe) */}
              {showCountryDropdown && filteredCountries.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-xl z-50 p-1 max-h-48 overflow-y-auto space-y-0.5">
                  {filteredCountries.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setCountry(c.name);
                        setCountryQuery(c.name);
                        setShowCountryDropdown(false);
                        const cCities = getCities(c.name);
                        if (cCities && cCities.length > 0) {
                          setCity(cCities[0]);
                          setCityQuery(cCities[0]);
                        }
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        (country || "").toLowerCase() === c.name.toLowerCase()
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-secondary/80"
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span className="font-medium">{c.name}</span>
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">{c.code}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Raccourcis rapides pays */}
              <div className="flex flex-wrap gap-1 pt-0.5">
                {["Maroc", "France", "Belgique", "Suisse", "Espagne"].map((cName) => (
                  <button
                    key={cName}
                    type="button"
                    onClick={() => {
                      setCountry(cName);
                      setCountryQuery(cName);
                      setShowCountryDropdown(false);
                      const cCities = getCities(cName);
                      if (cCities && cCities.length > 0) {
                        setCity(cCities[0]);
                        setCityQuery(cCities[0]);
                      }
                    }}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all cursor-pointer ${
                      country === cName
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "bg-secondary/60 text-muted-foreground hover:text-foreground border border-border/40"
                    }`}
                  >
                    {cName}
                  </button>
                ))}
              </div>
            </div>

            {/* Colonne 2: Ville de Livraison */}
            <div className="space-y-1 relative" ref={cityWrapperRef}>
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="city"
                  className="text-[10px] sm:text-[11px] font-medium text-foreground/90 flex items-center gap-1"
                >
                  <Building2 className="w-3 h-3 text-primary shrink-0" />
                  <span>{t.expressOrder.city}</span>
                </Label>
              </div>

              <div className="relative">
                <Input
                  id="city"
                  type="text"
                  required
                  placeholder={t.expressOrder.cityPlaceholder}
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

              {/* Dropdown Villes */}
              {showCityDropdown && suggestedCities.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-xl z-50 p-1 max-h-48 overflow-y-auto space-y-0.5">
                  {suggestedCities.map((cityName) => (
                    <button
                      key={cityName}
                      type="button"
                      onClick={() => {
                        setCity(cityName);
                        setCityQuery(cityName);
                        setShowCityDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                        (city || "").toLowerCase() === cityName.toLowerCase()
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

              {/* Raccourcis villes pour le pays sélectionné */}
              <div className="flex flex-wrap gap-1 pt-0.5">
                {topCitiesForCountry.slice(0, 4).map((cityName) => (
                  <button
                    key={cityName}
                    type="button"
                    onClick={() => {
                      setCity(cityName);
                      setCityQuery(cityName);
                      setShowCityDropdown(false);
                    }}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition-all cursor-pointer ${
                      (city || "").toLowerCase() === cityName.toLowerCase()
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "bg-secondary/50 text-muted-foreground hover:text-foreground border border-border/40"
                    }`}
                  >
                    {cityName}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Field 4: Adresse de Livraison Précise */}
          <div className="space-y-1">
            <Label
              htmlFor="address"
              className="text-[10px] sm:text-[11px] font-medium text-foreground/90 flex items-center gap-1"
            >
              <MapPin className="w-3 h-3 text-primary shrink-0" />
              <span>{t.expressOrder.address}</span>
            </Label>
            <Input
              id="address"
              type="text"
              required
              placeholder={t.expressOrder.addressPlaceholder}
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
              <span>{t.product.addToBag}</span>
            </Button>
          )}

          {/* SECTION DE PAIEMENT EN LIGNE SÉCURISÉ STRIPE (CARTE & APPLE PAY) */}
          <div className="pt-2">
            <StripePaymentSection
              total={cumulativeTotalPrice}
              customerName={fullName.trim()}
              customerEmail={phone.trim() ? undefined : "client@maisonkenzi.ma"}
              isFormValid={isFormValid}
              onValidateForm={validateFormBeforePayPal}
              onPaymentSuccess={handleStripePaymentSuccess}
            />
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground pt-0.5">
            <ShieldCheck className="w-3 h-3 text-primary shrink-0" />
            <span>{t.common.securePayment} • {t.common.noReturnPolicy}</span>
          </div>
        </div>
      </form>

      {/* MODALE D'AJOUT MULTI-PARFUMS AU PANIER DIRECT (Z-INDEX 120 AU-DESSUS DE LA NAVBAR) */}
      {showAddModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-card border border-border/90 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="font-serif text-base sm:text-lg font-bold text-foreground">
                  Ajouter un autre parfum à votre commande
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  Sélectionnez les fragrances à regrouper dans votre livraison
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedAddParfum(null);
                }}
                className="w-8 h-8 rounded-full border flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Barre de recherche */}
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="text"
                placeholder="Rechercher par nom, maison..."
                value={searchCatalogQuery}
                onChange={(e) => setSearchCatalogQuery(e.target.value)}
                className="pl-9 h-10 text-xs rounded-xl bg-background"
                autoFocus
              />
            </div>

            {/* Liste des parfums ou configuration du parfum sélectionné */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[200px]">
              {selectedAddParfum ? (
                <div className="bg-primary/5 border border-primary/30 rounded-2xl p-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={getPrimaryImage(selectedAddParfum) || "/placeholder.svg"}
                      alt={selectedAddParfum.name}
                      className="w-14 h-14 rounded-xl object-cover border"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-primary tracking-wider block">
                        {selectedAddParfum.maison}
                      </span>
                      <h4 className="font-serif font-bold text-sm text-foreground truncate">
                        {getProductName(selectedAddParfum, language)}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedAddParfum.category || getProductGender(selectedAddParfum.gender, language)}
                      </p>
                    </div>
                  </div>

                  {/* Choix du format */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-foreground uppercase tracking-wider block">
                      {language === "en" ? "Desired format :" : "Format souhaité :"}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedAddParfum.price_5ml > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedAddSize("5ml")}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedAddSize === "5ml"
                              ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                              : "bg-background border-border hover:border-primary/40 text-foreground"
                          }`}
                        >
                          <span className="text-[11px] block">Format 5 ml</span>
                          <span className="text-xs font-semibold">{formatMAD(selectedAddParfum.price_5ml)}</span>
                        </button>
                      )}

                      {selectedAddParfum.price_10ml > 0 && (
                        <button
                          type="button"
                          onClick={() => setSelectedAddSize("10ml")}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedAddSize === "10ml"
                              ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                              : "bg-background border-border hover:border-primary/40 text-foreground"
                          }`}
                        >
                          <span className="text-[11px] block">Format 10 ml</span>
                          <span className="text-xs font-semibold">{formatMAD(selectedAddParfum.price_10ml)}</span>
                        </button>
                      )}

                      {selectedAddParfum.full_bottle_price && (
                        <button
                          type="button"
                          onClick={() => setSelectedAddSize("full")}
                          className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedAddSize === "full"
                              ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                              : "bg-background border-border hover:border-primary/40 text-foreground"
                          }`}
                        >
                          <span className="text-[11px] block">
                            {selectedAddParfum.weight_value
                              ? `${selectedAddParfum.weight_value} ${selectedAddParfum.weight_unit || "g"}`
                              : selectedAddParfum.volume_value
                              ? `${selectedAddParfum.volume_value} ${selectedAddParfum.volume_unit || "ml"}`
                              : selectedAddParfum.full_bottle_volume_ml
                              ? `${selectedAddParfum.full_bottle_volume_ml} ml`
                              : "Flacon complet"}
                          </span>
                          <span className="text-xs font-semibold">{formatMAD(selectedAddParfum.full_bottle_price)}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Choix quantité */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-semibold text-foreground">Quantité :</span>
                    <div className="flex items-center border rounded-full bg-background px-2 py-0.5">
                      <button
                        type="button"
                        onClick={() => setSelectedAddQty((q) => Math.max(1, q - 1))}
                        className="w-6 h-6 flex items-center justify-center hover:text-primary cursor-pointer"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="w-8 text-center text-xs font-bold">{selectedAddQty}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedAddQty((q) => q + 1)}
                        className="w-6 h-6 flex items-center justify-center hover:text-primary cursor-pointer"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Actions validation / retour */}
                  <div className="flex items-center gap-2 pt-2 border-t border-primary/20">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSelectedAddParfum(null)}
                      className="flex-1 text-xs"
                    >
                      Choisir un autre
                    </Button>
                    <Button
                      type="button"
                      onClick={handleConfirmAddExtraParfum}
                      className="flex-1 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold uppercase tracking-wider"
                    >
                      Valider cet ajout
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filteredCatalog.map((parfumItem) => (
                    <button
                      key={parfumItem.id}
                      type="button"
                      onClick={() => {
                        setSelectedAddParfum(parfumItem);
                        setSelectedAddSize(parfumItem.price_10ml ? "10ml" : "5ml");
                        setSelectedAddQty(1);
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl border border-border/70 hover:border-primary bg-background/80 hover:bg-muted/40 transition-all text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img
                          src={getPrimaryImage(parfumItem) || "/placeholder.svg"}
                          alt={parfumItem.name}
                          className="w-10 h-10 rounded-lg object-cover border shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[9.5px] uppercase font-bold text-primary tracking-wider block">
                            {parfumItem.maison}
                          </span>
                          <h5 className="font-serif font-bold text-xs text-foreground truncate group-hover:text-primary transition-colors">
                            {getProductName(parfumItem, language)}
                          </h5>
                          <span className="text-[10px] text-muted-foreground">
                            {getProductGender(parfumItem.gender, language)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 pl-2">
                        <span className="text-xs font-bold text-primary block">
                          {language === "en" ? "From " : "À partir de "}{formatMAD(parfumItem.price_5ml || parfumItem.price_10ml)}
                        </span>
                        <span className="text-[10px] text-muted-foreground underline group-hover:text-foreground">
                          {language === "en" ? "Select" : "Sélectionner"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ExpressOrderForm;
