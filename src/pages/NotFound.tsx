/**
 * Page 404 Introuvable — Maison Kenzi
 *
 * Page d'erreur personnalisée dans l'univers Haute Parfumerie, avec navigation
 * de secours vers les collections, le catalogue et la conciergerie privée.
 */

import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";
import Seo from "@/components/Seo";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Compass,
  ArrowRight,
  MessageCircle,
  Truck,
  ShoppingBag,
  Flame,
  Home,
} from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";

const NotFound = () => {
  const location = useLocation();
  const { settings } = useAppSettings();

  const rawPhone = settings.whatsapp_phone || settings.store_phone || "212752850156";
  const waNumber = rawPhone.replace(/[^0-9]/g, "") || "212752850156";
  const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    "Bonjour Maison Kenzi, je recherche un parfum particulier qui semble introuvable sur le site."
  )}`;

  useEffect(() => {
    console.warn("404 Not Found — Tentative d'accès à la route :", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex flex-col selection:bg-primary/20">
      <Seo
        title="Page Introuvable (404) | Maison Kenzi"
        description="La création ou la page que vous recherchez n'est plus disponible ou a été déplacée. Explorez nos collections de parfums 100% authentiques au Maroc."
        path="/404"
      />
      <Header />

      <main className="flex-1 flex flex-col justify-center items-center py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
        {/* Subtle Luxury Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 sm:w-[500px] h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl mx-auto text-center space-y-6 relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-[0.25em]">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Sillage Égaré · Erreur 404</span>
          </div>

          {/* Luxury Large 404 Display */}
          <div className="relative">
            <h1 className="font-serif text-7xl sm:text-9xl font-bold tracking-tight text-foreground/10 select-none">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <h2 className="font-serif text-2xl sm:text-4xl text-foreground font-bold max-w-lg px-2">
                Cette fragrance semble s'être <span className="text-primary italic font-serif">évaporée</span>
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed max-w-md mx-auto">
            La page ou la création que vous recherchez a été déplacée ou n'est plus accessible. Laissez-vous guider vers nos collections de Haute Parfumerie.
          </p>

          {/* Primary Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Button
              asChild
              className="rounded-full bg-primary hover:bg-primary-hover text-primary-foreground font-bold text-xs uppercase tracking-wider h-11 px-6 shadow-md hover:shadow-lg hover:shadow-primary/25 transition-all gap-2 cursor-pointer"
            >
              <Link to="/">
                <Home className="w-4 h-4" />
                <span>Retour à l'Accueil</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="rounded-full border-border hover:border-primary text-foreground font-semibold text-xs uppercase tracking-wider h-11 px-6 transition-colors gap-2 cursor-pointer"
            >
              <Link to="/collection/all">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>Explorer le Catalogue</span>
              </Link>
            </Button>
          </div>

          {/* Quick Discovery Cards */}
          <div className="pt-8 border-t border-border/60 max-w-xl mx-auto">
            <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-4">
              Ou explorez directement nos univers
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
              <Link
                to="/collection/homme"
                className="group p-3.5 rounded-xl border border-border/80 bg-card/60 hover:bg-card hover:border-primary/50 transition-all shadow-2xs hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    Univers Homme
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[10px] text-muted-foreground font-light mt-1">
                  Sillages boisés, cuirés & orientaux
                </p>
              </Link>

              <Link
                to="/collection/femme"
                className="group p-3.5 rounded-xl border border-border/80 bg-card/60 hover:bg-card hover:border-primary/50 transition-all shadow-2xs hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                    Univers Femme
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[10px] text-muted-foreground font-light mt-1">
                  Accords floraux, gourmands & poudrés
                </p>
              </Link>

              <Link
                to="/suivi-commande"
                className="group p-3.5 rounded-xl border border-border/80 bg-card/60 hover:bg-card hover:border-primary/50 transition-all shadow-2xs hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-primary" /> Suivi Colis
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[10px] text-muted-foreground font-light mt-1">
                  Suivre l'acheminement en direct
                </p>
              </Link>
            </div>
          </div>

          {/* Concierge Assistance Link */}
          <div className="pt-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-[#25D366] transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#25D366]" />
              <span>Besoin d'un conseil ? Écrivez à notre Conciergerie WhatsApp</span>
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;

