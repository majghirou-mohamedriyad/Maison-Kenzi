---
name: seo-schema
description: Expert en balisage sémantique Schema.org et données structurées JSON-LD. Détecte, valide et génère les balises JSON-LD conformes aux exigences Google Rich Results (Product, Offer, Brand, Organization, BreadcrumbList, WebSite). Utiliser dès qu'il s'agit de structurer les données d'un produit, d'une collection ou d'enrichir les métadonnées pour l'affichage d'étoiles, prix et disponibilité dans Google.
---

# Expertise Balisage Schema.org & Données Structurées JSON-LD

Ce skill fournit les directives strictes et les modèles pour implémenter des données structurées Schema.org parfaites en JSON-LD sur Maison Kenzi.

---

## 1. Règles Fondamentales & Standards Google (2025-2026)

### Format & Syntaxe
- **JSON-LD exclusif** : Ne jamais utiliser de microdonnées HTML inline ou RDFa. Utiliser des balises `<script type="application/ld+json">`.
- **Contexte canonique** : Toujours `"@context": "https://schema.org"`.
- **URLs Absolues Obligatoires** : Toutes les URLs (`url`, `image`, `@id`) doivent être absolues (`https://maison-kenzi.com/...`). Google rejette ou ignore les URLs relatives dans les données structurées.
- **Dates ISO 8601** : Format strict `YYYY-MM-DD` ou `YYYY-MM-DDTHH:mm:ssZ`.
- **Zéro Emoji** : Ne jamais intégrer d'emojis dans les libellés, descriptions ou noms de produits des schémas.

### Types Dépréciés ou Sans Richesse SERP (À Proscrire)
- **FAQPage** : Google a déprécié les résultats enrichis FAQ pour l'ensemble des sites depuis mai 2026. Ne plus ajouter de `FAQPage` pour espérer des accordéons dans les résultats de recherche.
- **HowTo** : Supprimé par Google depuis septembre 2023.
- **SpecialAnnouncement, CourseInfo, EstimatedSalary** : Dépréciés.

---

## 2. Modèle Officiel pour les Fiches Produits (`Product`)

Pour chaque parfum, coffret ou création artisanale sur Maison Kenzi :

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "@id": "https://maison-kenzi.com/parfum/{slug}#product",
  "name": "Nom du Parfum",
  "image": [
    "https://maison-kenzi.com/photos/parfum-main.webp",
    "https://maison-kenzi.com/photos/parfum-angle.webp"
  ],
  "description": "Description olfactive détaillée, notes de tête, de cœur et de fond.",
  "sku": "MK-{ID}",
  "mpn": "MK-{SLUG}",
  "brand": {
    "@type": "Brand",
    "name": "Maison Kenzi"
  },
  "category": "Haute Parfumerie",
  "offers": {
    "@type": "Offer",
    "@id": "https://maison-kenzi.com/parfum/{slug}#offer",
    "url": "https://maison-kenzi.com/parfum/{slug}",
    "priceCurrency": "MAD",
    "price": "450",
    "priceValidUntil": "2026-12-31",
    "itemCondition": "https://schema.org/NewCondition",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "Maison Kenzi"
    },
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingRate": {
        "@type": "MonetaryAmount",
        "value": "0",
        "currency": "MAD"
      },
      "shippingDestination": {
        "@type": "DefinedRegion",
        "addressCountry": "MA"
      },
      "deliveryTime": {
        "@type": "ShippingDeliveryTime",
        "handlingTime": {
          "@type": "QuantitativeValue",
          "minValue": 0,
          "maxValue": 1,
          "unitCode": "d"
        },
        "transitTime": {
          "@type": "QuantitativeValue",
          "minValue": 1,
          "maxValue": 2,
          "unitCode": "d"
        }
      }
    }
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "24",
    "bestRating": "5",
    "worstRating": "1"
  }
}
```

---

## 3. Fil d'Ariane (`BreadcrumbList`)

Pour structurer la hiérarchie dans les SERP Google :

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Accueil",
      "item": "https://maison-kenzi.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Parfums & Fragrances",
      "item": "https://maison-kenzi.com/collection/all"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Nom du Parfum",
      "item": "https://maison-kenzi.com/parfum/{slug}"
    }
  ]
}
```

---

## 4. Organisation & Entité de Marque (`Organization` & `WebSite`)

Dans la page d'accueil et le pied de page :

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://maison-kenzi.com/#organization",
  "name": "Maison Kenzi",
  "url": "https://maison-kenzi.com/",
  "logo": "https://maison-kenzi.com/mk-logo.png",
  "image": "https://maison-kenzi.com/mk-logo.png",
  "description": "Maison marocaine de haute parfumerie, fragrances de niche, créations artisanales et pièces rares 100% authentiques.",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "MA",
    "addressLocality": "Casablanca"
  },
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer care",
    "availableLanguage": ["French", "English", "Arabic"]
  },
  "sameAs": [
    "https://www.instagram.com/maisonkenzi/"
  ]
}
```
