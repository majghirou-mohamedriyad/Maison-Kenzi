import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import AboutSidebar from "../../components/about/AboutSidebar";

const Livraison = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <div className="hidden lg:block"><AboutSidebar /></div>
        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
          <PageHeader
            title="Livraison"
            subtitle="Un acheminement soigné, partout au Maroc."
          />
          <ContentSection>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl">
              <div className="space-y-3">
                <h3 className="font-serif text-xl text-primary">Standard</h3>
                <p className="text-sm font-light text-foreground/75">Offerte · 3 à 5 jours ouvrés.</p>
              </div>
              <div className="space-y-3">
                <h3 className="font-serif text-xl text-primary">Express</h3>
                <p className="text-sm font-light text-foreground/75">60 MAD · 1 à 2 jours ouvrés.</p>
              </div>
              <div className="space-y-3">
                <h3 className="font-serif text-xl text-primary">Lendemain</h3>
                <p className="text-sm font-light text-foreground/75">120 MAD · livraison J+1 ouvré.</p>
              </div>
            </div>
          </ContentSection>

          <ContentSection title="Zones desservies">
            <p className="text-foreground/75 font-light max-w-3xl leading-relaxed">
              Nous livrons dans toutes les grandes villes du Maroc : Casablanca, Rabat, Marrakech,
              Tanger, Fès, Agadir, et bien d'autres. Pour les zones rurales, contactez-nous pour
              une estimation personnalisée.
            </p>
          </ContentSection>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Livraison;
