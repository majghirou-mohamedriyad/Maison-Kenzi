import { Helmet } from "react-helmet-async";
import { useLanguage } from "@/contexts/LanguageContext";

interface SeoProps {
  title: string;
  description: string;
  path: string;
  image?: string;
  ogType?: "website" | "article" | "product";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const SITE_URL = "https://maison-kenzi.com";
const DEFAULT_IMAGE = `${SITE_URL}/mk-logo.png`;

const Seo = ({
  title,
  description,
  path,
  image,
  ogType = "website",
  jsonLd,
}: SeoProps) => {
  const { language } = useLanguage();

  // Nettoyage et normalisation de l'URL canonique (sans paramètres d'URL superflus)
  const cleanPath = path.split("?")[0].split("#")[0];
  const canonicalUrl = cleanPath.startsWith("http")
    ? cleanPath
    : `${SITE_URL}${cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`}`;

  // Construction de l'image absolue pour Open Graph et Twitter Cards
  const ogImageUrl = image
    ? image.startsWith("http")
      ? image
      : `${SITE_URL}${image.startsWith("/") ? image : `/${image}`}`
    : DEFAULT_IMAGE;

  // Locale Open Graph adaptée
  const ogLocale = language === "en" ? "en_US" : "fr_FR";

  const ldArray = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      {/* Balises Principales */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Réseaux Sociaux & WhatsApp */}
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="Maison Kenzi" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImageUrl} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImageUrl} />

      {/* Données Structurées JSON-LD */}
      {ldArray.map((ld, i) => (
        <script key={i} type="application/ld+json">
          {JSON.stringify(ld)}
        </script>
      ))}
    </Helmet>
  );
};

export default Seo;
