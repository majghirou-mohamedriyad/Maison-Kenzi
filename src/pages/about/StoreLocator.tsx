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

const Livraison = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <div className="hidden lg:block"><AboutSidebar /></div>
        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
          <PageHeader
            title="Livraison & Expédition"
            subtitle="Un acheminement sécurisé et soigné, partout au Maroc et en Europe."
          />
          <ContentSection>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl">
              <div className="space-y-3 p-5 rounded-2xl border border-border/60 bg-card/60">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <Truck className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-bold text-primary">Maroc Express</h3>
                <p className="text-sm font-light text-foreground/80">Livraison sous 24h à 48h ouvrées dans toutes les villes du Royaume.</p>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block pt-1">Livraison soignée</span>
              </div>
              <div className="space-y-3 p-5 rounded-2xl border border-border/60 bg-card/60">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <Globe className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-bold text-primary">Europe Standard</h3>
                <p className="text-sm font-light text-foreground/80">France, Belgique, Suisse, Espagne, Italie, Allemagne et Royaume-Uni (3 à 5 jours ouvrés).</p>
                <span className="text-xs font-semibold text-primary block pt-1">Suivi international direct</span>
              </div>
              <div className="space-y-3 p-5 rounded-2xl border border-border/60 bg-card/60">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-2">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-serif text-lg font-bold text-primary">Emballage Haute Protection</h3>
                <p className="text-sm font-light text-foreground/80">Flacons scellés sous étui rigide et calage antichoc pour une préservation olfactive totale.</p>
                <span className="text-xs font-semibold text-muted-foreground block pt-1">Vente définitive sans retour</span>
              </div>
            </div>
          </ContentSection>

          <ContentSection title="Zones desservies">
            <p className="text-foreground/80 font-light max-w-3xl leading-relaxed">
              Nous assurons une expédition complète et sécurisée partout au <strong>Maroc</strong> (Casablanca, Rabat, Marrakech, Tanger, Fès, Agadir, Oujda, Meknès, etc.) ainsi que dans toute l'<strong>Europe</strong> (France, Belgique, Suisse, Espagne, Italie, Allemagne, Royaume-Uni, Pays-Bas, Portugal, etc.). Chaque commande bénéficie d'un numéro de suivi direct accessible sur notre site.
            </p>
          </ContentSection>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Livraison;
