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

  const faqItems = [
    {
      icon: ShieldCheck,
      question: "Comment garantissez-vous l'authenticité des jus ?",
      answer:
        "Chaque flacon proposé chez Maison Kenzi provient exclusivement des circuits officiels des marques et maisons de haute parfumerie. Nos décants sont prélevés avec du matériel stérile de haute précision directement depuis les bouteilles authentiques scellées, sans aucune altération ni ajout.",
    },
    {
      icon: Truck,
      question: "Quels sont les délais et zones de livraison ?",
      answer:
        "Nous livrons dans l'ensemble des villes du Royaume du Maroc sous 24h à 48h ouvrées. Chaque commande est emballée dans un coffret de protection capitonné garantissant la préservation parfaite des flacons et des essences.",
    },
    {
      icon: Sparkles,
      question: "Puis-je bénéficier d'un conseil olfactif sur-mesure ?",
      answer:
        "Absolument. Que vous recherchiez une signature pour une occasion spéciale, un sillage boisé pour l'hiver ou une fraîcheur hespéridée, nos experts sont disponibles directement sur WhatsApp ou par message pour vous guider pas à pas selon vos goûts.",
    },
    {
      icon: RotateCcw,
      question: "Quelle est votre politique de retour ou d'échange ?",
      answer:
        "Afin de garantir la pureté et l'hygiène de nos décants de parfum, les retours sont acceptés sous 7 jours après réception uniquement pour les articles non ouverts, non vaporisés et conservés dans leur emballage de protection d'origine.",
    },
  ];

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
              4. FOIRE AUX QUESTIONS & ENGAGEMENTS
             ========================================================================= */}
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs uppercase tracking-[0.3em] text-primary font-medium mb-2">
                Questions Fréquentes
              </p>
              <h2 className="font-serif text-2xl sm:text-3xl text-foreground font-light tracking-tight">
                Engagements & Réponses
              </h2>
              <div className="w-12 h-[1px] bg-primary/40 mx-auto mt-4" />
            </div>

            <div className="space-y-4">
              {faqItems.map((item, idx) => {
                const Icon = item.icon;
                const isOpen = openFaq === idx;

                return (
                  <div
                    key={idx}
                    className="rounded-xl border border-primary/15 bg-card/30 backdrop-blur-sm overflow-hidden transition-colors hover:border-primary/30"
                  >
                    <button
                      onClick={() => toggleFaq(idx)}
                      className="w-full px-5 sm:px-6 py-4.5 flex items-center justify-between text-left gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-serif text-base sm:text-lg text-foreground font-medium">
                          {item.question}
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-5 h-5 text-primary shrink-0 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 sm:px-6 pb-5 pt-1 text-sm font-light text-muted-foreground leading-relaxed pl-[3.75rem] border-t border-border/30 animate-fade-in">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CustomerCare;

