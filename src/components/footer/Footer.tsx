/**
 * Composant Pied de Page (Footer) — Maison Kenzi
 *
 * Présente l'identité de prestige de la maison, l'accès dynamique aux collections
 * olfactives bilingues, les liens d'assistance client, les coordonnées directes
 * (WhatsApp, Instagram) et les mentions légales.
 * Conforme au Luxury Nude Design System et à la règle stricte zéro emoji.
 */

import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageSquare, Sparkles, Instagram, ShieldCheck, Truck } from "lucide-react";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useCategories } from "@/store/useCategoryStore";
import { useLanguage } from "@/contexts/LanguageContext";
import { getCategoryName } from "@/lib/productLocalization";
import { getCategorySlugOrder } from "@/lib/productCategories";

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.461c-1.884 0-3.649-.508-5.176-1.393l-.371-.215-3.847 1.009 1.026-3.748-.236-.375c-.97-1.545-1.482-3.344-1.482-5.187 0-5.385 4.381-9.766 9.766-9.766 5.384 0 9.765 4.381 9.765 9.766 0 5.384-4.381 9.765-9.765 9.765m0-21.5c-6.48 0-11.754 5.274-11.754 11.754 0 2.07.539 4.095 1.562 5.88l-1.658 6.059 6.2-1.626c1.716.936 3.659 1.44 5.65 1.44 6.479 0 11.754-5.274 11.754-11.754s-5.275-11.753-11.754-11.753" />
  </svg>
);

const Footer = () => {
  const { t, language } = useLanguage();
  const location = useLocation();
  const { settings } = useAppSettings();
  const categories = useCategories();
  const activeCategories = useMemo(
    () => categories.filter((c) => c.is_active),
    [categories]
  );

  // Vérifie si le lien correspond à la page actuellement visitée pour le griser
  const isLinkActive = (path: string) => {
    const normalize = (p: string) => (p.endsWith("/") && p.length > 1 ? p.slice(0, -1) : p).toLowerCase();
    const current = normalize(location.pathname);
    const target = normalize(path);
    if (target === "/collection/all") {
      return current === "/collection/all" || current === "/categories";
    }
    return current === target;
  };

  const rawPhone = settings.whatsapp_phone || settings.store_phone || "212652535301";
  const waNumber = rawPhone.replace(/[^0-9]/g, "") || "212652535301";
  const defaultWaMsg = language === "en"
    ? "Hello Maison Kenzi, I would like more information about your fragrances."
    : "Bonjour Maison Kenzi, je souhaite avoir des informations sur vos parfums.";
  const whatsappUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(t("footer.whatsappMessage", defaultWaMsg))}`;
  const instagramUrl = settings.instagram_url || "https://www.instagram.com/maisonkenzii?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw==";

  return (
    <footer className="w-full bg-card/70 border-t border-border text-foreground pt-12 md:pt-16 pb-8 px-4 sm:px-6 mt-20 md:mt-32">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10 mb-10 md:mb-12">
          {/* Col 1: Brand Identity */}
          <div className="space-y-3.5">
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-block transition-transform hover:scale-105 cursor-pointer"
              aria-label={t("footer.homeAria", "Maison Kenzi - Accueil")}
            >
              <img
                src="/mk-logo.png"
                alt="Maison Kenzi"
                className="h-12 sm:h-14 md:h-16 w-auto object-contain dark:hidden"
              />
              <img
                src="/mk-logo.png"
                alt="Maison Kenzi"
                className="h-12 sm:h-14 md:h-16 w-auto object-contain hidden dark:block"
              />
            </Link>
            <p className="text-[10px] uppercase tracking-[0.25em] text-primary font-bold">
              {t("footer.brandSubtitle", "Haute Parfumerie & Flacons Originaux")}
            </p>
            <p className="text-xs font-light text-muted-foreground leading-relaxed max-w-xs">
              {t("footer.brandDescription", "Sélection exclusive des plus grands chefs-d'œuvre de la parfumerie mondiale. Flacons 100% originaux scellés livrés partout au Maroc et en Europe.")}
            </p>
          </div>

          {/* Col 2: Collections Links (Catégories Dynamiques Bilingues) */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.25em] text-primary font-bold mb-4">
              {t("footer.collections", "Collections")}
            </h4>
            <ul className="space-y-2.5 text-xs font-light">
              <li>
                <Link
                  to="/collection/all"
                  aria-current={isLinkActive("/collection/all") ? "page" : undefined}
                  className={`transition-colors font-light ${isLinkActive("/collection/all")
                    ? "text-muted-foreground/40 pointer-events-none cursor-default select-none"
                    : "text-muted-foreground hover:text-primary cursor-pointer"
                    }`}
                >
                  {t("footer.allPerfumes", "Tous les Parfums (Catalogue)")}
                </Link>
              </li>
              {activeCategories
                .filter(
                  (c) =>
                    c.slug.toLowerCase() !== "homme" &&
                    c.slug.toLowerCase() !== "femme" &&
                    c.slug.toLowerCase() !== "all" &&
                    c.slug.toLowerCase() !== "toutes"
                )
                .sort((a, b) => getCategorySlugOrder(a.slug) - getCategorySlugOrder(b.slug))
                .map((cat) => {
                  const catName = getCategoryName(cat, language);
                  const catPath = `/collection/${cat.slug}`;
                  const isActive = isLinkActive(catPath);
                  return (
                    <li key={cat.id}>
                      <Link
                        to={catPath}
                        aria-current={isActive ? "page" : undefined}
                        className={`transition-colors font-light ${isActive
                          ? "text-muted-foreground/40 pointer-events-none cursor-default select-none"
                          : "text-muted-foreground hover:text-primary cursor-pointer"
                          }`}
                      >
                        {catName}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>

          {/* Col 3: Assistance & Client */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.25em] text-primary font-bold mb-4">
              {t("footer.information", "Informations")}
            </h4>
            <ul className="space-y-2.5 text-xs font-light">
              <li>
                <Link
                  to="/about"
                  aria-current={isLinkActive("/about") ? "page" : undefined}
                  className={`transition-colors flex items-center gap-1.5 font-light ${isLinkActive("/about")
                    ? "text-muted-foreground/40 pointer-events-none cursor-default select-none"
                    : "text-muted-foreground hover:text-primary cursor-pointer"
                    }`}
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isLinkActive("/about") ? "text-muted-foreground/40" : "text-primary"}`} />
                  <span>{t("footer.aboutUs", "À Propos de Maison Kenzi")}</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/suivi-commande"
                  aria-current={isLinkActive("/suivi-commande") ? "page" : undefined}
                  className={`transition-colors flex items-center gap-1.5 font-light ${isLinkActive("/suivi-commande")
                    ? "text-muted-foreground/40 pointer-events-none cursor-default select-none"
                    : "text-muted-foreground hover:text-primary cursor-pointer"
                    }`}
                >
                  <Truck className={`w-3.5 h-3.5 ${isLinkActive("/suivi-commande") ? "text-muted-foreground/40" : "text-primary"}`} />
                  <span>{t("footer.trackOrder", "Suivre ma Commande")}</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/about/service-client"
                  aria-current={isLinkActive("/about/service-client") ? "page" : undefined}
                  className={`transition-colors flex items-center gap-1.5 font-light ${isLinkActive("/about/service-client")
                    ? "text-muted-foreground/40 pointer-events-none cursor-default select-none"
                    : "text-muted-foreground hover:text-primary cursor-pointer"
                    }`}
                >
                  <MessageSquare className={`w-3.5 h-3.5 ${isLinkActive("/about/service-client") ? "text-muted-foreground/40" : "text-primary"}`} />
                  <span>{t("footer.customerService", "Service Client & Contact")}</span>
                </Link>
              </li>
              <li className="pt-1 text-[11px] text-muted-foreground/80 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-primary" />
                <span>{t("footer.deliveryNotice", "Livraison partout au Maroc & en Europe")}</span>
              </li>
              <li className="text-[11px] text-muted-foreground/80 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                <span>{t("footer.securePayment", "Paiement Sécurisé par Internet")}</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Direct Contact & Socials */}
          <div>
            <h4 className="text-[11px] uppercase tracking-[0.25em] text-primary font-bold mb-4">
              {t("footer.contactUs", "Nous Contacter")}
            </h4>
            <div className="space-y-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 text-foreground hover:bg-[#25D366]/20 transition-all group cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-[#25D366]">{t("footer.whatsappDirect", "WhatsApp Direct")}</p>
                  <p className="text-[11px] text-muted-foreground truncate">+{waNumber}</p>
                </div>
              </a>

              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-primary/10 border border-primary/30 text-foreground hover:bg-primary/20 transition-all group cursor-pointer"
              >
                <Instagram className="w-4 h-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <p className="font-semibold text-xs text-primary">{t("footer.officialInstagram", "Instagram Officiel")}</p>
                  <p className="text-[11px] text-muted-foreground truncate">@maisonkenzii</p>
                </div>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom copyright & legal bar */}
        <div className="border-t border-border/70 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs font-light text-muted-foreground">
          <p>© {new Date().getFullYear()} Maison Kenzi. {t("footer.allRightsReserved", "Tous droits réservés.")}</p>
          <div className="flex items-center gap-4 text-[11px]">
            <Link
              to="/privacy-policy"
              aria-current={isLinkActive("/privacy-policy") ? "page" : undefined}
              className={`transition-colors font-light ${isLinkActive("/privacy-policy")
                ? "text-muted-foreground/40 pointer-events-none cursor-default select-none"
                : "text-muted-foreground hover:text-primary cursor-pointer"
                }`}
            >
              {t("footer.privacyPolicy", "Politique de Confidentialité")}
            </Link>
            <span>•</span>
            <Link
              to="/terms-of-service"
              aria-current={isLinkActive("/terms-of-service") ? "page" : undefined}
              className={`transition-colors font-light ${isLinkActive("/terms-of-service")
                ? "text-muted-foreground/40 pointer-events-none cursor-default select-none"
                : "text-muted-foreground hover:text-primary cursor-pointer"
                }`}
            >
              {t("footer.termsOfService", "Conditions Générales de Vente")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
