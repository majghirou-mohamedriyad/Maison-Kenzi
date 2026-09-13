/**
 * Page À Propos — Maison Kenzi
 *
 * Présentation de l'histoire, des engagements d'authenticité (Flacons Complets 100% Scellés),
 * de la sélection des matières premières et du service de conciergerie au Maroc et en Europe.
 */

import { useState } from "react";
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import Seo from "@/components/Seo";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ShieldCheck,
  Truck,
  Crown,
  Gem,
  HelpCircle,
  ChevronDown,
  MessageCircle,
  ArrowRight,
  Flame,
  Flower2,
  PackageCheck,
  CheckCircle2,
} from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useLanguage } from "@/context/LanguageContext";

const About = () => {
  const { settings } = useAppSettings();
  const { language, t } = useLanguage();
  const isEn = language === "en";
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const pillars = [
    {
      icon: Crown,
      title: isEn ? "100% Original Sealed Bottles" : "100% Flacons Complets & Scellés",
      desc: isEn
        ? "Each fragrance is delivered in its factory-sealed original box with official cellophane wrapper. Zero fakes, zero imitations: only pure authentic pieces."
        : "Chaque parfum est livré dans son flacon d'origine scellé sous blister avec packaging officiel complet. Zéro contrefaçon, zéro imitation : uniquement des pièces authentiques.",
      tag: isEn ? "Guaranteed Origin" : "Origine Garantie",
    },
    {
      icon: Gem,
      title: isEn ? "High Concentration & Precious Extracts" : "Haute Concentration & Extraits Nobles",
      desc: isEn
        ? "We rigorously curate Eaux de Parfum and Extraits de Parfum formulated with precious raw materials, ensuring a remarkable sillage and projection."
        : "Nous sélectionnons rigoureusement des Eaux de Parfum et Extraits de Parfum aux matières premières précieuses, garantissant un sillage mémorable et une tenue remarquable tout au long de la journée.",
      tag: isEn ? "Purity & Longevity" : "Pureté & Tenue",
    },
    {
      icon: Truck,
      title: isEn ? "Express Courier Across Morocco & Europe" : "Livraison Express Partout au Maroc & en Europe",
      desc: isEn
        ? "Insured dispatch within 24 to 48 hours across all Moroccan cities and Europe with reinforced shockproof packaging."
        : "Expédition sécurisée sous 24 à 48 heures dans toutes les villes du Royaume (Casablanca, Rabat, Marrakech, Tanger, Fès, Agadir...) et en Europe avec emballage haute protection anti-choc.",
      tag: isEn ? "24–48h Express" : "24–48h à Domicile",
    },
    {
      icon: PackageCheck,
      title: isEn ? "Secure Online Payment" : "Paiement Sécurisé par Internet",
      desc: isEn
        ? "Order with total peace of mind: fully encrypted online bank transactions with immediate order tracking."
        : "Commandez en toute confiance : transactions sécurisées et chiffrées par internet avec confirmation immédiate et traçabilité.",
      tag: isEn ? "SSL Encryption" : "Chiffrement SSL",
    },
  ];

  const faqs = [
    {
      q: isEn
        ? "Are all perfumes sold by Maison Kenzi 100% original?"
        : "Les parfums vendus par Maison Kenzi sont-ils 100% originaux ?",
      a: isEn
        ? "Absolutely. At Maison Kenzi, authenticity is our primary foundation. All our fragrances are brand-new original creations sealed in their factory box with cellophane wrapper."
        : "Absolument. Chez Maison Kenzi, l'authenticité est notre premier engagement. Tous nos parfums sont des créations originales scellées dans leur boîte d'origine sous blister, issues directement des circuits officiels des plus grandes maisons de création.",
    },
    {
      q: isEn
        ? "What are the shipping delivery times?"
        : "Sous quel délai ma commande est-elle livrée ?",
      a: isEn
        ? "Our orders are carefully prepared and dispatched within 24 to 48 hours. You receive a live MK tracking reference code (`MK-XXXXXX`) to follow your delivery."
        : "Nos commandes sont traitées avec le plus grand soin et expédiées en 24 à 48 heures. Vous recevez une référence de commande en direct (`MK-XXXXXX`) pour suivre l'acheminement de votre colis en temps réel.",
    },
    {
      q: isEn
        ? "What payment methods are supported?"
        : "Quels sont les modes de paiement acceptés ?",
      a: isEn
        ? "Payment is processed 100% securely online upon ordering (bank card, encrypted SSL protocols)."
        : "Le règlement s'effectue de manière 100% sécurisée par internet lors de la validation de votre commande (carte bancaire, transactions chiffrées).",
    },
    {
      q: isEn
        ? "What is your return policy?"
        : "Quelle est votre politique de retour ?",
      a: isEn
        ? "To guarantee impeccable hygiene and the intact seal of each luxury creation, all sales are final. No returns or exchanges are accepted once dispatched."
        : "Afin de garantir l'authenticité absolue, l'hygiène stricte et la préservation de chaque jus d'exception, les ventes sont définitives. Aucun retour ni échange n'est accepté une fois le colis expédié.",
    },
    {
      q: isEn
        ? "How can I get bespoke fragrance advice?"
        : "Comment puis-je être conseillé pour choisir mon parfum ?",
      a: isEn
        ? "Our private concierge is available 7/7 on WhatsApp to guide you according to your olfactory preferences, occasion, or gift composition."
        : "Notre service de conciergerie privée est disponible 7j/7 sur WhatsApp pour vous orienter selon vos notes olfactives de prédilection, la saison, l'occasion ou pour vous aider à composer un cadeau d'exception.",
    },
  ];

  const rawPhone = settings.whatsapp_phone || "212652535301";
  const waNumber = rawPhone.replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    isEn ? "Hello Maison Kenzi, I would like some advice on your fragrance collections." : "Bonjour Maison Kenzi, j'aimerais avoir des conseils sur vos collections de parfums."
  )}`;

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      <Seo
        title={isEn ? "About Maison Kenzi | Haute Parfumerie & Sealed Flacons" : "À Propos de Maison Kenzi | Haute Parfumerie & Flacons Originaux au Maroc"}
        description={isEn ? "Discover Maison Kenzi: uncompromising standards of haute parfumerie. 100% sealed original flacons, insured shipping and secure online checkout." : "Découvrez l'univers Maison Kenzi : l'exigence de la haute parfumerie. Flacons complets 100% originaux scellés, livraison soignée et paiement sécurisé par internet."}
        path="/about"
      />
      <Header />

      <main className="flex-1 pb-20">
        {/* Luxury Hero Banner */}
        <section className="relative overflow-hidden border-b border-border/70 bg-gradient-to-b from-card/70 via-card/30 to-background pt-20 sm:pt-24 pb-16 px-4 sm:px-6">
          {/* Subtle Ambient Glows */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-[0.25em]">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>{isEn ? "House of Haute Parfumerie & Art" : "Maison de Haute Parfumerie & d'Art"}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-foreground font-bold tracking-tight">
              {isEn ? (
                <>The Art of Fragrance as a <span className="text-primary italic font-serif">Signature</span></>
              ) : (
                <>L'Art du Parfum comme <span className="text-primary italic font-serif">Signature</span></>
              )}
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
              {isEn
                ? "At Maison Kenzi, we curate the world's most prestigious perfume masterpieces, handcrafted creations, and timeless antiques to elevate every moment."
                : "Chez Maison Kenzi, nous sélectionnons les plus grands chefs-d'œuvre de la parfumerie mondiale, l'artisanat noble et les trésors d'époque pour sublimer chaque instant."}
            </p>

            {/* Quick Actions */}
            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs uppercase tracking-wider font-semibold h-11 px-7 shadow-md gap-2 cursor-pointer"
              >
                <Link to="/collection/all">
                  {isEn ? "Explore Collections" : "Explorer la Collection"} <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="rounded-full border-border hover:border-primary text-xs uppercase tracking-wider font-semibold h-11 px-7 cursor-pointer"
              >
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="gap-2 flex items-center">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  {isEn ? "Bespoke Consultation" : "Conseil Personnalisé"}
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Galerie Triptyque Photographique de Haute Joaillerie */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="group relative rounded-3xl overflow-hidden aspect-[4/5] border border-border/80 shadow-lg bg-card">
              <img
                src="https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=1000&auto=format&fit=crop"
                alt="Flacon de Haute Parfumerie Maison Kenzi"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-5 sm:p-6 flex flex-col justify-end">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#C9A96E]">
                  {isEn ? "Haute Parfumerie" : "Haute Parfumerie"}
                </span>
                <h3 className="font-serif text-lg sm:text-xl text-white font-medium">
                  {isEn ? "100% Original Flacons" : "Flacons 100% Originaux"}
                </h3>
                <p className="text-xs text-white/80 font-light mt-1">
                  {isEn ? "Factory sealed in original packaging." : "Scellés sous emballage officiel."}
                </p>
              </div>
            </div>

            <div className="group relative rounded-3xl overflow-hidden aspect-[4/5] border border-border/80 shadow-lg bg-card sm:-translate-y-4">
              <img
                src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1000&auto=format&fit=crop"
                alt="Matières Premières et Artisanat Noble"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-5 sm:p-6 flex flex-col justify-end">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#C9A96E]">
                  {isEn ? "Artisanship" : "Artisanat d'Art"}
                </span>
                <h3 className="font-serif text-lg sm:text-xl text-white font-medium">
                  {isEn ? "Ancestral Savoir-Faire" : "Savoir-Faire Ancestral"}
                </h3>
                <p className="text-xs text-white/80 font-light mt-1">
                  {isEn ? "Unique pieces handcrafted with love." : "Pièces uniques façonnées à la main."}
                </p>
              </div>
            </div>

            <div className="group relative rounded-3xl overflow-hidden aspect-[4/5] border border-border/80 shadow-lg bg-card">
              <img
                src="https://images.unsplash.com/photo-1544457070-4cd773b4d71e?q=80&w=1000&auto=format&fit=crop"
                alt="Trésors Antiques et Pièces Rares"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-5 sm:p-6 flex flex-col justify-end">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#C9A96E]">
                  {isEn ? "Rare Antiques" : "Objets Rares"}
                </span>
                <h3 className="font-serif text-lg sm:text-xl text-white font-medium">
                  {isEn ? "Timeless Antiques" : "Antiquités Intemporelles"}
                </h3>
                <p className="text-xs text-white/80 font-light mt-1">
                  {isEn ? "Precious collector treasures." : "Objets précieux de collection."}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-16 sm:space-y-24 mt-12 sm:mt-16">
          {/* Quote Manifest */}
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-card/80 backdrop-blur-xl p-8 sm:p-12 text-center shadow-lg">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <blockquote className="relative z-10 font-serif text-lg sm:text-2xl text-foreground italic font-light max-w-3xl mx-auto leading-relaxed">
              {isEn
                ? "« Offering every perfume enthusiast access to the world's purest olfactory creations, backed by the absolute certainty of a sealed original bottle and dedicated concierge care. »"
                : "« Offrir à chaque passionné au Maroc l'accès aux plus pures créations olfactives mondiales, avec la certitude d'un flacon d'origine scellé et l'excellence d'un service attentionné. »"}
            </blockquote>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-primary font-bold">
              <span>{isEn ? "— Maison Kenzi Philosophy" : "— Philosophie de la Maison Kenzi"}</span>
            </div>
          </div>

          {/* Section 50/50 : L'Atelier & La Passion du Beau */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-center bg-card/40 border border-border/80 rounded-3xl p-6 sm:p-10">
            <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-md border border-border">
              <img
                src="https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1200&auto=format&fit=crop"
                alt="Flacon précieux de parfum de niche"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute bottom-3 left-3 right-3 bg-black/60 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-white text-[11px] font-medium flex items-center justify-between">
                <span>{isEn ? "Haute Parfumerie Selection" : "Sélection Haute Parfumerie"}</span>
                <span className="text-[#C9A96E] font-bold">{isEn ? "100% Authentic" : "100% Authentique"}</span>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">
                {isEn ? "Detail & Perfection" : "L'Exigence du Détail"}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-foreground font-bold">
                {isEn ? "Precious Raw Ingredients for an Unforgettable Sillage" : "Des Matières Nobles pour un Sillage Unique"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed">
                {isEn
                  ? "Every creation curated by Maison Kenzi is rigorously chosen for the purity of its essences, the subtle harmony of its olfactory pyramid, and the remarkable longevity of its base notes."
                  : "Chaque création proposée par Maison Kenzi est rigoureusement choisie pour la pureté de ses essences, l'équilibre subtil de sa pyramide olfactive et la remarquable rémanence de ses notes de fond."}
              </p>
              <div className="pt-2 grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-secondary/50 border border-border flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium text-foreground">{isEn ? "Official factory seal" : "Blister officiel d'origine"}</span>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 border border-border flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium text-foreground">{isEn ? "Express shipping 24–48h" : "Livraison rapide 24–48h"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* The 4 Pillars */}
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">
                {isEn ? "Excellence & Standards" : "Excellence & Rigueur"}
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl text-foreground font-bold tracking-tight">
                {isEn ? "Our 4 Core Commitments" : "Nos 4 Engagements Majeurs"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-light">
                {isEn ? "Total traceability and bespoke luxury service designed for your satisfaction." : "Une traçabilité totale et un service haut de gamme pensé pour votre satisfaction."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {pillars.map((p, i) => {
                const Icon = p.icon;
                return (
                  <div
                    key={i}
                    className="bg-card/70 border border-border/80 hover:border-primary/40 rounded-3xl p-6 sm:p-8 space-y-4 transition-all duration-300 shadow-xs hover:shadow-md group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-secondary border border-border text-foreground">
                        {p.tag}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-serif text-lg sm:text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                        {p.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed">
                        {p.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* FAQ Accordion Section */}
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">
                {isEn ? "Frequently Asked Questions" : "Foire Aux Questions"}
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl text-foreground font-bold tracking-tight">
                {isEn ? "Common Questions" : "Vos Questions Fréquentes"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-light">
                {isEn ? "Everything you wish to know about our authentic flacons, shipping, and guarantees." : "Tout ce que vous souhaitez savoir sur nos parfums, la livraison et nos garanties."}
              </p>
            </div>

            <div className="max-w-3xl mx-auto space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openFaq === index;
                return (
                  <div
                    key={index}
                    className="border border-border/80 rounded-2xl bg-card/60 overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : index)}
                      className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-foreground hover:text-primary transition-colors cursor-pointer"
                    >
                      <span className="flex items-center gap-3">
                        <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                        <span>{faq.q}</span>
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-300 shrink-0 ${isOpen ? "rotate-180 text-primary" : ""
                          }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground font-light leading-relaxed border-t border-border/40 animate-in fade-in-0 duration-200">
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom VIP Invitation Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-card via-card/90 to-background border border-primary/30 p-8 sm:p-12 text-center space-y-6 shadow-xl">
            <div className="max-w-2xl mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mx-auto">
                <Crown className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-foreground font-bold">
                {isEn ? "Ready to Find Your Next Olfactory Signature?" : "Prêt à Trouver Votre Prochaine Signature ?"}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed">
                {isEn
                  ? "Explore our collections for men, women, and artisanal treasures, or contact our private concierge."
                  : "Explorez nos collections masculines, féminines et soins d'exception, ou contactez notre conciergerie privée."}
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs uppercase tracking-wider font-bold px-8 shadow-md gap-2 cursor-pointer"
              >
                <Link to="/collection/all">
                  <Sparkles className="w-4 h-4" /> {isEn ? "Explore Catalog" : "Explorer le Catalogue"}
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-border hover:border-primary text-xs uppercase tracking-wider font-bold px-8 cursor-pointer"
              >
                <Link to="/suivi-commande">
                  <Truck className="w-4 h-4 text-primary" /> {isEn ? "Track Order" : "Suivi de Commande"}
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                className="rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs uppercase tracking-wider font-bold px-8 shadow-md gap-2 cursor-pointer border-0"
              >
                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" /> {isEn ? "WhatsApp Direct" : "WhatsApp Direct"}
                </a>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;

