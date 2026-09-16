---
name: seo-technical
description: Expert en SEO technique, explorabilité (crawlability), indexabilité, protocoles web et Core Web Vitals. Analyse la configuration de robots.txt, sitemaps XML, balises canoniques, balises hreflang bilingues, en-têtes de sécurité et gestion du rendu SPA/SSR. Utiliser pour toute vérification technique de l'indexation par Google, Bing ou les robots d'exploration.
---

# Expertise SEO Technique & Architecture Web

Ce skill fournit les directives indispensables pour garantir que l'application web Maison Kenzi est parfaitement explorable, indexable et performante pour les robots d'indexation.

---

## 1. Explorabilité & Indexabilité

### Fichier `robots.txt`
- Doit se trouver impérativement à la racine (`/robots.txt`).
- Doit autoriser l'exploration des pages publiques (`Allow: /`).
- Doit exclure les pages privées ou administratives (`Disallow: /admin`, `Disallow: /admin/`, `Disallow: /checkout`).
- Doit impérativement déclarer l'URL absolue du sitemap :
  ```text
  Sitemap: https://maison-kenzi.com/sitemap.xml
  ```
- Gestion des robots IA de recherche :
  - **Autoriser pour la visibilité IA** : `OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot`.
  - **Optionnel (apprentissage)** : `CCBot`, `ClaudeBot`, `GPTBot`, `Google-Extended`.

### Balises Canoniques (`<link rel="canonical">`)
- Chaque page doit posséder une balise canonique pointant vers son URL propre en HTTPS sans barre oblique superflue ou paramètres d'URL (`?sort=...`, `?page=...`).
- Ex: `<link rel="canonical" href="https://maison-kenzi.com/collection/all" />`.

---

## 2. Bilinguisme & Balises `hreflang`

Pour éviter toute pénalité de contenu dupliqué entre les langues :
- Déclarer les versions française, anglaise et l'aiguillage par défaut :
  ```html
  <link rel="alternate" hreflang="fr" href="https://maison-kenzi.com/" />
  <link rel="alternate" hreflang="en" href="https://maison-kenzi.com/" />
  <link rel="alternate" hreflang="x-default" href="https://maison-kenzi.com/" />
  ```
- Dans les fiches produits, refléter la langue sélectionnée ou le paramètre canonique.

---

## 3. Métadonnées Réseaux Sociaux (Open Graph & Twitter Cards)

Les réseaux sociaux (WhatsApp, Facebook, Instagram, Twitter/X, LinkedIn) exigent des URLs absolues :
```html
<meta property="og:type" content="website" />
<meta property="og:site_name" content="Maison Kenzi" />
<meta property="og:title" content="Maison Kenzi | Parfums de Niche & Haute Parfumerie au Maroc" />
<meta property="og:description" content="Découvrez nos fragrances d'exception, flacons de luxe et créations artisanales. Livraison express au Maroc." />
<meta property="og:url" content="https://maison-kenzi.com/" />
<meta property="og:image" content="https://maison-kenzi.com/mk-logo.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:image" content="https://maison-kenzi.com/mk-logo.png" />
```

---

## 4. Seuils Core Web Vitals (Standards 2025-2026)

| Métrique | Seuil Optimal (Bon) | À Améliorer | Mauvais | Rôle |
| :--- | :--- | :--- | :--- | :--- |
| **LCP** | $\le 2.5\text{ s}$ | $2.5\text{ s} - 4.0\text{ s}$ | $> 4.0\text{ s}$ | Vitesse d'affichage du visuel principal |
| **INP** | $\le 200\text{ ms}$ | $200\text{ ms} - 500\text{ ms}$ | $> 500\text{ ms}$ | Réactivité aux clics et interactions |
| **CLS** | $\le 0.1$ | $0.1 - 0.25$ | $> 0.25$ | Stabilité visuelle sans saut de mise en page |

*Rappel technique : La métrique INP a définitivement remplacé FID depuis 2024. Ne jamais faire référence à FID.*
