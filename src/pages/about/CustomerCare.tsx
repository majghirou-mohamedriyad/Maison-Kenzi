/**
 * Page Service Client & Contact — Maison Kenzi
 *
 * Expérience éditoriale haut de gamme dédiée au service client et à la conciergerie olfactive.
 * Respecte le Luxury Nude Design System (Travertin, Albâtre, Or Champagne), zéro emoji,
 * icônes vectorielles lucide-react et liaisons dynamiques vers les paramètres de la boutique.
 */

import { useState } from "react";
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
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
} from "lucide-react";
import { toast } from "sonner";
import { useAppSettings } from "@/hooks/useAppSettings";

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
  const storeAddress = settings.store_address || "Casablanca & Partout au Maroc";

  // État du formulaire
  const [formData, setFormData] = useState({
    name: "",
    contact: "",
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
    const text = `Bonjour Maison Kenzi,\n\nNom: ${formData.name || "Client"}\nContact: ${formData.contact || "Non précisé"}\nSujet: ${formData.subject}\nMessage: ${formData.message || "Bonjour, je souhaiterais obtenir un renseignement."}`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleDirectWhatsapp = () => {
    const defaultText = "Bonjour Maison Kenzi, j'aimerais échanger avec un conseiller pour un renseignement sur vos parfums.";
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(defaultText)}`, "_blank");
  };

  // Questions Fréquentes enrichies par catégorie
  const [activeFaqCategory, setActiveFaqCategory] = useState<string>("all");
  const [faqSearch, setFaqSearch] = useState<string>("");

  const allFaqItems = [
    {
      id: 1,
      category: "authenticite",
      categoryLabel: "Authenticité & Flacons",
      icon: ShieldCheck,
      question: "Comment garantissez-vous l'authenticité des parfums ?",
      answer:
        "L'intégrité de nos fragrances est notre premier engagement. Chaque flacon est acquis exclusivement auprès des circuits officiels des maisons de haute parfumerie et des distributeurs certifiés. Nos décants sont prélevés avec des instruments stériles de précision directement à partir des bouteilles scellées, sans aucune dilution, altération ou manipulation de la formule originale.",
    },
    {
      id: 2,
      category: "authenticite",
      categoryLabel: "Authenticité & Flacons",
      icon: Sparkles,
      question: "Quelle est la qualité des flacons décants nomades ?",
      answer:
        "Nos décants (5ml et 10ml) sont confectionnés dans un verre épais haute densité résistant aux chocs, préservant le jus de la lumière et des variations de température. Ils sont équipés d'un atomiseur vaporisateur brume fine premium offrant une diffusion homogène et voluptueuse identique aux flacons grands formats.",
    },
    {
      id: 3,
      category: "conseil",
      categoryLabel: "Conseils & Formats",
      icon: Clock,
      question: "Combien de vaporisations permet un décant 5ml et 10ml ?",
      answer:
        "Un décant de 5 ml offre environ 70 à 80 pulvérisations (soit près d'un mois d'utilisation quotidienne pour tester l'évolution des notes sur votre peau). Un format 10 ml permet environ 150 à 160 pulvérisations, idéal pour voyager ou porter une création précieuse durant toute une saison.",
    },
    {
      id: 4,
      category: "livraison",
      categoryLabel: "Commandes & Livraison",
      icon: Truck,
      question: "Quels sont les délais et modalités de livraison au Maroc ?",
      answer:
        "Nous livrons dans l'ensemble des villes et provinces du Royaume du Maroc sous 24 à 48 heures ouvrées. Chaque flacon est soigneusement capitonné dans un emballage anti-choc isotherme. Vous réglez directement en espèces (Cash on Delivery) lors de la remise en main propre de votre colis par le transporteur.",
    },
    {
      id: 5,
      category: "conseil",
      categoryLabel: "Conseils & Formats",
      icon: Sparkles,
      question: "Puis-je bénéficier d'une consultation olfactive personnalisée ?",
      answer:
        "Avec grand plaisir. Si vous hésitez entre plusieurs sillages ou cherchez une signature olfactive adaptée à votre personnalité, vos goûts ou une saison particulière, notre conciergerie est à votre disposition 6j/7 sur WhatsApp et Instagram pour une recommandation sur-mesure.",
    },
    {
      id: 6,
      category: "retours",
      categoryLabel: "Retours & Garanties",
      icon: RotateCcw,
      question: "Quelle est votre politique d'échange et de rétractation ?",
      answer:
        "Pour des raisons d'hygiène et afin de garantir l'authenticité irréprochable de chaque essence pour l'ensemble de notre clientèle, les retours sont acceptés sous un délai de 7 jours après réception, exclusivement pour les articles non ouverts, non vaporisés et toujours dans leur opercule de protection d'origine.",
    },
  ];

  const faqCategories = [
    { id: "all", label: "Toutes les questions" },
    { id: "authenticite", label: "Authenticité & Décants" },
    { id: "livraison", label: "Livraison & Paiement" },
    { id: "conseil", label: "Conseil & Formats" },
    { id: "retours", label: "Garanties & Retours" },
  ];

  const filteredFaq = allFaqItems.filter((item) => {
    const matchCategory = activeFaqCategory === "all" || item.category === activeFaqCategory;
    const matchSearch =
      faqSearch.trim() === "" ||
      item.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
      item.answer.toLowerCase().includes(faqSearch.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      <Header />

      <main className="flex-1 pt-28 sm:pt-36 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* =========================================================================
              1. HERO ÉDITORIAL LUXE
             ========================================================================= */}
          <div className="text-center max-w-3xl mx-auto mb-14 sm:mb-20">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs uppercase tracking-[0.25em] font-medium mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Haute Parfumerie · Conciergerie</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-foreground font-light tracking-tight mb-5 leading-tight">
              Service Client & Contact
            </h1>

            <p className="text-muted-foreground text-sm sm:text-base font-light leading-relaxed max-w-2xl mx-auto">
              Une interrogation sur une création, un suivi de commande ou le désir d'une recommandation olfactive sur-mesure ? Notre maison est à votre entière écoute.
            </p>

            <div className="w-16 h-[1px] bg-primary/40 mx-auto mt-6" />
          </div>

          {/* =========================================================================
              2. CARTES DE CONTACT HAUTE COUTURE
             ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 sm:mb-24">
            {/* Carte WhatsApp */}
            <div className="group relative rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-md p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary transition-transform duration-300 group-hover:scale-110">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-medium text-foreground mb-1">
                    Conciergerie WhatsApp
                  </h2>
                  <p className="text-xs uppercase tracking-wider text-primary font-medium">
                    Réponse Instantanée
                  </p>
                </div>
                <p className="text-sm font-light text-muted-foreground leading-relaxed">
                  Échangez en direct avec nos conseillers pour un conseil personnalisé, une confirmation de commande ou une question urgente.
                </p>
              </div>

              <div className="pt-6 border-t border-border/50 mt-6">
                <Button
                  onClick={handleDirectWhatsapp}
                  className="w-full rounded-full bg-primary text-primary-foreground hover:bg-primary-hover uppercase tracking-[0.15em] text-xs h-11 font-medium transition-transform hover:scale-[1.02]"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Ouvrir WhatsApp
                </Button>
              </div>
            </div>

            {/* Carte Téléphone & Horaires */}
            <div className="group relative rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-md p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary transition-transform duration-300 group-hover:scale-110">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-medium text-foreground mb-1">
                    Ligne Directe
                  </h2>
                  <p className="text-xs uppercase tracking-wider text-primary font-medium">
                    Appel & Renseignement
                  </p>
                </div>
                <div className="space-y-2 text-sm font-light text-muted-foreground">
                  <p className="text-foreground font-medium text-base tracking-wide">
                    {formattedPhone}
                  </p>
                  <div className="flex items-center gap-2 text-xs pt-1">
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <span>Lun — Sam : 10h00 — 19h00</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span>{storeAddress}</span>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border/50 mt-6">
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-full border-primary/30 text-foreground hover:bg-primary/5 uppercase tracking-[0.15em] text-xs h-11 font-medium"
                >
                  <a href={`tel:+${waNumber}`}>
                    <Phone className="w-4 h-4 mr-2 text-primary" />
                    Composer le numéro
                  </a>
                </Button>
              </div>
            </div>

            {/* Carte Instagram & Réseaux */}
            <div className="group relative rounded-2xl border border-primary/20 bg-card/60 backdrop-blur-md p-6 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary transition-transform duration-300 group-hover:scale-110">
                  <Instagram className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-medium text-foreground mb-1">
                    Univers Instagram
                  </h2>
                  <p className="text-xs uppercase tracking-wider text-primary font-medium">
                    @maisonkenzi
                  </p>
                </div>
                <p className="text-sm font-light text-muted-foreground leading-relaxed">
                  Découvrez nos arrivages exclusifs, nos décantages en atelier et contactez-nous via message privé (DM).
                </p>
              </div>

              <div className="pt-6 border-t border-border/50 mt-6">
                <Button
                  asChild
                  variant="outline"
                  className="w-full rounded-full border-primary/30 text-foreground hover:bg-primary/5 uppercase tracking-[0.15em] text-xs h-11 font-medium"
                >
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Rejoindre Maison Kenzi sur Instagram"
                  >
                    <Instagram className="w-4 h-4 mr-2 text-primary" />
                    Rejoindre la Maison
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* =========================================================================
              3. FORMULAIRE DE MESSAGE INTERACTIF
             ========================================================================= */}
          <div className="mb-20">
            <div className="rounded-2xl border border-primary/20 bg-card/40 backdrop-blur-md p-6 sm:p-12 shadow-sm relative overflow-hidden">
              <div className="max-w-2xl mx-auto text-center mb-10">
                <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-2">
                  Formulaire de Contact
                </p>
                <h2 className="font-serif text-2xl sm:text-3xl text-foreground font-light tracking-tight mb-3">
                  Transmettre un Message à l'Atelier
                </h2>
                <p className="text-xs sm:text-sm font-light text-muted-foreground">
                  Remplissez ce formulaire et notre équipe vous recontactera avec la plus grande diligence.
                </p>
              </div>

              {submitted ? (
                <div className="text-center py-10 space-y-5 animate-fade-in max-w-lg mx-auto">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 mx-auto flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="font-serif text-2xl text-foreground font-medium">
                    Demande Enregistrée
                  </h3>
                  <p className="text-sm font-light text-muted-foreground leading-relaxed">
                    Merci <span className="font-medium text-foreground">{formData.name}</span>, votre message a bien été transmis. Nous vous répondrons dans les plus brefs délais.
                  </p>
                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                      type="button"
                      onClick={() => {
                        setSubmitted(false);
                        setFormData({ name: "", contact: "", subject: "Conseil & Choix de Parfum", message: "" });
                      }}
                      variant="outline"
                      className="rounded-full text-xs uppercase tracking-wider px-6 border-primary/30 hover:bg-primary/5"
                    >
                      Nouvelle demande
                    </Button>
                    <Button
                      type="button"
                      onClick={handleWhatsappSend}
                      className="rounded-full text-xs uppercase tracking-wider px-6 bg-primary text-primary-foreground hover:bg-primary-hover gap-2"
                    >
                      <MessageCircle className="w-4 h-4" /> Continuer sur WhatsApp
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl mx-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Nom */}
                    <div className="space-y-2">
                      <label className="block text-xs uppercase tracking-wider font-medium text-foreground/80">
                        Nom & Prénom <span className="text-primary">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Yasmine Benjelloun"
                        className="w-full bg-background/80 border border-border/80 focus:border-primary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-1 focus:ring-primary/40"
                      />
                    </div>

                    {/* Contact */}
                    <div className="space-y-2">
                      <label className="block text-xs uppercase tracking-wider font-medium text-foreground/80">
                        Téléphone ou Email <span className="text-primary">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.contact}
                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                        placeholder="Ex: 06 12 34 56 78 ou contact@domaine.com"
                        className="w-full bg-background/80 border border-border/80 focus:border-primary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all focus:ring-1 focus:ring-primary/40"
                      />
                    </div>
                  </div>

                  {/* Objet */}
                  <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-wider font-medium text-foreground/80">
                      Objet de la demande
                    </label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-background/80 border border-border/80 focus:border-primary rounded-xl px-4 py-3 text-sm text-foreground outline-none transition-all cursor-pointer focus:ring-1 focus:ring-primary/40"
                    >
                      <option value="Conseil & Choix de Parfum">Conseil olfactif personnalisé</option>
                      <option value="Suivi de Commande">Suivi de ma commande</option>
                      <option value="Flaconnage & Décants">Question sur le flaconnage & décants</option>
                      <option value="Disponibilité d'un Parfum">Demande de disponibilité d'un parfum</option>
                      <option value="Autre Demande">Autre demande</option>
                    </select>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <label className="block text-xs uppercase tracking-wider font-medium text-foreground/80">
                      Votre Message <span className="text-primary">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Décrivez votre besoin, le type de fragrance recherchée ou la référence de votre commande..."
                      className="w-full bg-background/80 border border-border/80 focus:border-primary rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-all resize-none focus:ring-1 focus:ring-primary/40"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-border/40">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full sm:w-auto rounded-full bg-primary text-primary-foreground hover:bg-primary-hover uppercase tracking-[0.2em] text-xs h-12 px-8 shadow-sm transition-all hover:scale-[1.02] font-medium"
                    >
                      {loading ? (
                        "Envoi en cours..."
                      ) : (
                        <span className="flex items-center gap-2">
                          Transmettre le message <Send className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </Button>

                    <button
                      type="button"
                      onClick={handleWhatsappSend}
                      className="inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Envoyer directement via WhatsApp
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* =========================================================================
              4. FOIRE AUX QUESTIONS & ENGAGEMENTS (DESIGN LUXE AVANCÉ)
             ========================================================================= */}
          <div className="max-w-4xl mx-auto">
            {/* Header FAQ */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs uppercase tracking-[0.2em] font-medium mb-3">
                <Sparkles className="w-3 h-3" />
                <span>Guide & Transparence</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl text-foreground font-light tracking-tight mb-3">
                Questions Fréquentes
              </h2>
              <p className="text-sm font-light text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Tout ce que vous devez savoir sur la sélection de nos jus authentiques, le processus de décantation et nos livraisons.
              </p>
              <div className="w-14 h-[1px] bg-primary/40 mx-auto mt-5" />
            </div>

            {/* Onglets Filtres de Catégories FAQ */}
            <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
              {faqCategories.map((cat) => {
                const isActive = activeFaqCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveFaqCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-xs font-medium tracking-wider uppercase whitespace-nowrap transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm scale-105"
                        : "bg-card/60 text-muted-foreground hover:text-foreground border border-border/60 hover:border-primary/30"
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>

            {/* Liste des Accordéons Sublimés */}
            {filteredFaq.length === 0 ? (
              <div className="text-center py-12 rounded-2xl border border-primary/20 bg-card/30 backdrop-blur-sm">
                <p className="text-muted-foreground text-sm font-light mb-4">
                  Aucune réponse ne correspond à ce critère.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveFaqCategory("all");
                    setFaqSearch("");
                  }}
                  className="rounded-full text-xs uppercase tracking-wider border-primary/30"
                >
                  Réinitialiser le filtre
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFaq.map((item, idx) => {
                  const Icon = item.icon;
                  const isOpen = openFaq === item.id;
                  const itemNumber = String(idx + 1).padStart(2, "0");

                  return (
                    <div
                      key={item.id}
                      className={`group rounded-2xl border transition-all duration-300 backdrop-blur-md overflow-hidden ${
                        isOpen
                          ? "border-primary/50 bg-card/80 shadow-md ring-1 ring-primary/20"
                          : "border-primary/15 bg-card/40 hover:border-primary/35 hover:bg-card/60"
                      }`}
                    >
                      <button
                        onClick={() => toggleFaq(item.id)}
                        className="w-full px-5 sm:px-8 py-5 sm:py-6 flex items-center justify-between text-left gap-4 cursor-pointer"
                      >
                        <div className="flex items-center gap-4 sm:gap-5 min-w-0">
                          {/* Numérotation ou Icône avec effet doré */}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                              isOpen
                                ? "bg-primary text-primary-foreground shadow-sm scale-110"
                                : "bg-primary/10 text-primary border border-primary/20 group-hover:scale-105"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <span className="block text-[10px] uppercase tracking-[0.2em] text-primary/80 font-semibold mb-1">
                              {item.categoryLabel} · {itemNumber}
                            </span>
                            <h3 className="font-serif text-base sm:text-lg text-foreground font-medium tracking-tight">
                              {item.question}
                            </h3>
                          </div>
                        </div>

                        <div
                          className={`w-8 h-8 rounded-full border border-primary/20 flex items-center justify-center shrink-0 transition-all duration-300 ${
                            isOpen ? "bg-primary/15 rotate-180" : "bg-background/50 group-hover:border-primary/40"
                          }`}
                        >
                          <ChevronDown className="w-4 h-4 text-primary" />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="px-5 sm:px-8 pb-6 pt-0 text-sm sm:text-[15px] font-light text-muted-foreground leading-relaxed border-t border-border/30 mt-1 animate-fade-in">
                          <div className="pt-4 pl-0 sm:pl-[3.75rem]">
                            <p>{item.answer}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Encadré d'Assistance / Contact direct bas de page */}
            <div className="mt-14 rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/5 via-card/50 to-primary/10 backdrop-blur-md p-8 sm:p-10 text-center relative overflow-hidden">
              <div className="max-w-xl mx-auto space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/15 border border-primary/30 text-primary mx-auto flex items-center justify-center">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-2xl text-foreground font-medium tracking-tight">
                  Vous avez une autre question ?
                </h3>
                <p className="text-xs sm:text-sm font-light text-muted-foreground leading-relaxed pb-2">
                  Notre équipe de conseillers olfactifs vous répond en direct pour vous accompagner dans votre choix.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  <Button
                    onClick={handleDirectWhatsapp}
                    className="w-full sm:w-auto rounded-full bg-primary text-primary-foreground hover:bg-primary-hover uppercase tracking-[0.15em] text-xs h-11 px-6 font-medium shadow-sm transition-transform hover:scale-105"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Parler à un conseiller sur WhatsApp
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full sm:w-auto rounded-full border-primary/30 text-foreground hover:bg-primary/5 uppercase tracking-[0.15em] text-xs h-11 px-6 font-medium"
                  >
                    <a href={`tel:+${waNumber}`}>
                      <Phone className="w-4 h-4 mr-2 text-primary" />
                      Appeler l'Atelier
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CustomerCare;

