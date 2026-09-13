/**
 * Page Conditions Générales de Vente — Maison Kenzi
 * Présentation des conditions de vente, livraison au Maroc/Europe et vente définitive. Bilingue FR / EN.
 */
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import Seo from "@/components/Seo";
import { useLanguage } from "@/contexts/LanguageContext";

const TermsOfService = () => {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Seo
        title={isEn ? "Terms of Sale | Maison Kenzi" : "Conditions Générales de Vente | Maison Kenzi"}
        description={isEn ? "Maison Kenzi terms and conditions of sale." : "Conditions générales de vente et d'utilisation de Maison Kenzi."}
        path="/terms-of-service"
      />
      <Header />

      <main className="flex-1 pt-28 sm:pt-32 md:pt-36 pb-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <header className="mb-10 text-center space-y-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-light text-foreground">
              {isEn ? "Terms of Sale & Service" : "Conditions Générales de Vente"}
            </h1>
            <p className="text-xs uppercase tracking-widest text-primary font-bold">
              {isEn ? "Maison Kenzi · Prestige Standards" : "Maison Kenzi · Normes & Engagements"}
            </p>
          </header>

          <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-6 text-foreground/80 font-light leading-relaxed">
            <section className="p-6 rounded-2xl border border-border/80 bg-card/60 space-y-3">
              <h2 className="font-serif text-xl text-foreground font-semibold">
                {isEn ? "1. Products & Authenticity" : "1. Produits & Authenticité"}
              </h2>
              <p>
                {isEn
                  ? "All fragrances offered by Maison Kenzi are 100% genuine, brand-new and sealed in their original manufacturer packaging. Handcrafted pieces and antiques are individually curated and inspected."
                  : "L'ensemble des parfums proposés par Maison Kenzi sont 100% originaux, neufs et scellés dans leur conditionnement officiel sous blister. Les créations artisanales et antiquités font l'objet d'une sélection rigoureuse."}
              </p>
            </section>

            <section className="p-6 rounded-2xl border border-border/80 bg-card/60 space-y-3">
              <h2 className="font-serif text-xl text-foreground font-semibold">
                {isEn ? "2. Orders & Online Payment" : "2. Commandes & Règlements"}
              </h2>
              <p>
                {isEn
                  ? "Orders are confirmed upon secure online card payment. A unique MK reference tracking number is generated immediately to follow delivery status."
                  : "Toute commande est confirmée dès validation du paiement sécurisé par internet. Un numéro de référence MK unique est attribué pour le suivi en temps réel."}
              </p>
            </section>

            <section className="p-6 rounded-2xl border border-border/80 bg-card/60 space-y-3">
              <h2 className="font-serif text-xl text-foreground font-semibold">
                {isEn ? "3. Shipping & Delivery" : "3. Expédition & Délais de Livraison"}
              </h2>
              <p>
                {isEn
                  ? "Deliveries are dispatched within 24 to 48 hours throughout Morocco, and 3 to 5 business days in Europe. Every package is packed with reinforced protective cushioning."
                  : "Les livraisons sont assurées sous 24 à 48 heures ouvrées partout au Maroc et sous 3 à 5 jours ouvrés en Europe. Chaque colis est préparé avec calage antichoc haute protection."}
              </p>
            </section>

            <section className="p-6 rounded-2xl border border-border/80 bg-card/60 space-y-3">
              <h2 className="font-serif text-xl text-foreground font-semibold">
                {isEn ? "4. Final Sale & No Return Policy" : "4. Vente Définitive Sans Retour"}
              </h2>
              <p>
                {isEn
                  ? "To preserve the inviolable authenticity and strict hygiene standards of luxury sealed flacons for our clientele, all sales are final upon dispatch with no return or exchange."
                  : "Afin de garantir l'authenticité inviolable, l'hygiène stricte et la préservation olfactive irréprochable de chaque flacon scellé, toutes les ventes sont fermes et définitives dès expédition."}
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;