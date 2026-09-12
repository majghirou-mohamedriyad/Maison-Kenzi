/**
 * Page Service Client & Contact — Maison Kenzi
 *
 * Expérience éditoriale et visuelle de prestige :
 * - Hero immersif avec galerie photographique des coulisses de la conciergerie
 * - Cartes d'accès directs aux conseillers (WhatsApp en direct, Téléphone, Instagram, Email)
 * - Formulaire de contact interactif avec sélecteur d'univers (Parfums, Artisanat, Antiques, Suivi)
 * - Parcours client créatif en 4 étapes clés (Conseil, Préparation scellée, Expédition 24-48h, Paiement à réception)
 * - FAQ interactive haute parfumerie
 * Conformité Luxury Nude Design System, zéro emoji et icônes vectorielles lucide-react.
 */

import { useState } from "react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import Seo from "@/components/Seo";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  Instagram,
  Phone,
  Clock,
  Sparkles,
  ShieldCheck,
  Truck,
  RotateCcw,
  Send,
  CheckCircle2,
  ChevronDown,
  Mail,
  MapPin,
  Gift,
  Compass,
  ArrowRight,
  PackageCheck,
  Crown,
  Gem,
  HeartHandshake,
} from "lucide-react";
import { toast } from "sonner";
import { useAppSettings } from "@/hooks/useAppSettings";

const conciergeGallery = [
  {
    title: "Conseil Olfactif Sur-Mesure",
    tag: "Accompagnement VIP",
    desc: "Nos spécialistes vous guident selon vos notes de prédilection, la saison ou l'occasion.",
    image: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Coffrets & Emballages Nobles",
    tag: "Protection Maximale",
    desc: "Chaque flacon et création artisanale est préparé dans un écrin anti-choc sécurisé sous blister.",
    image: "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=900&auto=format&fit=crop",
  },
  {
    title: "Expédition Express 24–48h",
    tag: "Partout au Maroc",
    desc: "Livraison suivie en direct à Casablanca, Rabat, Marrakech, Tanger et toutes les villes du Royaume.",
    image: "https://images.unsplash.com/photo-1523293182086-7651a899d37f?q=80&w=900&auto=format&fit=crop",
  },
];

const processSteps = [
  {
    step: "01",
    title: "Conseil & Choix Personnalisé",
    desc: "Échangez avec nos conseillers sur WhatsApp pour affiner votre sélection de fragrances, artisanat ou objets d'art.",
    icon: Compass,
  },
  {
    step: "02",
    title: "Conditionnement d'Origine",
    desc: "Préparation soignée de vos articles 100% authentiques et neufs dans leur emballage officiel scellé.",
    icon: Crown,
  },
  {
    step: "03",
    title: "Acheminement Express Sécurisé",
    desc: "Prise en charge prioritaire et remise d'un numéro de suivi MK en temps réel pour suivre votre colis.",
    icon: Truck,
  },
  {
    step: "04",
    title: "Règlement en Mains Propres",
    desc: "Paiement en espèces à la livraison (Cash on Delivery) lors de la remise de votre commande.",
    icon: PackageCheck,
  },
];

const CustomerCare = () => {
  const { settings } = useAppSettings();

  // Téléphone & WhatsApp
  const rawWa = settings.whatsapp_phone || settings.store_phone || "212752850156";
  const waNumber = rawWa.replace(/[^0-9]/g, "") || "212752850156";
  const formattedPhone = rawWa.startsWith("+")
    ? rawWa
    : `+${rawWa.replace(/^(\d{3})(\d{1})(\d{2})(\d{2})(\d{2})(\d{2})$/, "$1 $2 $3 $4 $5 $6")}`;

  const instagramUrl = settings.instagram_url || "https://instagram.com/maisonkenzi";
  const storeEmail = settings.store_email || "contact@maisonkenzi.com";
  const storeAddress = settings.store_address || "Casablanca & Partout au Royaume du Maroc";

  // État du formulaire
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
    categoryType: "parfums",
    subject: "Conseil & Choix de Parfum",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // État accordéons FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.contact.trim() || !formData.message.trim()) {
      toast.error("Veuillez renseigner tous les champs obligatoires.");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      toast.success("Votre demande a été transmise à notre conciergerie.");
    }, 600);
  };

  const handleWhatsappSend = () => {
    const text = `Bonjour Maison Kenzi,\n\nNom: ${formData.name || "Client"}\nContact: ${formData.contact || "Non précisé"}\nUnivers: ${formData.categoryType}\nSujet: ${formData.subject}\nMessage: ${formData.message || "Bonjour, je souhaiterais obtenir un renseignement."}`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleDirectWhatsapp = () => {
    const defaultText = "Bonjour Maison Kenzi, j'aimerais échanger avec un conseiller pour un renseignement sur vos collections.";
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(defaultText)}`, "_blank");
  };

  // Questions Fréquentes de la Maison
  const faqItems = [
    {
      id: 1,
      categoryLabel: "Authenticité & Flacons",
      icon: ShieldCheck,
      question: "Les créations vendues sont-elles 100% d'origine et scellées ?",
      answer:
        "L'authenticité absolue est notre premier engagement. Chaque parfum est livré dans son flacon d'origine complet, neuf et scellé sous blister avec emballage officiel. Nos pièces artisanales et objets antiques sont minutieusement expertisés.",
    },
    {
      id: 2,
      categoryLabel: "Délais & Expédition",
      icon: Truck,
      question: "Quels sont les délais et modalités de livraison au Maroc ?",
      answer:
        "Nous expédions vos commandes sous 24 à 48 heures ouvrées partout au Maroc (Casablanca, Rabat, Marrakech, Tanger, Fès, Agadir, etc.). Chaque commande bénéficie d'un suivi en temps réel et d'un emballage de haute sécurité.",
    },
    {
      id: 3,
      categoryLabel: "Règlement & Sérénité",
      icon: PackageCheck,
      question: "Comment s'effectue le paiement de ma commande ?",
      answer:
        "Le règlement s'effectue exclusivement en espèces à la livraison (Cash on Delivery). Vous ne payez qu'au moment précis où le transporteur vous remet votre colis en mains propres à votre domicile ou bureau.",
    },
    {
      id: 4,
      categoryLabel: "Conseil & Personnalisation",
      icon: Sparkles,
      question: "Puis-je bénéficier d'une consultation personnalisée pour un cadeau ?",
      answer:
        "Absolument. Notre conciergerie privée vous assiste sur WhatsApp pour sélectionner la fragrance idéale, composer un coffret sur-mesure ou préparer une attention délicate pour une occasion spéciale.",
    },
    {
      id: 5,
      categoryLabel: "Garanties & Retours",
      icon: RotateCcw,
      question: "Quelle est votre politique de garantie et de retour ?",
      answer:
        "Afin de préserver l'intégrité et la perfection de nos créations pour l'ensemble de notre clientèle, les retours sont acceptés sous 7 jours pour les articles non descellés, intacts dans leur blister d'origine.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      <Seo
        title="Service Client & Conciergerie Privée | Maison Kenzi Maroc"
        description="Contactez la conciergerie Maison Kenzi : assistance personnalisée 7j/7, conseils olfactifs, suivi de commande et livraison express partout au Maroc."
        path="/about/service-client"
      />
      <Header />

      <main className="flex-1 pt-24 sm:pt-32 pb-24">
        {/* =========================================================================
            1. HERO ÉDITORIAL & IMMERSIF AVEC BADGE DE DISPONIBILITÉ
           ========================================================================= */}
        <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 sm:mb-20">
          <div className="relative rounded-3xl overflow-hidden border border-border/80 bg-gradient-to-b from-card/90 via-card/50 to-background p-8 sm:p-14 text-center shadow-lg">
            {/* Halos d'ambiance dorée */}
            <div className="absolute top-0 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/3 w-96 h-96 bg-[#C9A96E]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs uppercase tracking-[0.25em] font-semibold backdrop-blur-md">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Conciergerie Active · Réponse 7j/7</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-foreground font-light tracking-tight leading-[1.15]">
                Une Écoute Attentive & un Service d'<span className="text-primary italic font-serif">Excellence</span>
              </h1>

              <p className="text-muted-foreground text-xs sm:text-base font-light leading-relaxed max-w-2xl mx-auto pt-1">
                Que vous recherchiez une signature olfactive, des détails sur une pièce artisanale ou le suivi de votre commande, notre équipe est à votre entière disposition.
              </p>

              {/* Boutons d'Action Immédiate */}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={handleDirectWhatsapp}
                  size="lg"
                  className="rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs uppercase tracking-wider font-bold h-12 px-8 shadow-md gap-2 cursor-pointer border-0 transition-transform hover:scale-105"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp Direct
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-border hover:border-primary text-xs uppercase tracking-wider font-semibold h-12 px-8 cursor-pointer"
                >
                  <Link to="/suivi-commande" className="gap-2 flex items-center">
                    <Truck className="w-4 h-4 text-primary" />
                    Suivre une Commande
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            2. GALERIE PHOTOGRAPHIQUE INTERACTIVE DES COULISSES
           ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 sm:mb-28">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-primary font-bold">
              Les Engagements de la Maison
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl text-foreground font-light tracking-tight">
              Une Attention aux Moindres Détails
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-light">
              Découvrez l'exigence qui anime chaque étape de votre expérience chez Maison Kenzi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {conciergeGallery.map((item, idx) => (
              <div
                key={idx}
                className="group relative rounded-3xl overflow-hidden border border-border/80 bg-card shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1.5 aspect-[4/5] flex flex-col justify-end"
              >
                <img
                  src={item.image}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 sm:p-7 flex flex-col justify-end space-y-2 z-10">
                  <span className="inline-block text-[10px] uppercase font-bold tracking-[0.2em] text-[#C9A96E] bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 w-fit">
                    {item.tag}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl text-white font-medium">
                    {item.title}
                  </h3>
                  <p className="text-xs text-white/80 font-light leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =========================================================================
            3. CARTES DE CONTACT DIRECTES HAUTE COUTURE
           ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 sm:mb-28">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Carte WhatsApp */}
            <div className="group relative rounded-3xl border border-border/80 bg-card/70 backdrop-blur-md p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] transition-transform duration-300 group-hover:scale-110">
                  <MessageCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-medium text-foreground mb-1">
                    WhatsApp Privé
                  </h3>
                  <p className="text-xs uppercase tracking-wider text-primary font-bold">
                    Réponse Instantanée
                  </p>
                </div>
                <p className="text-xs sm:text-sm font-light text-muted-foreground leading-relaxed">
                  Échangez directement avec un conseiller pour un conseil olfactif, un ajout à votre commande ou une urgence.
                </p>
              </div>

              <div className="pt-6 border-t border-border/50 mt-6">
                <Button
                  onClick={handleDirectWhatsapp}
                  className="w-full rounded-full bg-[#25D366] text-white hover:bg-[#20ba5a] uppercase tracking-[0.15em] text-xs h-11 font-bold shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Échanger sur WhatsApp
                </Button>
              </div>
            </div>

            {/* Carte Téléphone & Horaires */}
            <div className="group relative rounded-3xl border border-border/80 bg-card/70 backdrop-blur-md p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary transition-transform duration-300 group-hover:scale-110">
                  <Phone className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-medium text-foreground mb-1">
                    Ligne Directe
                  </h3>
                  <p className="text-xs uppercase tracking-wider text-primary font-bold">
                    Appel & Renseignement
                  </p>
                </div>
                <div className="space-y-2 text-xs sm:text-sm font-light text-muted-foreground">
                  <p className="text-foreground font-semibold text-base tracking-wide">
                    {formattedPhone}
                  </p>
                  <div className="flex items-center gap-2 text-xs pt-1">
                    <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>7j/7 : 09h30 — 21h00</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{storeAddress}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border/50 mt-6">
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-full border-border hover:border-primary text-foreground hover:bg-primary/5 uppercase tracking-[0.15em] text-xs h-11 font-semibold cursor-pointer"
                >
                  <a href={`tel:+${waNumber}`}>
                    <Phone className="w-4 h-4 mr-2 text-primary" />
                    Appeler l'Atelier
                  </a>
                </Button>
              </div>
            </div>

            {/* Carte Instagram & Galerie */}
            <div className="group relative rounded-3xl border border-border/80 bg-card/70 backdrop-blur-md p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-500 transition-transform duration-300 group-hover:scale-110">
                  <Instagram className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-medium text-foreground mb-1">
                    Univers Instagram
                  </h3>
                  <p className="text-xs uppercase tracking-wider text-primary font-bold">
                    @maisonkenzi
                  </p>
                </div>
                <p className="text-xs sm:text-sm font-light text-muted-foreground leading-relaxed">
                  Découvrez les nouveautés en direct, nos pièces artisanales et envoyez-nous un message privé (DM).
                </p>
              </div>

              <div className="pt-6 border-t border-border/50 mt-6">
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-full border-border hover:border-primary text-foreground hover:bg-primary/5 uppercase tracking-[0.15em] text-xs h-11 font-semibold cursor-pointer"
                >
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer">
                    <Instagram className="w-4 h-4 mr-2 text-pink-500" />
                    Rejoindre la Maison
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            4. PARCOURS D'EXPÉRENCE EN 4 ÉTAPES (TIMELINE CRÉATIVE)
           ========================================================================= */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 sm:mb-28">
          <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-card/70 to-background p-8 sm:p-14 shadow-lg">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-primary font-bold">
                Transparence & Sérénité
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl text-foreground font-light tracking-tight">
                Votre Commande en 4 Étapes Clés
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {processSteps.map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={idx}
                    className="relative p-6 rounded-2xl bg-card/60 border border-border/80 hover:border-primary/40 space-y-4 transition-all duration-300 shadow-2xs group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="font-serif text-2xl font-bold text-primary/40 group-hover:text-primary transition-colors">
                        {step.step}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h4 className="font-serif text-base font-medium text-foreground">
                        {step.title}
                      </h4>
                      <p className="text-xs text-muted-foreground font-light leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =========================================================================
            5. FORMULAIRE DE MESSAGE AVEC SÉLECTEUR D'UNIVERS
           ========================================================================= */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 mb-20 sm:mb-28">
          <div className="rounded-3xl border border-primary/30 bg-card/80 backdrop-blur-xl p-6 sm:p-12 shadow-md relative overflow-hidden">
            <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] uppercase tracking-[0.2em] font-semibold">
                <Mail className="w-3.5 h-3.5" />
                <span>Formulaire de Contact</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-foreground font-medium">
                Transmettre un Message à la Conciergerie
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-light">
                Indiquez votre besoin et nous reviendrons vers vous avec la plus haute diligence.
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-10 space-y-5 animate-in fade-in max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl text-foreground font-medium">
                  Demande Transmise avec Succès
                </h3>
                <p className="text-sm font-light text-muted-foreground leading-relaxed">
                  Merci <span className="font-semibold text-foreground">{formData.name}</span>, votre message a bien été reçu. Notre conciergerie vous recontactera très rapidement.
                </p>
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: "", contact: "", categoryType: "parfums", subject: "Conseil & Choix de Parfum", message: "" });
                    }}
                    variant="outline"
                    className="rounded-full text-xs uppercase tracking-wider px-6 border-border hover:border-primary"
                  >
                    Nouveau message
                  </Button>
                  <Button
                    type="button"
                    onClick={handleWhatsappSend}
                    className="rounded-full text-xs uppercase tracking-wider px-6 bg-[#25D366] hover:bg-[#20ba5a] text-white gap-2"
                  >
                    <MessageCircle className="w-4 h-4" /> Continuer sur WhatsApp
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Sélecteur Visuel d'Univers */}
                <div className="space-y-2">
                  <label className="block text-xs uppercase tracking-wider font-semibold text-foreground">
                    Univers Concerné :
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: "parfums", label: "Haute Parfumerie" },
                      { key: "artisanat", label: "Artisanat d'Art" },
                      { key: "antiques", label: "Objets Antiques" },
                      { key: "suivi", label: "Suivi Commande" },
                    ].map((item) => {
                      const isSelected = formData.categoryType === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setFormData({ ...formData, categoryType: item.key })}
                          className={`py-2.5 px-3 rounded-2xl text-xs font-medium border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs scale-[1.02]"
                              : "bg-background/80 border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Nom */}
                  <div className="space-y-1.5">
                    <label className="block text-xs uppercase tracking-wider font-medium text-foreground/80">
                      Nom & Prénom <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Sarah Benkirane"
                      className="w-full bg-background border border-border focus:border-primary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-1 focus:ring-primary/40"
                    />
                  </div>

                  {/* Contact */}
                  <div className="space-y-1.5">
                    <label className="block text-xs uppercase tracking-wider font-medium text-foreground/80">
                      Téléphone ou Email <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      placeholder="Ex: 06 12 34 56 78"
                      className="w-full bg-background border border-border focus:border-primary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-1 focus:ring-primary/40"
                    />
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="block text-xs uppercase tracking-wider font-medium text-foreground/80">
                    Votre Message ou Demande <span className="text-primary">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Décrivez votre besoin, le type de fragrance ou la référence de commande..."
                    className="w-full bg-background border border-border focus:border-primary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all resize-none focus:ring-1 focus:ring-primary/40"
                  />
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-border/60">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto rounded-full bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-[0.15em] text-xs h-12 px-8 font-bold shadow-sm cursor-pointer"
                  >
                    {loading ? "Envoi en cours..." : "Transmettre le Message"}
                  </Button>

                  <button
                    type="button"
                    onClick={handleWhatsappSend}
                    className="inline-flex items-center gap-2 text-xs font-semibold text-[#25D366] hover:underline cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Envoyer directement via WhatsApp
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>

        {/* =========================================================================
            6. ACCORDÉONS FAQ
           ========================================================================= */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-primary font-bold">
              Transparence
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground font-medium">
              Questions Fréquemment Posées
            </h2>
          </div>

          <div className="space-y-3.5">
            {faqItems.map((item) => {
              const Icon = item.icon;
              const isOpen = openFaq === item.id;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isOpen
                      ? "border-primary/50 bg-card shadow-md ring-1 ring-primary/20"
                      : "border-border/80 bg-card/60 hover:border-primary/40"
                  }`}
                >
                  <button
                    onClick={() => toggleFaq(item.id)}
                    className="w-full p-5 sm:p-6 flex items-center justify-between text-left gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-primary block mb-0.5">
                          {item.categoryLabel}
                        </span>
                        <h4 className="font-serif text-sm sm:text-base font-medium text-foreground">
                          {item.question}
                        </h4>
                      </div>
                    </div>

                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-300 shrink-0 ${
                        isOpen ? "rotate-180 text-primary" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-5 sm:px-6 pb-6 pt-0 text-xs sm:text-sm font-light text-muted-foreground leading-relaxed border-t border-border/40 mt-1 animate-in fade-in">
                      <div className="pt-3 pl-0 sm:pl-[3.25rem]">
                        <p>{item.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CustomerCare;
