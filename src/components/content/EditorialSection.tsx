import { Link } from "react-router-dom";
import { Truck, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";

const kpis = [
  {
    number: "01",
    icon: Truck,
    title: "Livraison Rapide",
    description: "24–48h partout au Maroc.",
    detail: "Expédition express sécurisée",
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "Paiement à la Livraison",
    description: "Achetez en toute confiance",
    detail: "Règlement à la réception",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Qualité Premium",
    description: "Produits soigneusement sélectionnés",
    detail: "100% Produits Authentiques",
  },
];

const EditorialSection = () => {
  return (
    <section className="w-full mb-10 sm:mb-24 px-3 sm:px-6 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-12">
        <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-primary font-semibold mb-1.5">
          L'Engagement Maison Kenzi
        </p>
        <h2 className="font-serif text-xl sm:text-4xl text-foreground tracking-tight mb-2 font-bold">
          Pourquoi Choisir <span className="text-primary italic font-serif">Maison Kenzi</span> ?
        </h2>
        <div className="w-10 h-0.5 bg-primary/40 mx-auto rounded-full" />
      </div>

      {/* 3 KPI Luxury Banner / Grid */}
      <div className="relative rounded-2xl sm:rounded-3xl border border-primary/20 bg-card/40 backdrop-blur-md p-3 sm:p-8 shadow-sm overflow-hidden">
        {/* Subtle background glow pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-primary/15 relative z-10 gap-3 sm:gap-0">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <div
                key={index}
                className="group relative px-3 sm:px-6 py-3.5 sm:py-6 transition-all duration-500 hover:bg-primary/[0.03] flex flex-col justify-between"
              >
                {/* Number & Icon Row */}
                <div>
                  <div className="flex items-center justify-between mb-2.5 sm:mb-5">
                    <div className="w-8 h-8 sm:w-11 sm:h-11 rounded-full border border-primary/25 bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all duration-500">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <span className="font-serif text-lg sm:text-2xl font-light text-primary/40 group-hover:text-primary transition-colors duration-500">
                      {kpi.number}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-serif text-sm sm:text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors duration-300">
                    {kpi.title}
                  </h3>

                  {/* Main Description */}
                  <p className="text-[11px] sm:text-sm font-light text-muted-foreground leading-relaxed mb-2.5 sm:mb-4">
                    {kpi.description}
                  </p>
                </div>

                {/* Footer Tag */}
                <div className="pt-2 border-t border-primary/10 flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors duration-300">
                  <span>{kpi.detail}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 group-hover:bg-primary transition-all duration-300" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Link */}
      <div className="mt-6 sm:mt-10 text-center">
        <Link
          to="/about/service-client"
          className="inline-flex items-center gap-2 text-[10px] sm:text-xs uppercase tracking-[0.2em] text-primary hover:text-primary-hover hover:gap-3 transition-all font-semibold py-2 px-5 rounded-full border border-primary/25 hover:border-primary/50 hover:bg-primary/5"
        >
          Service Client & Contact <ArrowRight size={13} />
        </Link>
      </div>
    </section>
  );
};

export default EditorialSection;
