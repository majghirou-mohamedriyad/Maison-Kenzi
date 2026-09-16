import Header from "../components/header/Header";
import Footer from "../components/footer/Footer";
import LargeHero from "../components/content/LargeHero";
import FiftyFiftySection from "../components/content/FiftyFiftySection";
import ProductCarousel from "../components/content/ProductCarousel";
import DecantGuideSection from "../components/content/DecantGuideSection";
import EditorialSection from "../components/content/EditorialSection";
import HomeContactForm from "../components/content/HomeContactForm";
import Seo from "../components/Seo";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Maison Kenzi | Haute Parfumerie, Cosmétique & Bazar Chic"
        description="Boutique officielle Maison Kenzi : haute parfumerie, soins cosmétiques, créations artisanales et sélection bazar chic. Paiement sécurisé et livraison rapide."
        path="/"
        ogType="website"
      />
      <Header />
      <main className="pt-0">
        <LargeHero />
        <FiftyFiftySection />
        <ProductCarousel />
        <DecantGuideSection />
        <EditorialSection />
        <HomeContactForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
