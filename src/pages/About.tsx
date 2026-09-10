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
  CreditCard,
  Headphones,
  HeartHandshake,
  ArrowRight,
  CheckCircle2,
  Crown,
  Droplets,
  HelpCircle,
  ChevronDown,
  MessageCircle,
  Award,
  Flame,
  Flower2,
} from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";

const pillars = [
  {
    icon: Droplets,
    title: "Décantation Artisanale & Stérilisée",
    desc: "Chaque parfum est prélevé à la commande à l'aide de matériel de précision à usage unique. Le liquide est transféré dans des atomiseurs en verre hermétiques pour préserver l'intégrité de la pyramide olfactive.",
    tag: "Précision Médicale",
  },
  {
    icon: ShieldCheck,
    title: "100% Authenticité Garantie",
    desc: "Nous nous approvisionnons exclusivement auprès des circuits officiels et distributeurs agréés des plus grandes maisons de niche et de luxe. Zéro contrefaçon, zéro imitation.",
    tag: "Flacons Originaux",
  },
  {
    icon: Crown,
    title: "Formats Idéaux (5ml & 10ml)",
    desc: "Testez les plus grands chefs-d'œuvre de la parfumerie sur votre peau pendant plusieurs semaines avant d'investir dans un flacon complet. Environ 70 pulvérisations pour 5ml et 140 pour 10ml.",
    tag: "Découverte Nomade",
  },
  {
    icon: Truck,
    title: "Livraison Rapide Partout au Maroc",
    desc: "Vos précieux flacons sont emballés dans des écrins protecteurs anti-chocs et expédiés sous 24 à 48 heures avec paiement à la livraison à Casablanca, Rabat, Marrakech, Tanger et dans toutes les villes du Royaume.",
    tag: "24–48h à Domicile",
  },
];

const faqs = [
  {
    q: "Qu'est-ce qu'un décant de parfum ?",
    a: "Un décant est une fraction d'un flacon original de parfum, prélevée minutieusement et transférée dans un atomiseur compact en verre de haute qualité. Cela vous permet d'accéder aux plus grandes créations de luxe à une fraction du prix d'un flacon complet.",
  },
  {
    q: "Les parfums sont-ils vraiment originaux ?",
    a: "Absolument. Chez Maison Kenzi, nous n'utilisons aucun clone ni parfum générique. Tous nos décants proviennent directement des flacons d'origine des marques officielles (Maison Francis Kurkdjian, BDK, Creed, Tom Ford, Initio, Xerjoff...).",
  },
  {
    q: "Combien de temps durent les formats 5ml et 10ml ?",
    a: "Un format 5ml offre environ 70 à 80 vaporisations (soit environ 3 à 4 semaines d'utilisation quotidienne). Le format 10ml offre entre 140 et 160 vaporisations (environ 2 mois d'usage régulier).",
  },
  {
    q: "Comment sont protégés les flacons durant l'expédition ?",
    a: "Chaque atomiseur est scellé avec un film étanche et conditionné dans un emballage rembourré sur-mesure pour empêcher toute évaporation ou casse durant le transport.",
  },
];

const About = () => {
  const { settings } = useAppSettings();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const rawPhone = settings.whatsapp_phone || "212752850156";
  const waNumber = rawPhone.replace(/[^0-9]/g, "");
  const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent("Bonjour Maison Kenzi, j'aimerais avoir des informations sur vos parfums.")}`;

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      <Seo
        title="À Propos de Maison Kenzi | Maison de Haute Parfumerie & Décantation au Maroc"
        description="Découvrez l'univers Maison Kenzi : l'art de la haute parfumerie accessible au Maroc grâce à la décantation artisanale de fragrances 100% authentiques."
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
              <span>Maison de Haute Parfumerie</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl text-foreground font-bold tracking-tight">
              L'Art du Parfum comme <span className="text-primary italic font-serif">Signature</span>
            </h1>

            <p className="text-sm sm:text-base text-muted-foreground font-light leading-relaxed max-w-2xl mx-auto">
              Chez Maison Kenzi, nous croyons qu'un parfum est bien plus qu'une fragrance. C'est une émotion vivante, un sillage inoubliable et l'expression la plus intime de votre personnalité.
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

        <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-16 sm:space-y-24 mt-12 sm:mt-16">
          {/* Quote Manifest */}
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-card/80 backdrop-blur-xl p-8 sm:p-12 text-center shadow-lg">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-2xl pointer-events-none" />
            <blockquote className="relative z-10 font-serif text-lg sm:text-2xl text-foreground italic font-light max-w-3xl mx-auto leading-relaxed">
              « Démocratiser l'accès aux plus grands trésors de la haute parfumerie mondiale au Maroc, en garantissant une authenticité absolue et une expérience olfactive d'exception. »
            </blockquote>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-primary font-bold">
              <span>— Philosophie de la Maison Kenzi</span>
            </div>
          </div>

          {/* The 4 Pillars */}
          <div className="space-y-8">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">
                Excellence & Rigueur
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl text-foreground font-bold tracking-tight">
                Les 4 Piliers de l'Engagement Maison Kenzi
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-light">
                Un processus rigoureux à chaque étape pour vous garantir le meilleur de la décantation artisanale.
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
                Tout Savoir sur nos Décants
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-light">
                Des réponses transparentes à toutes vos interrogations sur la provenance et l'utilisation.
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
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-300 shrink-0 ${
                          isOpen ? "rotate-180 text-primary" : ""
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

          {/* Bottom Luxury VIP Invitation Card */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-card via-card/90 to-background border border-primary/30 p-8 sm:p-12 text-center space-y-6 shadow-xl">
            <div className="max-w-2xl mx-auto space-y-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mx-auto">
                <Crown className="w-6 h-6" />
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-foreground font-bold">
                Prêt à Trouver Votre Prochaine Signature ?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed">
                Explorez nos collections masculines, féminines et coffrets exclusifs, ou laissez notre conseiller vous orienter selon vos goûts.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                asChild
                size="lg"
                className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground text-xs uppercase tracking-wider font-bold px-8 shadow-md gap-2 cursor-pointer"
              >
                <Link to="/collection/homme">
                  <Flame className="w-4 h-4" /> Parfums Homme
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-border hover:border-primary text-xs uppercase tracking-wider font-bold px-8 cursor-pointer"
              >
                <Link to="/collection/femme">
                  <Flower2 className="w-4 h-4 text-primary" /> Parfums Femme
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
