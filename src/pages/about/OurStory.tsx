/**
 * Page Notre Histoire — Maison Kenzi
 * Présentation de l'héritage et des valeurs de la maison en français et anglais.
 */
import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import AboutSidebar from "../../components/about/AboutSidebar";
import { useLanguage } from "@/contexts/LanguageContext";

const notreHistoireImg = "https://images.unsplash.com/photo-1547887537-6158d64c35b3?q=80&w=1024&auto=format&fit=crop";

const NotreHistoire = () => {
  const { language } = useLanguage();
  const isEn = language === "en";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <div className="hidden lg:block"><AboutSidebar /></div>
        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
          <PageHeader
            title={isEn ? "Our Story" : "Notre Histoire"}
            subtitle={isEn ? "A unique aura, a distinctive identity." : "Une aura unique, une identité unique."}
          />

          <ContentSection>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="overflow-hidden rounded-lg aspect-square bg-muted">
                <img
                  src={notreHistoireImg}
                  alt="Atelier Maison Kenzi — parfums & soins premium"
                  width={1024}
                  height={1024}
                  loading="lazy"
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                />
              </div>
              <div className="space-y-6">
                <h3 className="font-serif text-2xl text-foreground">
                  {isEn ? "Maison Kenzi — Premium Moroccan Brand" : "Maison Kenzi — Marque marocaine premium"}
                </h3>
                <p className="text-foreground/75 leading-relaxed font-light">
                  {isEn
                    ? "Maison Kenzi is a Moroccan house born from a passion for olfactory elegance and well-being. We offer exceptional fragrances for men and women, premium deodorants and exclusive curated packages delivered directly to your doorstep across Morocco and Europe."
                    : "Maison Kenzi est une enseigne marocaine née d'une passion pour l'élégance olfactive et le bien-être. Nous proposons des parfums homme & femme d'exception, des déodorants stick premium et des packs exclusifs livrés directement chez vous partout au Maroc et en Europe."}
                </p>
                <p className="text-foreground/75 leading-relaxed font-light">
                  {isEn
                    ? "Every creation is 100% original, sealed and rigorously curated to deliver an extraordinary experience with the assurance of careful parcel protection and secure online payment."
                    : "Chaque produit est 100% original et sélectionné avec rigueur pour vous offrir une expérience d'exception avec la garantie d'une expédition soignée et du paiement sécurisé par internet."}
                </p>
                <p className="text-foreground/75 leading-relaxed font-light italic">
                  {isEn ? "« Excellence, trust and elegance in every single order. »" : "« L'excellence, la confiance et l'élégance à chaque commande. »"}
                </p>
              </div>
            </div>
          </ContentSection>

          <ContentSection title={isEn ? "Our Values" : "Nos valeurs"}>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <h3 className="font-serif text-xl text-primary">{isEn ? "Authenticity" : "Authenticité"}</h3>
                <p className="text-foreground/75 font-light">
                  {isEn ? "100% original sealed bottles sourced directly from authorized distributors." : "100 % originaux, sourcés directement auprès de distributeurs agréés."}
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-serif text-xl text-primary">{isEn ? "Precision" : "Précision"}</h3>
                <p className="text-foreground/75 font-light">
                  {isEn ? "Rigorous quality inspection without any alteration to the original fragrance composition." : "Une inspection rigoureuse sans aucune altération de la composition originale du parfum."}
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-serif text-xl text-primary">{isEn ? "Elegance" : "Élégance"}</h3>
                <p className="text-foreground/75 font-light">
                  {isEn ? "A refined presentation case designed to reveal the pure quintessence of each sillage." : "Un écrin sobre et raffiné pour révéler la quintessence de chaque fragrance."}
                </p>
              </div>
            </div>
          </ContentSection>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default NotreHistoire;
