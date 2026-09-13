/**
 * Page Livraison & Expédition — Maison Kenzi
 * Présentation des options d'acheminement soigné au Maroc et en Europe.
 */
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import AboutSidebar from "../../components/about/AboutSidebar";
import { Truck, ShieldCheck, Globe, Clock } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const Livraison = () => {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <div className="hidden lg:block"><AboutSidebar /></div>
        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
          <PageHeader
            title={isEn ? "Shipping & Delivery" : "Livraison & Expédition"}
            subtitle={isEn ? "Secure, premium express delivery across Morocco and Europe." : "Un acheminement sécurisé et soigné, partout au Maroc et en Europe."}
          />
          <ContentSection>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl">
              <div className="space-y-3 p-5 rounded-2xl border border-border/60 bg-card/60">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-bold text-primary">
                  {isEn ? "Morocco Express" : "Maroc Express"}
                </h3>
                <p className="text-sm font-light text-foreground/80">
                  {isEn ? "Delivery within 24h to 48h across all cities in the Kingdom." : "Livraison sous 24h à 48h ouvrées dans toutes les villes du Royaume."}
                </p>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block pt-1">
                  {isEn ? "Insured premium parcel" : "Livraison soignée"}
                </span>
              </div>
              <div className="space-y-3 p-5 rounded-2xl border border-border/60 bg-card/60">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-bold text-primary">
                  {isEn ? "Europe Standard" : "Europe Standard"}
                </h3>
                <p className="text-sm font-light text-foreground/80">
                  {isEn ? "France, Belgium, Switzerland, Spain, Italy, Germany, and the UK (3 to 5 business days)." : "France, Belgique, Suisse, Espagne, Italie, Allemagne et Royaume-Uni (3 à 5 jours ouvrés)."}
                </p>
                <span className="text-xs font-semibold text-primary block pt-1">
                  {isEn ? "Live international tracking" : "Suivi international direct"}
                </span>
              </div>
              <div className="space-y-3 p-5 rounded-2xl border border-border/60 bg-card/60">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-bold text-primary">
                  {isEn ? "High Protection Packaging" : "Emballage Haute Protection"}
                </h3>
                <p className="text-sm font-light text-foreground/80">
                  {isEn ? "Factory sealed bottles in reinforced shockproof cases for total olfactory preservation." : "Flacons scellés sous étui rigide et calage antichoc pour une préservation olfactive totale."}
                </p>
                <span className="text-xs font-semibold text-muted-foreground block pt-1">
                  {isEn ? "Final sale • No returns" : "Vente définitive sans retour"}
                </span>
              </div>
            </div>
          </ContentSection>

          <ContentSection title={isEn ? "Destinations Served" : "Zones desservies"}>
            <p className="text-foreground/80 font-light max-w-3xl leading-relaxed">
              {isEn ? (
                <>
                  We ensure complete, insured shipping throughout <strong>Morocco</strong> (Casablanca, Rabat, Marrakech, Tangier, Fez, Agadir, Oujda, Meknes, etc.) as well as across <strong>Europe</strong> (France, Belgium, Switzerland, Spain, Italy, Germany, United Kingdom, Netherlands, Portugal, etc.). Every order receives a live tracking code accessible on our website.
                </>
              ) : (
                <>
                  Nous assurons une expédition complète et sécurisée partout au <strong>Maroc</strong> (Casablanca, Rabat, Marrakech, Tanger, Fès, Agadir, Oujda, Meknès, etc.) ainsi que dans toute l'<strong>Europe</strong> (France, Belgique, Suisse, Espagne, Italie, Allemagne, Royaume-Uni, Pays-Bas, Portugal, etc.). Chaque commande bénéficie d'un numéro de suivi direct accessible sur notre site.
                </>
              )}
            </p>
          </ContentSection>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Livraison;
