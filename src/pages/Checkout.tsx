import { useState } from "react";
import {
  Minus,
  Plus,
  Trash2,
  CheckCircle2,
  User,
  Phone,
  MapPin,
  Sparkles,
  ArrowLeft,
  Truck,
  ShieldCheck,
  CreditCard,
  MessageCircle,
  FileText,
  Clock,
  Send,
  Building2,
  ShoppingBag,
  Lock,
  AlertCircle,
  Globe,
} from "lucide-react";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/store/cart";
import { SIZE_META, formatMAD } from "@/lib/sizes";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAppSettings } from "@/hooks/useAppSettings";
import { saveLastOrderNumber } from "@/hooks/useOrderTracking";
import { dispatchOrderCreatedWhatsAppNotifications } from "@/services/whatsappService";

import { useRef, useEffect, useMemo } from "react";
import { useCountries } from "@/hooks/useCountries";
import { COUNTRIES, searchDestinations, POPULAR_DESTINATIONS } from "@/data/destinations";
import { useLanguage } from "@/contexts/LanguageContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { StripePaymentSection } from "@/components/checkout/StripePaymentSection";
import { usePromo } from "@/contexts/PromoContext";
import { recordPromotionRedemption } from "@/services/promoService";
import { Tag, Loader2, X } from "lucide-react";

const Checkout = () => {
  const { t, language } = useLanguage();
  const { customer, isAuthenticated, openAuthModal } = useCustomerAuth();
  const { items, totalItems, subtotal, updateQuantity, removeItem, clear } = useCart();
  const { appliedPromo, discountAmount, freeShippingApplied, applyPromo, removePromo, recalculateDiscount, isLoading: isPromoLoading } = usePromo();
  const { settings } = useAppSettings();
  const navigate = useNavigate();

  const { countries, getCities } = useCountries();

  const [promoInput, setPromoInput] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);

  // Recalcul de la remise si le sous-total ou les articles changent
  useEffect(() => {
    recalculateDiscount(subtotal, items);
  }, [subtotal, items, recalculateDiscount]);

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Belgique");
  const [countryQuery, setCountryQuery] = useState("Belgique");
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const countryWrapperRef = useRef<HTMLDivElement>(null);

  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Bruxelles");
  const [cityQuery, setCityQuery] = useState("Bruxelles");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityWrapperRef = useRef<HTMLDivElement>(null);

  // Pré-remplissage automatique depuis le profil client connecté
  useEffect(() => {
    if (customer) {
      const name = `${customer.first_name || ""} ${customer.last_name || ""}`.trim();
      if (name) setFullName(name);
      if (customer.phone) setPhone(customer.phone);
      if (customer.address) setAddress(customer.address);
      if (customer.city) {
        setCity(customer.city);
        setCityQuery(customer.city);
      }
      if (customer.country) {
        setCountry(customer.country);
        setCountryQuery(customer.country);
      }
    }
  }, [customer]);

  const [notes, setNotes] = useState("");
  const [completeOrder, setCompleteOrder] = useState<{
    orderNumber: string;
    total: number;
    name: string;
    address: string;
    phone: string;
    items: typeof items;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Close dropdown on outside click
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

  // Filtrage des pays via REST Countries
  const filteredCountries = useMemo(() => {
    if (!countryQuery || countryQuery.trim() === "") return countries.slice(0, 15);
    const q = countryQuery.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    return countries.filter(
      (c) =>
        c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [countries, countryQuery]);

  // Villes suggérées selon le pays choisi
  const suggestedCities = useMemo(() => {
    return getCities(country, cityQuery, 12);
  }, [country, cityQuery, getCities]);

  const topCitiesForCountry = useMemo(() => {
    return getCities(country, "", 6);
  }, [country, getCities]);

  const shippingCost = 0; // Livraison express offerte
  const total = Math.max(0, subtotal - discountAmount + shippingCost);

  const handleApplyPromo = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!promoInput.trim()) return;
    setIsApplyingPromo(true);
    await applyPromo(
      promoInput,
      subtotal,
      items.map((i) => ({ price: i.price, quantity: i.quantity, category: (i as any).category })),
      phone.trim() || customer?.phone || undefined,
      customer?.email || undefined
    );
    setIsApplyingPromo(false);
    setPromoInput("");
  };

  const isFormValid = Boolean(
    isAuthenticated &&
    fullName.trim() !== "" &&
    phone.trim() !== "" &&
    address.trim() !== "" &&
    city.trim() !== ""
  );

  const waRaw = settings.whatsapp_phone || "212652535301";
  const waNumber = waRaw.replace(/[^0-9]/g, "");

  const buildWhatsAppMessage = (orderNum: string) => {
    const lines: string[] = [];
    lines.push(`Bonjour Maison Kenzi,`);
    lines.push("");
    lines.push(`Je souhaite commander (#${orderNum}) :`);
    items.forEach((item) => {
      lines.push(
        `- ${item.maison} - ${item.name} (${SIZE_META[item.size]?.label || item.size}) x${item.quantity}`
      );
    });
    lines.push("");
    lines.push(`Livraison :`);
    lines.push(`- Nom : ${fullName.trim()}`);
    lines.push(`- Tél : ${phone.trim()}`);
    lines.push(`- Ville : ${city.trim()}`);
    lines.push(`- Adresse : ${address.trim()}`);
    if (notes.trim()) {
      lines.push(`- Note : ${notes.trim()}`);
    }
    lines.push("");
    lines.push(`Total produits : ${formatMAD(total)}`);
    lines.push(`Merci de me confirmer le montant total avec la livraison.`);
    return encodeURIComponent(lines.join("\n"));
  };

  const validateFormBeforePayment = (): boolean => {
    if (!isAuthenticated) {
      toast.error("Compte client obligatoire pour commander", {
        description: "Veuillez vous connecter ou créer un compte pour finaliser votre commande.",
      });
      openAuthModal("login");
      return false;
    }
    if (!fullName.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      toast.error("Veuillez renseigner votre Nom, Téléphone, Ville et Adresse de livraison.");
      return false;
    }
    return true;
  };

  const handleStripePaymentSuccess = async (details: {
    paymentIntentId: string;
    payerName?: string;
    payerEmail?: string;
  }) => {
    setSubmitting(true);
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `MK-${randomSuffix}`;
    const fullAddressText = `${address.trim()}, ${city}, ${country}`;
    const cleanEmail = customer?.email || details.payerEmail || `client_${Date.now()}@maisonkenzi.ma`;
    const customerFinalName = fullName.trim() || details.payerName || "Client Maison Kenzi";

    const promoNote = appliedPromo
      ? `\nCode promo appliqué: ${appliedPromo.code} (${appliedPromo.type === "percentage" ? `-${appliedPromo.value}%` : appliedPromo.type === "fixed" ? `-${appliedPromo.value} €` : "Livraison Offerte"}, Remise: -${discountAmount} €)`
      : "";

    const orderPayload = {
      order_number: orderNumber,
      customer_name: customerFinalName,
      customer_email: cleanEmail,
      customer_phone: phone.trim(),
      customer_address: fullAddressText,
      total_amount: total,
      status: "en_attente" as const, // Statut officiel reconnu dans l'enum maisonkenzi.order_status
      notes: `Paiement en ligne validé (Stripe Carte / Apple Pay — Réf: ${details.paymentIntentId})${promoNote}${notes.trim() ? `\nNote client: ${notes.trim()}` : ""
        }`,
      items: items.map((item) => ({
        parfum_id: item.id,
        parfum_name: item.name,
        name: `${item.maison} — ${item.name}`,
        maison: item.maison,
        size: SIZE_META[item.size]?.label || item.size,
        quantity: item.quantity,
        unit_price: item.price,
        price: item.price,
        subtotal: item.price * item.quantity,
      })),
    };

    try {
      const { error: dbError } = await supabase.from("orders").insert([orderPayload]);
      if (dbError) {
        console.error("Erreur enregistrement commande Supabase:", dbError);
        toast.error("Erreur d'enregistrement de la commande", {
          description: dbError.message,
        });
      }

      // Enregistrement de l'utilisation du coupon promotionnel
      if (appliedPromo) {
        recordPromotionRedemption({
          promo_code: appliedPromo.code,
          order_number: orderNumber,
          customer_phone: phone.trim() || customer?.phone || undefined,
          customer_email: cleanEmail || undefined,
          discount_amount: discountAmount,
          order_total: total,
        }).catch((err) => console.warn("Erreur enregistrement promo redemption :", err));
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
            phone: cleanPhone || existingCust.phone,
            total_orders: (existingCust.total_orders || 0) + 1,
            total_spent: Number(existingCust.total_spent || 0) + Number(total || 0),
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
            total_spent: Number(total || 0),
          },
        ]);
      }
    } catch (err) {
      console.warn("Supabase order/customer recording note:", err);
    }

    // Déclenchement automatique des notifications WhatsApp OpenWA (Client + Admin)
    dispatchOrderCreatedWhatsAppNotifications({
      order_number: orderNumber,
      customer_name: customerFinalName,
      customer_phone: phone.trim(),
      total_amount: total,
      shipping_city: city.trim(),
      shipping_address: address.trim(),
      items: items.map((item) => ({
        name: `${item.maison} — ${item.name}`,
        size: SIZE_META[item.size]?.label || item.size,
        quantity: item.quantity,
        price: item.price,
      })),
    }).catch((err) => {
      console.warn("Notification OpenWA auto info:", err);
    });

    const completedState = {
      orderNumber,
      total,
      name: customerFinalName,
      address: fullAddressText,
      phone: phone.trim(),
      items: [...items],
      paymentRef: details.paypalOrderId,
    };

    saveLastOrderNumber(orderNumber);
    toast.success(`Paiement validé avec succès ! Commande n° ${orderNumber} enregistrée.`);
    setCompleteOrder(completedState);
    clear();
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      <Seo
        title="Finaliser ma Commande | Maison Kenzi"
        description="Paiement sécurisé par internet. Parfums 100% originaux scellés et expédition soignée."
        path="/checkout"
      />
      <Header />

      <main className="flex-1 pt-28 sm:pt-32 md:pt-36 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Empty cart state */}
          {items.length === 0 && !completeOrder ? (
            <div className="py-20 text-center space-y-4 max-w-md mx-auto bg-card/50 border border-border/80 rounded-3xl p-8 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <ShoppingBag size={28} />
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl text-foreground font-bold">
                Votre panier est vide
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed">
                Vous n'avez pas encore d'article dans votre panier pour finaliser une commande.
              </p>
              <Button
                asChild
                className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wider text-xs font-semibold h-11 px-8 shadow-md"
              >
                <Link to="/collection/all">Explorer la Collection</Link>
              </Button>
            </div>
          ) : completeOrder ? (
            /* Luxury Order Success Screen */
            <div className="max-w-2xl mx-auto py-8 sm:py-12 space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-card border border-primary/30 rounded-3xl p-6 sm:p-10 text-center space-y-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-primary/10 blur-2xl rounded-full" />

                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto shadow-xs">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-primary font-bold">
                    Commande Validée
                  </span>
                  <h1 className="font-serif text-2xl sm:text-4xl text-foreground font-bold">
                    Merci pour votre confiance, {completeOrder.name} !
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed max-w-lg mx-auto">
                    Votre commande a été enregistrée sous la référence{" "}
                    <span className="font-semibold text-primary">{completeOrder.orderNumber}</span>. Notre équipe prépare votre colis pour expédition sous 24 à 48 heures.
                  </p>
                </div>

                {/* Receipt Card */}
                <div className="bg-background/80 border border-border/80 rounded-2xl p-4 sm:p-6 text-left space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-border/60 text-xs">
                    <div>
                      <span className="text-muted-foreground block text-[10px]">Numéro de commande</span>
                      <span className="font-semibold text-foreground">{completeOrder.orderNumber}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground block text-[10px]">Total à régler</span>
                      <span className="font-bold tracking-tight text-primary text-sm">{formatMAD(completeOrder.total)}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{completeOrder.address}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{completeOrder.phone}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Paiement sécurisé par internet (validé)</span>
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Button
                    asChild
                    className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 text-xs uppercase tracking-wider font-semibold h-11 px-6 shadow-md cursor-pointer gap-2"
                  >
                    <Link to={`/suivi-commande?code=${completeOrder.orderNumber}`}>
                      <Truck className="w-4 h-4" />
                      <span>Suivre ma Commande</span>
                    </Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="rounded-full border-border hover:border-primary text-xs uppercase tracking-wider font-semibold h-11 px-6 cursor-pointer"
                  >
                    <Link to="/">Accueil</Link>
                  </Button>

                  <a
                    href={`https://wa.me/${waNumber}?text=${encodeURIComponent(
                      `Bonjour Maison Kenzi, je souhaite suivre ma commande n° ${completeOrder.orderNumber}.`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs font-semibold uppercase tracking-wider shadow-md transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Assistance WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          ) : (
            /* Checkout Form & Order Summary Grid */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Left Column: Client Delivery Details Form OR Auth Invitation Card */}
              <div className="lg:col-span-7 space-y-6">
                {!isAuthenticated ? (
                  /* CARTE D'AUTHENTIFICATION LUXE QUAND NON CONNECTÉ */
                  <div className="bg-card/90 border border-primary/40 rounded-3xl p-6 sm:p-10 space-y-6 shadow-xl text-center relative overflow-hidden animate-in fade-in-0 duration-300">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-primary/15 blur-2xl rounded-full pointer-events-none" />

                    <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 text-primary flex items-center justify-center mx-auto shadow-inner">
                      <Lock className="w-7 h-7" />
                    </div>

                    <div className="space-y-2 max-w-md mx-auto">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold block">
                        Espace Client Privé
                      </span>
                      <h2 className="font-serif text-2xl sm:text-3xl text-foreground font-light">
                        Connexion Requise pour Commander
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-light">
                        Pour sécuriser votre commande, enregistrer vos adresses et bénéficier d'un suivi sur-mesure de vos extraits de parfum, veuillez vous identifier.
                      </p>
                    </div>

                    {/* Actions de Connexion / Inscription */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 max-w-sm mx-auto">
                      <Button
                        type="button"
                        onClick={() => openAuthModal("login")}
                        className="w-full sm:flex-1 h-12 rounded-2xl bg-foreground text-background hover:bg-foreground/90 uppercase tracking-wider text-xs font-semibold shadow-lg gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <span>Se connecter</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => openAuthModal("register")}
                        className="w-full sm:flex-1 h-12 rounded-2xl border-border/80 hover:border-primary text-foreground uppercase tracking-wider text-xs font-semibold cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Créer un compte
                      </Button>
                    </div>

                    {/* Réassurance Haute Parfumerie */}
                    <div className="pt-6 border-t border-border/50 grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                      <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/30">
                        <Truck className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <p className="text-[11px] font-semibold text-foreground">Livraison Express</p>
                          <p className="text-[10px] text-muted-foreground">Offerte dès 2 articles</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/30">
                        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                        <div>
                          <p className="text-[11px] font-semibold text-foreground">100% Sécurisé</p>
                          <p className="text-[10px] text-muted-foreground">Stripe & Apple Pay</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 p-2 rounded-xl bg-muted/30">
                        <Sparkles className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <p className="text-[11px] font-semibold text-foreground">Suivi Privilège</p>
                          <p className="text-[10px] text-muted-foreground">Notification en direct</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* FORMULAIRE DE LIVRAISON POUR CLIENT CONNECTÉ */
                  <>
                    <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in-0">
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                        <div className="text-xs">
                          <span className="font-semibold text-foreground">
                            Connecté en tant que {customer?.first_name} {customer?.last_name}
                          </span>
                          <span className="text-muted-foreground ml-1.5 font-mono text-[11px]">
                            ({customer?.email})
                          </span>
                        </div>
                      </div>
                      <Link
                        to="/compte"
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Modifier mon profil
                      </Link>
                    </div>

                    <div className="bg-card/80 border border-border/80 rounded-3xl p-5 sm:p-8 space-y-6 shadow-sm">
                      <div className="border-b border-border/60 pb-4 flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <h2 className="font-serif text-xl sm:text-2xl text-foreground font-bold">
                            Détails de Livraison
                          </h2>
                          <p className="text-xs text-muted-foreground font-light mt-0.5">
                            Coordonnées pré-remplies pour l'expédition de votre commande.
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                          <CreditCard className="w-3 h-3" />
                          <span>Paiement Sécurisé Carte & Apple Pay</span>
                        </div>
                      </div>

                  <div className="space-y-4">
                    {/* Full Name */}
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" /> Prénom et Nom complet *
                      </Label>
                      <Input
                        id="fullName"
                        type="text"
                        required
                        placeholder="Ex: Yassine Bennani"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-11 text-xs sm:text-sm rounded-xl bg-background border-border/80 focus:border-primary"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="phone" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-primary" /> Numéro de Téléphone (avec indicatif pays) *
                        </Label>
                        <span className="text-[10px] text-primary font-mono font-medium">Ex: +32 4... / +33 6...</span>
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        placeholder="Ex: +32 478 12 34 56"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/[^0-9+]/g, ""))}
                        className="h-11 text-xs sm:text-sm rounded-xl bg-background border-border/80 focus:border-primary"
                      />
                    </div>

                    {/* Row: Pays (REST Countries) & Ville de Destination Côte à Côte */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Colonne 1: Pays de Destination (API REST Countries) */}
                      <div className="space-y-1.5 relative" ref={countryWrapperRef}>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-primary" /> Pays de Destination *
                          </Label>
                          <span className="text-[10px] text-primary font-medium">REST Countries</span>
                        </div>

                        <div className="relative">
                          <Input
                            id="country"
                            type="text"
                            required
                            placeholder="Rechercher pays (Maroc, France, Belgique...)"
                            value={countryQuery}
                            onFocus={() => setShowCountryDropdown(true)}
                            onChange={(e) => {
                              setCountryQuery(e.target.value);
                              setCountry(e.target.value);
                              setShowCountryDropdown(true);
                            }}
                            className="h-11 text-xs sm:text-sm rounded-xl bg-background border-border/80 focus:border-primary"
                          />
                        </div>

                        {/* Dropdown Pays (REST Countries) */}
                        {showCountryDropdown && filteredCountries.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-xl z-50 p-1.5 max-h-48 overflow-y-auto space-y-0.5 animate-in fade-in-0 duration-150">
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
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${(country || "").toLowerCase() === c.name.toLowerCase()
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : "text-foreground hover:bg-secondary/80"
                                  }`}
                              >
                                <span className="flex items-center gap-2">
                                  <span>{c.name}</span>
                                </span>
                                <span className="text-[10px] text-muted-foreground uppercase font-mono">{c.code}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Top Country Badges */}
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {["Belgique", "France", "Maroc", "Suisse", "Espagne", "Italie"].map((cName) => (
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
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${country === cName
                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "bg-secondary/70 text-muted-foreground hover:text-foreground border border-border/50"
                                }`}
                            >
                              {cName}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Colonne 2: Ville de Destination */}
                      <div className="space-y-1.5 relative" ref={cityWrapperRef}>
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-primary" /> Ville de Destination *
                          </Label>
                          <span className="text-[10px] text-muted-foreground truncate">{country}</span>
                        </div>

                        <div className="relative">
                          <Input
                            id="city"
                            type="text"
                            required
                            placeholder="Ex: Paris, Bruxelles..."
                            value={cityQuery}
                            onFocus={() => setShowCityDropdown(true)}
                            onChange={(e) => {
                              setCityQuery(e.target.value);
                              setCity(e.target.value);
                              setShowCityDropdown(true);
                            }}
                            className="h-11 text-xs sm:text-sm rounded-xl bg-background border-border/80 focus:border-primary pr-8"
                          />
                          {cityQuery && (
                            <button
                              type="button"
                              onClick={() => {
                                setCityQuery("");
                                setCity("");
                                setShowCityDropdown(true);
                              }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs p-1"
                            >
                              ×
                            </button>
                          )}
                        </div>

                        {/* Autocomplete Dropdown List */}
                        {showCityDropdown && suggestedCities.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-xl z-50 p-1.5 max-h-48 overflow-y-auto space-y-0.5 animate-in fade-in-0 duration-150">
                            {suggestedCities.map((cityName) => (
                              <button
                                key={cityName}
                                type="button"
                                onClick={() => {
                                  setCity(cityName);
                                  setCityQuery(cityName);
                                  setShowCityDropdown(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${(city || "").toLowerCase() === cityName.toLowerCase()
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : "text-foreground hover:bg-secondary/80"
                                  }`}
                              >
                                <span className="flex items-center gap-2">
                                  <MapPin className="w-3 h-3 text-primary/70 shrink-0" />
                                  <span>{cityName}</span>
                                </span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Top Cities Badges for Country */}
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {topCitiesForCountry.slice(0, 5).map((cityName) => (
                            <button
                              key={cityName}
                              type="button"
                              onClick={() => {
                                setCity(cityName);
                                setCityQuery(cityName);
                                setShowCityDropdown(false);
                              }}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer ${(city || "").toLowerCase() === cityName.toLowerCase()
                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "bg-secondary/70 text-muted-foreground hover:text-foreground border border-border/50"
                                }`}
                            >
                              {cityName}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="space-y-1.5">
                      <Label htmlFor="address" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-primary" /> Adresse de Livraison Précise *
                      </Label>
                      <Input
                        id="address"
                        type="text"
                        required
                        placeholder="Quartier, N° Immeuble, Rue ou Résidence..."
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="h-11 text-xs sm:text-sm rounded-xl bg-background border-border/80 focus:border-primary"
                      />
                    </div>

                    {/* Delivery Notes */}
                    <div className="space-y-1.5">
                      <Label htmlFor="notes" className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" /> Instructions particulières (Optionnel)
                      </Label>
                      <Textarea
                        id="notes"
                        rows={2}
                        placeholder="Ex: Appeler avant le passage, laisser chez le concierge..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="text-xs sm:text-sm rounded-xl bg-background border-border/80 focus:border-primary resize-none"
                      />
                    </div>
                  </div>

                  {/* Section de Paiement Sécurisé en Ligne Stripe (Cartes & Apple Pay) */}
                  <div className="pt-2">
                    <StripePaymentSection
                      total={total}
                      customerName={fullName.trim()}
                      customerEmail={customer?.email || (phone.trim().includes("@") ? phone.trim() : undefined)}
                      customerPhone={customer?.phone || (!phone.trim().includes("@") && phone.trim() ? phone.trim() : undefined)}
                      customerCountry={country}
                      customerCity={city}
                      customerAddress={address}
                      isFormValid={isFormValid}
                      onValidateForm={validateFormBeforePayment}
                      onPaymentSuccess={handleStripePaymentSuccess}
                    />
                  </div>
                </div>
              </>
            )}
          </div>

              {/* Right Column: Order Summary & Item Rows */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-card/80 border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm sticky top-24 space-y-5">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <h2 className="font-serif text-lg text-foreground font-bold">
                      Récapitulatif de Commande
                    </h2>
                    <span className="text-xs font-serif font-bold text-primary">
                      {totalItems} article{totalItems > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Cart items listing */}
                  <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 divide-y divide-border/40">
                    {items.map((item) => {
                      const itemName = (language === "en" && item.name_en) ? item.name_en : item.name;
                      const itemLabel = (language === "en" && item.imageLabel_en) ? item.imageLabel_en : (item.imageLabel || item.name);
                      return (
                        <div
                          key={`${item.id}-${item.size}`}
                          className="pt-3 first:pt-0 flex items-center gap-3"
                        >
                          {/* Item image */}
                          <div className="w-14 h-14 bg-card border border-border/70 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={itemName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-[8px] font-serif text-primary/80 text-center px-1 break-all">
                                {itemLabel}
                              </span>
                            )}
                          </div>

                          {/* Item details */}
                          <div className="flex-1 min-w-0">
                            <p className="text-[9px] uppercase tracking-widest font-semibold text-primary/80 truncate">
                              {item.maison}
                            </p>
                            <h3 className="text-xs font-serif font-bold text-foreground truncate">
                              {itemName}
                            </h3>
                            <span className="inline-block text-[10px] text-muted-foreground bg-secondary/80 px-1.5 py-0.2 rounded border border-border/50 mt-0.5">
                              {item.sizeLabel || SIZE_META[item.size]?.label || item.size}
                            </span>

                            {/* Stepper */}
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex items-center bg-card border border-border/70 rounded-md overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)}
                                  className="w-5 h-5 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                                  aria-label="Diminuer"
                                >
                                  <Minus size={10} />
                                </button>
                                <span className="px-1.5 text-[11px] font-bold select-none">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)}
                                  className="w-5 h-5 flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                                  aria-label="Augmenter"
                                >
                                  <Plus size={10} />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeItem(item.id, item.size)}
                                className="text-muted-foreground hover:text-destructive p-0.5 cursor-pointer"
                                title="Supprimer"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>

                          {/* Price */}
                          <span className="text-xs font-semibold tracking-tight text-primary shrink-0">
                            {formatMAD(item.price * item.quantity)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Promo Code Input / Active Coupon Card */}
                  <div className="border-t border-border/60 pt-3.5 space-y-2">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-primary" /> Code Promotionnel ou Privilège
                    </Label>

                    {appliedPromo ? (
                      <div className="flex items-center justify-between gap-2 bg-primary/10 border border-primary/30 rounded-xl px-3 py-2.5 text-xs animate-in fade-in duration-200">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center shrink-0">
                            <Tag className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-mono font-bold text-primary uppercase text-xs block truncate">
                              {appliedPromo.code}
                            </span>
                            <span className="text-[10px] text-muted-foreground block truncate">
                              {appliedPromo.description ||
                                (appliedPromo.type === "percentage"
                                  ? `Remise de ${appliedPromo.value}%`
                                  : appliedPromo.type === "fixed"
                                  ? `Remise de ${appliedPromo.value} €`
                                  : "Livraison Offerte")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            {discountAmount > 0 ? `-${formatMAD(discountAmount)}` : "Offert"}
                          </span>
                          <button
                            type="button"
                            onClick={removePromo}
                            className="w-6 h-6 rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive flex items-center justify-center transition-colors cursor-pointer"
                            title="Retirer ce code"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyPromo} className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Input
                            type="text"
                            placeholder="Ex: KENZI10, BIENVENUE15..."
                            value={promoInput}
                            onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                            className="h-10 text-xs font-mono uppercase rounded-xl bg-background border-border/80 focus:border-primary placeholder:normal-case placeholder:font-sans"
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={!promoInput.trim() || isApplyingPromo}
                          className="h-10 px-4 text-xs font-semibold rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          {isApplyingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Appliquer"}
                        </Button>
                      </form>
                    )}
                  </div>

                  {/* Pricing details */}
                  <div className="border-t border-border/60 pt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground font-light">
                      <span>Sous-total articles</span>
                      <span className="font-semibold text-foreground tracking-tight">{formatMAD(subtotal)}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold animate-in fade-in duration-150">
                        <span className="flex items-center gap-1">
                          <Tag className="w-3.5 h-3.5" />
                          <span>Remise ({appliedPromo?.code})</span>
                        </span>
                        <span>-{formatMAD(discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-muted-foreground font-light">
                      <span className="flex items-center gap-1">
                        <Truck className="w-3.5 h-3.5 text-primary" />
                        <span>Livraison Express</span>
                      </span>
                      {shippingCost === 0 || freeShippingApplied ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                          Offerte
                        </span>
                      ) : (
                        <span className="font-semibold text-foreground">{formatMAD(shippingCost)}</span>
                      )}
                    </div>

                    <div className="border-t border-border/60 pt-3 mt-2 space-y-1">
                      <div className="flex justify-between text-sm font-bold text-foreground">
                        <span>Total de la commande</span>
                        <span className="text-primary font-bold tracking-tight text-base">{formatMAD(total)}</span>
                      </div>
                      <p className="text-[10.5px] text-muted-foreground">
                        Taxes et frais d'expédition inclus · Paiement 100% sécurisé
                      </p>
                    </div>
                  </div>

                  {/* Reassurance items */}
                  <div className="bg-background/80 border border-border/60 rounded-2xl p-3.5 space-y-2.5 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                      <span>Parfums 100% Authentiques d'origine scellés</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary shrink-0" />
                      <span>Expédition soignée avec suivi de colis en temps réel</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-primary shrink-0" />
                      <span>Plateforme certifiée Maison Kenzi (Chiffrement SSL)</span>
                    </div>
                    <div className="flex items-center gap-2 text-[10.5px] text-[#A37B34] dark:text-[#C9A96E] pt-1.5 border-t border-border/40 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Vente définitive : aucun retour ni échange (hygiène & authenticité)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
