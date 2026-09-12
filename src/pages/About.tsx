/**
 * Page À Propos — Maison Kenzi
 *
 * Présentation de l'histoire, des engagements d'authenticité (Flacons Complets 100% Scellés),
 * de la sélection des matières premières et du service de conciergerie au Maroc.
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

const pillars = [
  {
    icon: Crown,
    title: "100% Flacons Complets & Scellés",
    desc: "Chaque parfum est livré dans son flacon d'origine scellé sous blister avec packaging officiel complet. Zéro contrefaçon, zéro imitation : uniquement des pièces authentiques.",
    tag: "Origine Garantie",
  },
  {
    icon: Gem,
    title: "Haute Concentration & Extraits Nobles",
    desc: "Nous sélectionnons rigoureusement des Eaux de Parfum et Extraits de Parfum aux matières premières précieuses, garantissant un sillage mémorable et une tenue remarquable tout au long de la journée.",
    tag: "Pureté & Tenue",
  },
  {
    icon: Truck,
    title: "Livraison Express Partout au Maroc",
    desc: "Expédition sécurisée sous 24 à 48 heures dans toutes les villes du Royaume (Casablanca, Rabat, Marrakech, Tanger, Fès, Agadir...) avec emballage haute protection anti-choc.",
    tag: "24–48h à Domicile",
  },
  {
    icon: PackageCheck,
    title: "Paiement en Espèces à la Réception",
    desc: "Commandez en toute confiance : vous ne réglez votre achat qu'au moment où le livreur vous remet votre précieux colis en mains propres à votre adresse.",
    tag: "Sérénité Totale",
  },
];

const faqs = [
  {
    q: "Les parfums vendus par Maison Kenzi sont-ils 100% originaux ?",
    a: "Absolument. Chez Maison Kenzi, l'authenticité est notre premier engagement. Tous nos parfums sont des flacons complets originaux scellés dans leur boîte d'origine sous blister, issus directement des circuits officiels des plus grandes maisons de création.",
  },
  {
    q: "Sous quel délai ma commande est-elle livrée au Maroc ?",
    a: "Nos commandes sont traitées le jour même et livrées en 24 à 48 heures partout au Maroc. Vous recevez un numéro de suivi de commande en direct (`MK-XXXXXX`) pour suivre l'acheminement de votre colis en temps réel.",
  },
  {
    q: "Quels sont les modes de paiement acceptés ?",
    a: "Nous privilégions le paiement en espèces à la livraison (Cash on Delivery). Vous payez le montant exact de votre commande directement au livreur lors de la remise en mains propres.",
  },
  {
    q: "Comment puis-je être conseillé pour choisir mon parfum ?",
    a: "Notre service de conciergerie privée est disponible 7j/7 sur WhatsApp pour vous orienter selon vos notes olfactives de prédilection, la saison, l'occasion ou pour vous aider à composer un cadeau d'exception.",
  },
];

const About = () => {
  const { settings } = useAppSettings();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const rawPhone = settings.whatsapp_phone || "212652535301";
  const waNumber = rawPhone.replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    "Bonjour Maison Kenzi, j'aimerais avoir des conseils sur vos collections de parfums."
  )}`;

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      <Seo
        title="À Propos de Maison Kenzi | Haute Parfumerie & Flacons Originaux au Maroc"
        description="Découvrez l'univers Maison Kenzi : l'exigence de la haute parfumerie au Maroc. Flacons complets 100% originaux scellés, livraison express 24-48h et paiement à la livraison."
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
              <span>Maison de Haute Parfumerie & d'Art</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-foreground font-bold tracking-tight">
              L'Art du Parfum comme <span className="text-primary italic font-serif">Signature</span>
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
              Chez Maison Kenzi, nous sélectionnons les plus grands chefs-d'œuvre de la parfumerie mondiale, l'artisanat noble et les trésors d'époque pour sublimer chaque instant.
            </p>

            {/* Quick Actions */}
            <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
              <Button
                asChild
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs uppercase tracking-wider font-semibold h-11 px-7 shadow-md gap-2 cursor-pointer"
              >
                <Link to="/collection/all">
                  Explorer la Collection <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                className="rounded-full border-border hover:border-primary text-xs uppercase tracking-wider font-semibold h-11 px-7 cursor-pointer"
              >
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="gap-2 flex items-center">
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  Conseil Personnalisé
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
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#C9A96E]">Haute Parfumerie</span>
                <h3 className="font-serif text-lg sm:text-xl text-white font-medium">Flacons 100% Originaux</h3>
                <p className="text-xs text-white/80 font-light mt-1">Scellés sous emballage officiel.</p>
              </div>
            </div>

            <div className="group relative rounded-3xl overflow-hidden aspect-[4/5] border border-border/80 shadow-lg bg-card sm:-translate-y-4">
              <img
                src="https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1000&auto=format&fit=crop"
                alt="Matières Premières et Artisanat Noble"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-5 sm:p-6 flex flex-col justify-end">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#C9A96E]">Artisanat d'Art</span>
                <h3 className="font-serif text-lg sm:text-xl text-white font-medium">Savoir-Faire Ancestral</h3>
                <p className="text-xs text-white/80 font-light mt-1">Pièces uniques façonnées à la main.</p>
              </div>
            </div>

            <div className="group relative rounded-3xl overflow-hidden aspect-[4/5] border border-border/80 shadow-lg bg-card">
              <img
                src="https://images.unsplash.com/photo-1544457070-4cd773b4d71e?q=80&w=1000&auto=format&fit=crop"
                alt="Trésors Antiques et Pièces Rares"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent p-5 sm:p-6 flex flex-col justify-end">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#C9A96E]">Objets Rares</span>
                <h3 className="font-serif text-lg sm:text-xl text-white font-medium">Antiquités Intemporelles</h3>
                <p className="text-xs text-white/80 font-light mt-1">Objets précieux de collection.</p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-16 sm:space-y-24 mt-12 sm:mt-16">
          {/* Quote Manifest */}
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-card/80 backdrop-blur-xl p-8 sm:p-12 text-center shadow-lg">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <blockquote className="relative z-10 font-serif text-lg sm:text-2xl text-foreground italic font-light max-w-3xl mx-auto leading-relaxed">
              « Offrir à chaque passionné au Maroc l'accès aux plus pures créations olfactives mondiales, avec la certitude d'un flacon d'origine scellé et l'excellence d'un service attentionné. »
            </blockquote>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-primary font-bold">
              <span>— Philosophie de la Maison Kenzi</span>
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
                <span>Sélection Haute Parfumerie</span>
                <span className="text-[#C9A96E] font-bold">100% Authentique</span>
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">
                L'Exigence du Détail
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl text-foreground font-bold">
                Des Matières Nobles pour un Sillage Unique
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed">
                Chaque création proposée par Maison Kenzi est rigoureusement choisie pour la pureté de ses essences, l'équilibre subtil de sa pyramide olfactive et la remarquable rémanence de ses notes de fond.
              </p>
              <div className="pt-2 grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-secondary/50 border border-border flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium text-foreground">Blister officiel d'origine</span>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50 border border-border flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-medium text-foreground">Livraison rapide 24–48h</span>
                </div>
              </div>
            </div>
          </div>

          {/* The 4 Pillars */}
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">
                Excellence & Rigueur
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl text-foreground font-bold tracking-tight">
                Nos 4 Engagements Majeurs
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-light">
                Une traçabilité totale et un service haut de gamme pensé pour votre satisfaction.
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
                Foire Aux Questions
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl text-foreground font-bold tracking-tight">
                Vos Questions Fréquentes
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-light">
                Tout ce que vous souhaitez savoir sur nos parfums, la livraison et nos garanties.
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
                Prêt à Trouver Votre Prochaine Signature ?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed">
                Explorez nos collections masculines, féminines et soins d'exception, ou contactez notre conciergerie privée.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs uppercase tracking-wider font-bold px-8 shadow-md gap-2 cursor-pointer"
              >
                <Link to="/collection/all">
                  <Sparkles className="w-4 h-4" /> Explorer le Catalogue
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-border hover:border-primary text-xs uppercase tracking-wider font-bold px-8 cursor-pointer"
              >
                <Link to="/suivi-commande">
                  <Truck className="w-4 h-4 text-primary" /> Suivi de Commande
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                className="rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white text-xs uppercase tracking-wider font-bold px-8 shadow-md gap-2 cursor-pointer border-0"
              >
                <a href={waUrl} target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="w-4 h-4" /> WhatsApp Direct
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

