import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import AboutSidebar from "../../components/about/AboutSidebar";

const notreHistoireImg = "https://images.unsplash.com/photo-1615397349754-cfa2066a298e?q=80&w=1024&auto=format&fit=crop";

const NotreHistoire = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <div className="hidden lg:block"><AboutSidebar /></div>
        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
          <PageHeader
            title="Notre Histoire"
            subtitle="Une aura unique, une identité unique."
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
                <h3 className="font-serif text-2xl text-foreground">Maison Kenzi — Marque marocaine premium</h3>
                <p className="text-foreground/75 leading-relaxed font-light">
                  Maison Kenzi est une enseigne marocaine née d'une passion pour l'élégance olfactive et le bien-être.
                  Nous proposons des parfums homme & femme d'exception, des déodorants stick premium et des packs exclusifs
                  livrés directement chez vous partout au Maroc.
                </p>
                <p className="text-foreground/75 leading-relaxed font-light">
                  Chaque produit est 100% original et sélectionné avec rigueur pour vous offrir une expérience d'exception
                  avec la garantie d'une livraison rapide 24–48h et du paiement à la livraison.
                </p>
                <p className="text-foreground/75 leading-relaxed font-light italic">
                  « L'excellence, la confiance et l'élégance à chaque commande. »
                </p>
              </div>
            </div>
          </ContentSection>

          <ContentSection title="Nos valeurs">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="space-y-3">
                <h3 className="font-serif text-xl text-primary">Authenticité</h3>
                <p className="text-foreground/75 font-light">
                  100 % originaux, sourcés directement auprès de distributeurs agréés.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-serif text-xl text-primary">Précision</h3>
                <p className="text-foreground/75 font-light">
                  Un décantage manuel rigoureux, sans aucune altération du parfum.
                </p>
              </div>
              <div className="space-y-3">
                <h3 className="font-serif text-xl text-primary">Élégance</h3>
                <p className="text-foreground/75 font-light">
                  Un écrin sobre et raffiné pour révéler la quintessence de chaque fragrance.
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
