import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import AboutSidebar from "../../components/about/AboutSidebar";

const sizes = [
  {
    label: "5 ml — Découverte",
    desc: "Idéal pour découvrir un parfum sur plusieurs jours, ou pour glisser dans la poche d'une veste de voyage.",
    apps: "≈ 40 à 60 vaporisations",
  },
  {
    label: "10 ml — Voyage",
    desc: "Le format parfait pour vous accompagner partout — sac, valise, vestiaire — sans contrainte.",
    apps: "≈ 90 à 110 vaporisations",
  },
];

const GuideDesTailles = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <div className="hidden lg:block"><AboutSidebar /></div>
        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
          <PageHeader
            title="Guide des Décants"
            subtitle="Deux formats pensés pour chaque moment de votre vie."
          />
          <ContentSection>
            <div className="grid md:grid-cols-2 gap-8">
              {sizes.map((s) => (
                <div key={s.label} className="border border-border p-6 space-y-3">
                  <h3 className="font-serif text-2xl text-primary">{s.label}</h3>
                  <p className="text-sm text-foreground/75 font-light leading-relaxed">{s.desc}</p>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{s.apps}</p>
                </div>
              ))}
            </div>
          </ContentSection>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default GuideDesTailles;
