import { Instagram, MessageCircle, Phone, Sparkles } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";

const cleanDisplayPhone = (p?: string) => {
  if (!p || p.includes("6 63") || p.includes("663848099") || p.includes("600000000")) {
    return "+212 752-850156";
  }
  return p;
};

const cleanWhatsAppNumber = (p?: string) => {
  if (!p || p.includes("663848099") || p.includes("600000000")) {
    return "212652535301";
  }
  const digits = p.replace(/[^0-9]/g, "");
  return digits.length > 5 ? digits : "212652535301";
};

const Maintenance = () => {
  const { settings } = useAppSettings();

  const displayPhone = cleanDisplayPhone(settings.store_phone);
  const waPhone = cleanWhatsAppNumber(settings.whatsapp_phone || settings.store_phone);
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent("Bonjour Maison Kenzi, je souhaite me renseigner.")}`;

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col items-center justify-between p-6 bg-background text-foreground select-none relative">
      {/* Dynamic luxury ambient glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 sm:w-[550px] sm:h-[550px] bg-primary/12 rounded-full blur-[130px] pointer-events-none animate-pulse-glow" />
      <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-accent/8 rounded-full blur-[100px] pointer-events-none" />

      {/* Brand Logo Header */}
      <div className="pt-6 sm:pt-10 text-center z-10">
        <div className="relative group inline-block">
          <img
            src="/mk-logo-light-removebg.png"
            alt="Maison Kenzi"
            className="h-14 sm:h-20 w-auto object-contain dark:hidden mx-auto transition-transform duration-500 group-hover:scale-105"
          />
          <img
            src="/mk-logo-dark.png"
            alt="Maison Kenzi"
            className="h-14 sm:h-20 w-auto object-contain hidden dark:block mx-auto transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      </div>

      {/* Main Luxury Glass Card */}
      <div className="z-10 max-w-sm sm:max-w-md w-full bg-card/80 backdrop-blur-2xl border border-primary/20 rounded-3xl p-7 sm:p-9 text-center space-y-6 shadow-2xl transition-all duration-300 hover:border-primary/40">
        {/* Status Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-[11px] font-semibold uppercase tracking-widest shadow-xs">
          <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
          <Sparkles className="w-3.5 h-3.5" />
          <span>Maintenance</span>
        </div>

        {/* Title & Message */}
        <div className="space-y-2">
          <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Site en Maintenance
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed font-light px-2">
            {settings.maintenance_message || "Notre plateforme prépare de nouvelles mises à jour. Nous serons de retour très bientôt."}
          </p>
        </div>

        {/* Refined Luxury Contact Pills */}
        <div className="pt-4 border-t border-border/70 space-y-3">
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground block">
            Contact & Assistance
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border/80 hover:border-primary/40 text-foreground text-xs font-semibold transition-all duration-200 cursor-pointer group shadow-xs"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366] group-hover:scale-110 transition-transform" />
              <span>WhatsApp</span>
            </a>

            {settings.instagram_url && (
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border/80 hover:border-primary/40 text-foreground text-xs font-semibold transition-all duration-200 cursor-pointer group shadow-xs"
              >
                <Instagram className="w-4 h-4 text-[#E1306C] group-hover:scale-110 transition-transform" />
                <span>Instagram</span>
              </a>
            )}

            <a
              href={`tel:${displayPhone.replace(/\s+/g, "")}`}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-secondary/80 hover:bg-secondary border border-border/80 hover:border-primary/40 text-foreground text-xs font-semibold transition-all duration-200 cursor-pointer group shadow-xs"
            >
              <Phone className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
              <span className="truncate">{displayPhone}</span>
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pb-4 sm:pb-8 text-[11px] text-muted-foreground/80 font-light z-10 tracking-wider">
        © {new Date().getFullYear()} Maison Kenzi · Tous droits réservés
      </div>
    </div>
  );
};

export default Maintenance;
