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

import { useRef, useEffect } from "react";
import { POPULAR_CITIES, searchMoroccanCities } from "@/data/moroccanCities";

const Checkout = () => {
  const { items, totalItems, subtotal, updateQuantity, removeItem, clear } = useCart();
  const { settings } = useAppSettings();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Casablanca");
  const [cityQuery, setCityQuery] = useState("Casablanca");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const cityWrapperRef = useRef<HTMLDivElement>(null);

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
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const matchingCities = searchMoroccanCities(cityQuery, 10);

  const shippingCost = 0; // Free express delivery throughout Morocco
  const total = subtotal + shippingCost;

  const isFormValid = fullName.trim() !== "" && phone.trim() !== "" && address.trim() !== "" && city.trim() !== "";

  const waRaw = settings.whatsapp_phone || "212752850156";
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

  const processOrderSubmission = async (viaWhatsApp = false) => {
    if (submitting) return;

    if (!isFormValid) {
      toast.error("Veuillez renseigner votre Nom, Téléphone et Adresse de livraison.");
      return;
    }

    setSubmitting(true);
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const orderNumber = `MK-${randomSuffix}`;
    const fullAddressText = `${address.trim()}, ${city}, Maroc`;
    const cleanEmail = `client_${Date.now()}@maisonkenzi.ma`;

    const orderPayload = {
      order_number: orderNumber,
      customer_name: fullName.trim(),
      customer_email: cleanEmail,
      customer_phone: phone.trim(),
      customer_address: fullAddressText,
      total_amount: total,
      status: "en_attente" as const,
      items: items.map((item) => ({
        name: `${item.maison} — ${item.name}`,
        size: SIZE_META[item.size]?.label || item.size,
        quantity: item.quantity,
        price: item.price,
      })),
    };

    try {
      const { error: dbError } = await supabase.from("orders").insert([orderPayload]);
      if (dbError) {
        console.error("Erreur enregistrement commande Supabase:", dbError);
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
            total_spent: Number(existingCust.total_spent || 0) + Number(total || 0),
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
      customer_name: fullName.trim(),
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
      name: fullName.trim(),
      address: fullAddressText,
      phone: phone.trim(),
      items: [...items],
    };

    saveLastOrderNumber(orderNumber);

    if (viaWhatsApp) {
      const url = `https://wa.me/${waNumber}?text=${buildWhatsAppMessage(orderNumber)}`;
      window.open(url, "_blank");
      toast.success("Commande enregistrée et transmise sur WhatsApp !");
    } else {
      toast.success(`Commande n° ${orderNumber} validée avec succès !`);
    }

    setCompleteOrder(completedState);
    clear();
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      <Seo
        title="Finaliser ma Commande | Maison Kenzi"
        description="Paiement à la livraison partout au Maroc sous 24-48h. Parfums 100% originaux."
        path="/checkout"
      />
      <Header />

      <main className="flex-1 pt-20 sm:pt-24 pb-20">
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
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Paiement en espèces à la livraison</span>
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
              
              {/* Left Column: Client Delivery Details Form */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-card/80 border border-border/80 rounded-3xl p-5 sm:p-8 space-y-6 shadow-sm">
                  <div className="border-b border-border/60 pb-4 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="font-serif text-xl sm:text-2xl text-foreground font-bold">
                        Détails de Livraison
                      </h2>
                      <p className="text-xs text-muted-foreground font-light mt-0.5">
                        Renseignez vos coordonnées pour l'expédition de votre colis.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20">
                      <CreditCard className="w-3 h-3" />
                      <span>Paiement à la livraison</span>
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
                      <Label htmlFor="phone" className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-primary" /> Numéro de Téléphone (WhatsApp) *
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        required
                        placeholder="06 12 34 56 78"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="h-11 text-xs sm:text-sm rounded-xl bg-background border-border/80 focus:border-primary"
                      />
                    </div>

                    {/* City Autocomplete & Quick Selection from CSV */}
                    <div className="space-y-2 relative" ref={cityWrapperRef}>
                      <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-primary" /> Ville de Destination *
                        </span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {matchingCities.length > 0 && cityQuery ? `${matchingCities.length} résultat(s)` : "330+ villes desservies"}
                        </span>
                      </Label>

                      {/* Top Popular City Quick Badges */}
                      <div className="flex flex-wrap gap-1.5 pb-1">
                        {POPULAR_CITIES.slice(0, 7).map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              setCity(c);
                              setCityQuery(c);
                              setShowCityDropdown(false);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                              city.toLowerCase() === c.toLowerCase()
                                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                                : "bg-secondary/70 text-muted-foreground hover:text-foreground border border-border/60"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>

                      {/* City Search & Auto-complete input */}
                      <div className="relative">
                        <Input
                          id="city"
                          type="text"
                          required
                          placeholder="Rechercher votre ville (ex: Casablanca, Marrakech, Agadir, Nador)..."
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
                      {showCityDropdown && matchingCities.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-card/95 backdrop-blur-xl border border-border rounded-xl shadow-xl z-50 p-1.5 max-h-48 overflow-y-auto space-y-0.5 animate-in fade-in-0 duration-150">
                          {matchingCities.map((cityName) => (
                            <button
                              key={cityName}
                              type="button"
                              onClick={() => {
                                setCity(cityName);
                                setCityQuery(cityName);
                                setShowCityDropdown(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-between cursor-pointer ${
                                city.toLowerCase() === cityName.toLowerCase()
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : "text-foreground hover:bg-secondary/80"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-primary/70 shrink-0" />
                                <span>{cityName}</span>
                              </span>
                              <span className="text-[10px] text-muted-foreground">Maroc</span>
                            </button>
                          ))}
                        </div>
                      )}
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

                  {/* Single Main Order Confirmation Button */}
                  <div className="pt-3">
                    <Button
                      type="button"
                      disabled={submitting}
                      onClick={() => processOrderSubmission(false)}
                      className="w-full h-12.5 rounded-2xl bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg hover:shadow-xl hover:shadow-primary/25 transition-all duration-300 gap-2 cursor-pointer border-0"
                    >
                      <ShieldCheck className="w-5 h-5" />
                      <span>{submitting ? "Validation en cours…" : "Valider la Commande"}</span>
                    </Button>
                  </div>
                </div>
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
                    {items.map((item) => (
                      <div
                        key={`${item.id}-${item.size}`}
                        className="pt-3 first:pt-0 flex items-center gap-3"
                      >
                        {/* Item image */}
                        <div className="w-14 h-14 bg-card border border-border/70 rounded-xl flex items-center justify-center shrink-0 overflow-hidden relative">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[8px] font-serif text-primary/80 text-center px-1 break-all">
                              {item.imageLabel}
                            </span>
                          )}
                        </div>

                        {/* Item details */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[9px] uppercase tracking-widest font-semibold text-primary/80 truncate">
                            {item.maison}
                          </p>
                          <h3 className="text-xs font-serif font-bold text-foreground truncate">
                            {item.name}
                          </h3>
                          <span className="inline-block text-[10px] text-muted-foreground bg-secondary/80 px-1.5 py-0.2 rounded border border-border/50 mt-0.5">
                            {SIZE_META[item.size]?.label || item.size}
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
                    ))}
                  </div>

                  {/* Pricing details */}
                  <div className="border-t border-border/60 pt-4 space-y-2 text-xs">
                    <div className="flex justify-between text-muted-foreground font-light">
                      <span>Sous-total articles</span>
                      <span className="font-semibold text-foreground tracking-tight">{formatMAD(subtotal)}</span>
                    </div>

                    <div className="flex justify-between text-muted-foreground font-light">
                      <span>Livraison</span>
                      <span className="font-medium text-primary text-[11px]">Selon tarif par ville</span>
                    </div>

                    <div className="border-t border-border/60 pt-3 mt-2 space-y-1">
                      <div className="flex justify-between text-xs font-bold text-foreground">
                        <span>Sous-total Panier</span>
                        <span className="text-primary font-bold tracking-tight">{formatMAD(subtotal)}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground italic">
                        * Le total final (avec frais de livraison) vous sera confirmé sur WhatsApp selon votre ville.
                      </p>
                    </div>
                  </div>

                  {/* Reassurance items */}
                  <div className="bg-background/80 border border-border/60 rounded-2xl p-3 space-y-2 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
                      <span>Parfums 100% Authentiques d'origine</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary shrink-0" />
                      <span>Livraison 24–48h avec suivi par téléphone</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary shrink-0" />
                      <span>Paiement en espèces à la livraison</span>
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
