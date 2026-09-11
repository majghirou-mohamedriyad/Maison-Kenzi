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
        title="Maison Kenzi | Parfums & Déodorants Premium au Maroc"
        description="Découvrez les parfums homme, parfums femme, déodorants stick et packs premium Maison Kenzi. Des fragrances élégantes et des soins de qualité, livraison rapide au Maroc et paiement à la livraison."
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
