import Header from "../../components/header/Header";
import Footer from "../../components/footer/Footer";
import PageHeader from "../../components/about/PageHeader";
import ContentSection from "../../components/about/ContentSection";
import AboutSidebar from "../../components/about/AboutSidebar";
import { Button } from "@/components/ui/button";
import { Instagram, MessageCircle } from "lucide-react";

import { useAppSettings } from "@/hooks/useAppSettings";

const ServiceClient = () => {
  const { settings } = useAppSettings();
  const rawWa = settings.whatsapp_phone || settings.store_phone || "212752850156";
  const waNumber = rawWa.replace(/[^0-9]/g, "") || "212752850156";
  const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(
    "Bonjour Maison Kenzi, j'aurais besoin d'un renseignement."
  )}`;
  const instagramUrl = settings.instagram_url || "https://instagram.com/maisonkenzi";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="flex">
        <div className="hidden lg:block"><AboutSidebar /></div>
        <main className="w-full lg:w-[70vw] lg:ml-auto px-6">
          <PageHeader
            title="Service Client"
            subtitle="Nous sommes à votre écoute, du conseil à l'après-vente."
          />
          <ContentSection>
            <div className="grid md:grid-cols-2 gap-12 max-w-4xl">
              <div className="space-y-3">
                <h3 className="font-serif text-xl text-primary">Téléphone & WhatsApp</h3>
                <p className="text-foreground/75 font-light">+212 752-850156</p>
              </div>
              <div className="space-y-3">
                <h3 className="font-serif text-xl text-primary">Horaires</h3>
                <p className="text-foreground/75 font-light">Lundi — Samedi · 10h — 19h</p>
              </div>
            </div>
          </ContentSection>

          <ContentSection title="Discutons ensemble">
            <p className="text-foreground/75 font-light max-w-3xl leading-relaxed mb-6">
              Une question, un conseil parfumé, ou simplement envie d'échanger ?
              Retrouvez-nous sur WhatsApp ou sur Instagram.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                size="lg"
                className="bg-[#25D366] hover:bg-[#1ebe57] text-white border-0"
              >
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Nous contacter sur WhatsApp"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  WhatsApp
                </a>
              </Button>

              <Button
                asChild
                size="lg"
                className="text-white border-0 bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-90"
              >
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Nous suivre sur Instagram"
                >
                  <Instagram className="mr-2 h-5 w-5" />
                  @{INSTAGRAM_HANDLE}
                </a>
              </Button>
            </div>
          </ContentSection>

          <ContentSection title="Retours">
            <p className="text-foreground/75 font-light max-w-3xl leading-relaxed">
              Les retours sont acceptés sous 7 jours après réception, pour tout décant non ouvert
              et dans son emballage d'origine. Contactez-nous par email pour initier la procédure.
            </p>
          </ContentSection>
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default ServiceClient;
