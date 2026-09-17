/**
 * Page Service Client & Contact — Maison Kenzi
 *
 * Expérience éditoriale et visuelle de prestige en FR & EN :
 * - Hero immersif avec galerie photographique des coulisses de la conciergerie
 * - Cartes d'accès directs aux conseillers (WhatsApp en direct, Téléphone, Instagram, Email)
 * - Formulaire de contact interactif avec sélecteur d'univers (Parfums, Artisanat, Antiques, Suivi)
 * - Parcours client créatif en 4 étapes clés (Conseil, Préparation scellée, Expédition 24-48h, Paiement sécurisé en ligne)
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
  ShieldCheck,
  Truck,
  RotateCcw,
  ChevronDown,
  Compass,
  PackageCheck,
  Crown,
  Sparkles,
} from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useLanguage } from "@/contexts/LanguageContext";

const CustomerCare = () => {
  const { settings } = useAppSettings();
  const { language, t } = useLanguage();
  const isEn = language === "en";

  // Concierge Gallery Bilingue
  const conciergeGallery = [
    {
      title: isEn ? "Bespoke Olfactory Advice" : "Conseil Olfactif Sur-Mesure",
      tag: isEn ? "VIP Assistance" : "Accompagnement VIP",
      desc: isEn ? "Our specialists guide you according to your preferred notes, season, or occasion." : "Nos spécialistes vous guident selon vos notes de prédilection, la saison ou l'occasion.",
      image: "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=900&auto=format&fit=crop",
    },
    {
      title: isEn ? "Premium Packaging & Protection" : "Emballage Soigné & Protection Maximale",
      tag: isEn ? "Maximum Shielding" : "Protection Maximale",
      desc: isEn ? "Every order is carefully prepared in a shockproof sealed package." : "Chaque commande est minutieusement préparée dans un écrin anti-choc sécurisé et scellé.",
      image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=1200&auto=format&fit=crop",
    },
    {
      title: isEn ? "Worldwide Express Delivery" : "Expédition Express Internationale",
      tag: isEn ? "Worldwide Shipping" : "Partout dans le Monde",
      desc: isEn ? "Tracked priority parcel delivery to all countries worldwide with dedicated real-time tracking." : "Livraison express suivie et sécurisée dans tous les pays du monde avec suivi en temps réel.",
      image: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1200&auto=format&fit=crop",
    },
  ];

  const processSteps = [
    {
      step: "01",
      title: isEn ? "Bespoke Selection" : "Conseil & Choix Personnalisé",
      desc: isEn ? "Chat directly with our advisors on WhatsApp to refine your choice of fragrances, cosmetics, artisanship or bazar chic." : "Échangez avec nos conseillers sur WhatsApp pour affiner votre sélection : parfums, cosmétiques, artisanat ou bazar chic.",
      icon: Compass,
    },
    {
      step: "02",
      title: isEn ? "Factory Sealed Packaging" : "Conditionnement d'Origine",
      desc: isEn ? "Careful packaging of 100% genuine and sealed products in their official packaging." : "Préparation soignée de vos articles 100% authentiques et neufs dans leur emballage officiel scellé.",
      icon: Crown,
    },
    {
      step: "03",
      title: isEn ? "Insured Express Dispatch" : "Acheminement Express Sécurisé",
      desc: isEn ? "Priority processing and real-time live MK tracking code for your parcel." : "Prise en charge prioritaire et remise d'un numéro de suivi MK en temps réel pour suivre votre colis.",
      icon: Truck,
    },
    {
      step: "04",
      title: isEn ? "Secure Online Payment" : "Paiement Sécurisé par Internet",
      desc: isEn ? "100% encrypted online bank card payment during order confirmation." : "Règlement 100% sécurisé et chiffré par carte bancaire lors de la validation de votre commande.",
      icon: PackageCheck,
    },
  ];

  // FAQ Items Bilingues
  const faqItems = [
    {
      id: 1,
      categoryLabel: isEn ? "Authenticity & Quality" : "Authenticité & Qualité",
      icon: ShieldCheck,
      question: isEn ? "Are the fragrances and products 100% original and factory-sealed?" : "Les créations vendues sont-elles 100% d'origine et scellées ?",
      answer: isEn
        ? "Absolute authenticity is our primary commitment. Every fragrance and cosmetic item is delivered brand-new in its original factory-sealed box with official cellophane wrapper. Our artisanal creations and bazar chic pieces are individually curated and inspected."
        : "L'authenticité absolue est notre premier engagement. Chaque parfum et produit cosmétique est livré neuf et scellé sous blister dans son emballage d'origine. Nos créations artisanales et articles de bazar chic font l'objet d'une sélection rigoureuse.",
    },
    {
      id: 2,
      categoryLabel: isEn ? "Shipping & Worldwide Delivery" : "Délais & Expédition Mondiale",
      icon: Truck,
      question: isEn ? "What are the shipping delivery times worldwide?" : "Quels sont les délais et modalités de livraison ?",
      answer: isEn
        ? "We ship orders to all countries worldwide with priority tracked express couriers. Every parcel benefits from dedicated live tracking and reinforced shockproof shielding."
        : "Nous expédions vos commandes dans tous les pays du monde avec des transporteurs express prioritaires. Chaque commande bénéficie d'un numéro de suivi en direct et d'un emballage haute sécurité anti-choc.",
    },
    {
      id: 3,
      categoryLabel: isEn ? "Payment & Security" : "Règlement & Sécurité",
      icon: PackageCheck,
      question: isEn ? "How is payment completed?" : "Comment s'effectue le paiement de ma commande ?",
      answer: isEn
        ? "Payments are processed 100% securely online upon ordering (bank card, 256-bit SSL encryption). You receive instant order confirmation and tracking."
        : "Le règlement s'effectue de manière 100% sécurisée par internet lors de votre commande (carte bancaire, chiffrement SSL 256-bit). Vous recevez instantanément votre confirmation et votre référence de suivi.",
    },
    {
      id: 4,
      categoryLabel: isEn ? "Gift & Private Advice" : "Conseil & Personnalisation",
      icon: Sparkles,
      question: isEn ? "Can I get personalized advice for a gift?" : "Puis-je bénéficier d'une consultation personnalisée pour un cadeau ?",
      answer: isEn
        ? "Absolutely. Our private concierge assists you on WhatsApp to select the perfect olfactory signature, compose a bespoke discovery set, or prepare a refined gift."
        : "Absolument. Notre conciergerie privée vous assiste sur WhatsApp pour sélectionner la fragrance idéale, composer un coffret sur-mesure ou préparer une attention délicate pour une occasion spéciale.",
    },
    {
      id: 5,
      categoryLabel: isEn ? "Sale Policy & Authenticity" : "Politique de Vente & Authenticité",
      icon: RotateCcw,
      question: isEn ? "What is your return and exchange policy?" : "Quelle est votre politique de garantie et de retour ?",
      answer: isEn
        ? "To guarantee impeccable hygiene and the untampered seal of every luxury flacon, all sales are final once dispatched. No returns or exchanges are accepted."
        : "Afin de garantir l'authenticité absolue, l'hygiène stricte et la conservation olfactive irréprochable de chaque jus pour l'ensemble de notre clientèle, Maison Kenzi n'effectue aucun retour ni échange une fois la commande validée et expédiée (vente définitive).",
    },
  ];

  // Coordonnées Conciergerie
  const rawWa = settings.whatsapp_phone || settings.store_phone || "212652535301";
  const waNumber = rawWa.replace(/[^0-9]/g, "") || "212652535301";
  const instagramUrl = settings.instagram_url || "https://instagram.com/maisonkenzi";

  // État accordéons FAQ
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleDirectWhatsapp = () => {
    const defaultText = isEn
      ? "Hello Maison Kenzi, I would like to speak with a fragrance advisor."
      : "Bonjour Maison Kenzi, j'aimerais échanger avec un conseiller pour un renseignement sur vos collections.";
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(defaultText)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/20">
      <Seo
        title={isEn ? "Customer Care & Private Concierge | Maison Kenzi" : "Service Client & Conciergerie Privée | Maison Kenzi Maroc"}
        description={isEn ? "Contact Maison Kenzi concierge: bespoke assistance, perfume advice, order tracking and express shipping." : "Contactez la conciergerie Maison Kenzi : assistance personnalisée 7j/7, conseils olfactifs, suivi de commande et livraison express partout au Maroc."}
        path="/about/service-client"
      />
      <Header />

      <main className="flex-1 pt-28 sm:pt-36 pb-24">
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
                <span>{isEn ? "Active Concierge · 7/7 Response" : "Conciergerie Active · Réponse 7j/7"}</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl text-foreground font-light tracking-tight leading-[1.15]">
                {isEn ? (
                  <>Dedicated Listening & <span className="text-primary italic font-serif">Excellence</span></>
                ) : (
                  <>Une Écoute Attentive & un Service d'<span className="text-primary italic font-serif">Excellence</span></>
                )}
              </h1>

              <p className="text-muted-foreground text-xs sm:text-base font-light leading-relaxed max-w-2xl mx-auto pt-1">
                {isEn
                  ? "Whether you are seeking an olfactory signature, details on handcrafted creations or order tracking, our team is at your complete disposal."
                  : "Que vous recherchiez une signature olfactive, des détails sur une pièce artisanale ou le suivi de votre commande, notre équipe est à votre entière disposition."}
              </p>

              {/* Boutons d'Action Immédiate */}
              <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
                <Button
                  onClick={handleDirectWhatsapp}
                  size="lg"
                  className="rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs uppercase tracking-wider font-bold h-12 px-8 shadow-md gap-2 cursor-pointer border-0 transition-transform hover:scale-105"
                >
                  <MessageCircle className="w-4 h-4" />
                  {isEn ? "WhatsApp Direct" : "WhatsApp Direct"}
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-border hover:border-primary text-xs uppercase tracking-wider font-semibold h-12 px-8 cursor-pointer"
                >
                  <Link to="/suivi-commande" className="gap-2 flex items-center">
                    <Truck className="w-4 h-4 text-primary" />
                    {isEn ? "Track an Order" : "Suivre une Commande"}
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
              {isEn ? "House Commitments" : "Les Engagements de la Maison"}
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl text-foreground font-light tracking-tight">
              {isEn ? "Uncompromising Attention to Detail" : "Une Attention aux Moindres Détails"}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground font-light">
              {isEn ? "Experience the exacting standards that guide every step at Maison Kenzi." : "Découvrez l'exigence qui anime chaque étape de votre expérience chez Maison Kenzi."}
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
        <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 sm:mb-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Carte WhatsApp */}
            <div className="group relative rounded-3xl border border-border/80 bg-card/70 backdrop-blur-md p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:border-primary/50 hover:shadow-lg">
              <div className="space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 flex items-center justify-center text-[#25D366] transition-transform duration-300 group-hover:scale-110">
                  <MessageCircle className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-serif text-2xl font-medium text-foreground mb-1">
                    {isEn ? "Private WhatsApp" : "WhatsApp Privé"}
                  </h3>
                  <p className="text-xs uppercase tracking-wider text-primary font-bold">
                    {isEn ? "Instant Assistance" : "Réponse Instantanée"}
                  </p>
                </div>
                <p className="text-xs sm:text-sm font-light text-muted-foreground leading-relaxed">
                  {isEn
                    ? "Chat directly with an advisor for fragrance recommendations, order additions, or quick inquiries."
                    : "Échangez directement avec un conseiller pour un conseil olfactif, un ajout à votre commande ou une urgence."}
                </p>
              </div>

              <div className="pt-6 border-t border-border/50 mt-6">
                <Button
                  onClick={handleDirectWhatsapp}
                  className="w-full rounded-full bg-[#25D366] text-white hover:bg-[#20ba5a] uppercase tracking-[0.15em] text-xs h-11 font-bold shadow-xs cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {isEn ? "Chat on WhatsApp" : "Échanger sur WhatsApp"}
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
                    {isEn ? "Instagram Universe" : "Univers Instagram"}
                  </h3>
                  <p className="text-xs uppercase tracking-wider text-primary font-bold">
                    @maisonkenzii
                  </p>
                </div>
                <p className="text-xs sm:text-sm font-light text-muted-foreground leading-relaxed">
                  {isEn
                    ? "Discover live new arrivals, artisanal pieces, and send us a direct message (DM)."
                    : "Découvrez les nouveautés en direct, nos pièces artisanales et envoyez-nous un message privé (DM)."}
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
                    {isEn ? "Join the House" : "Rejoindre la Maison"}
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
                {isEn ? "Transparency & Peace of Mind" : "Transparence & Sérénité"}
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl text-foreground font-light tracking-tight">
                {isEn ? "Your Order in 4 Key Steps" : "Votre Commande en 4 Étapes Clés"}
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
            5. ACCORDÉONS FAQ
           ========================================================================= */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10 space-y-2">
            <span className="text-xs uppercase tracking-[0.25em] text-primary font-bold">
              {isEn ? "Transparency" : "Transparence"}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-foreground font-medium">
              {isEn ? "Frequently Asked Questions" : "Questions Fréquemment Posées"}
            </h2>
          </div>

          <div className="space-y-3.5">
            {faqItems.map((item) => {
              const Icon = item.icon;
              const isOpen = openFaq === item.id;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${isOpen
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
                      className={`w-4 h-4 text-muted-foreground transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180 text-primary" : ""
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
