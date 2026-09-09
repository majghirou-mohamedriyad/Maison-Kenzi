import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import AboutSidebar from "../../components/about/AboutSidebar";

const Ingredients = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <div className="hidden lg:block"><AboutSidebar /></div>
        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
          <PageHeader
            title="Ingrédients & Authenticité"
            subtitle="La provenance, la matière, et la promesse d'un parfum véritable."
          />
          <ContentSection>
            <div className="space-y-6 max-w-3xl text-foreground/75 font-light leading-relaxed">
              <p>
                Chaque parfum proposé par Maison Kenzi provient d'un flacon original,
                acquis exclusivement auprès de distributeurs agréés par les maisons de parfumerie.
              </p>
              <p>
                Nous ne procédons à aucune dilution ni reformulation. Le parfum que vous recevez est
                identique, molécule par molécule, à celui vendu en boutique officielle.
              </p>
              <p>
                Tous nos décants sont conditionnés dans des flacons en verre teinté de haute qualité,
                protégeant la fragrance de la lumière et de l'oxydation.
              </p>
            </div>
          </ContentSection>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Ingredients;
