/**
 * Page Politique de Confidentialité — Maison Kenzi
 * Conforme au RGPD, loi 09-08 marocaine et standards de sécurité. Bilingue FR / EN.
 */
import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import Seo from "@/components/Seo";
import { useLanguage } from "@/contexts/LanguageContext";

const PrivacyPolicy = () => {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Seo
        title={isEn ? "Privacy Policy | Maison Kenzi" : "Politique de Confidentialité | Maison Kenzi"}
        description={isEn ? "Maison Kenzi privacy policy and personal data protection." : "Politique de confidentialité et protection des données personnelles de Maison Kenzi."}
        path="/privacy-policy"
      />
      <Header />

      <main className="flex-1 pt-28 sm:pt-32 md:pt-36 pb-16">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <header className="mb-10 text-center space-y-2">
            <h1 className="font-serif text-3xl sm:text-4xl font-light text-foreground">
              {isEn ? "Privacy Policy" : "Politique de Confidentialité"}
            </h1>
            <p className="text-xs uppercase tracking-widest text-primary font-bold">
              {isEn ? "Protection of Personal Data" : "Protection des Données Personnelles"}
            </p>
          </header>

          <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none space-y-6 text-foreground/80 font-light leading-relaxed">
            <section className="p-6 rounded-2xl border border-border/80 bg-card/60 space-y-3">
              <h2 className="font-serif text-xl text-foreground font-semibold">
                {isEn ? "1. Introduction & Commitments" : "1. Introduction & Engagements"}
              </h2>
              <p>
                {isEn
                  ? "Maison Kenzi is committed to protecting the privacy of our clients and website visitors. This privacy policy explains our practices regarding the collection, processing, and safeguarding of your personal data."
                  : "Maison Kenzi s'engage à respecter la vie privée de ses clients et des visiteurs de son site. La présente politique détaille nos pratiques concernant la collecte, le traitement et la sécurisation de vos données personnelles conformément à la législation en vigueur."}
              </p>
            </section>

            <section className="p-6 rounded-2xl border border-border/80 bg-card/60 space-y-3">
              <h2 className="font-serif text-xl text-foreground font-semibold">
                {isEn ? "2. Data Collected" : "2. Données Collectées"}
              </h2>
              <p>
                {isEn
                  ? "When you place an order or contact our concierge, we collect necessary information such as your full name, phone number, shipping address, and order references for fulfillment and support."
                  : "Lors de vos commandes ou échanges avec notre conciergerie, nous collectons les informations strictement nécessaires à la bonne exécution des prestations : nom, prénom, numéro de téléphone, adresse exacte de livraison et historique des commandes."}
              </p>
            </section>

            <section className="p-6 rounded-2xl border border-border/80 bg-card/60 space-y-3">
              <h2 className="font-serif text-xl text-foreground font-semibold">
                {isEn ? "3. Security & Payments" : "3. Sécurité & Règlements"}
              </h2>
              <p>
                {isEn
                  ? "All online transactions are protected using advanced 256-bit SSL encryption. We never store complete credit card details on our local servers."
                  : "Les paiements par internet s'effectuent via des protocoles chiffrés sécurisés SSL 256-bit. Aucune donnée bancaire complète n'est stockée sur nos serveurs."}
              </p>
            </section>

            <section className="p-6 rounded-2xl border border-border/80 bg-card/60 space-y-3">
              <h2 className="font-serif text-xl text-foreground font-semibold">
                {isEn ? "4. Final Sale Policy" : "4. Vente Définitive & Intégrité"}
              </h2>
              <p>
                {isEn
                  ? "To preserve strict hygiene, fragrance purity, and official manufacturer seal integrity, all perfume sales are final upon dispatch. No returns or exchanges are accepted."
                  : "Pour des raisons strictes d'hygiène, d'authenticité et d'intégrité olfactive des flacons scellés, l'ensemble des ventes de parfums sont définitives dès expédition du colis."}
              </p>
            </section>

            <section className="p-6 rounded-2xl border border-border/80 bg-card/60 space-y-3">
              <h2 className="font-serif text-xl text-foreground font-semibold">
                {isEn ? "5. Contact Our Concierge" : "5. Contact & Conciergerie"}
              </h2>
              <p>
                {isEn
                  ? "For any inquiry regarding your personal data or order history, our concierge is available 7/7 on WhatsApp or via contact@maisonkenzi.com."
                  : "Pour toute demande relative à vos données personnelles ou pour exercer vos droits d'accès et de rectification, notre équipe est joignable 7j/7 sur WhatsApp ou par courriel à contact@maisonkenzi.com."}
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PrivacyPolicy;