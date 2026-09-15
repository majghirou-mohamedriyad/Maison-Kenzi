---
name: seo-sitemap
description: Architecte et validateur de sitemaps XML et protocoles d'indexation. Vérifie la conformité des URLs absolues, les dates lastmod au format W3C, l'élimination des balises obsolètes (priority, changefreq), et la cohérence entre le catalogue produit et le sitemap. Utiliser pour toute modification, génération ou validation du fichier sitemap.xml.
---

# Architecture & Validation des Sitemaps XML

Ce skill encadre la structure, la génération et la validation continue du fichier `sitemap.xml` pour Maison Kenzi selon les standards officiels de Google Search Central.

---

## 1. Règles d'Or des Sitemaps XML

1. **URLs Absolues HTTPS Strictes** :
   - *Interdit* : `<loc>/collection/all</loc>` (rejeté par Google Search Console).
   - *Requis* : `<loc>https://maison-kenzi.com/collection/all</loc>`.
2. **Élimination des Balises Obsolètes** :
   - Les balises `<priority>` et `<changefreq>` sont formellement ignorées par Google depuis plusieurs années. Elles alourdissent inutilement le flux et doivent être omises.
3. **Validité des Dates `lastmod`** :
   - Format standard W3C : `YYYY-MM-DD` (ex: `2026-09-15`).
   - La date doit refléter une modification réelle du contenu (mise à jour de produit, nouveau prix, nouvelle description) et non un script automatique qui change la date à chaque seconde.
4. **Contrôle Qualité des URLs (Quality Gates)** :
   - Seules les pages renvoyant un code HTTP **200** doivent figurer dans le sitemap.
   - **Exclusion stricte** des pages privées (`/admin`), du tunnel d'achat (`/checkout`), des pages avec balise `noindex` ou des redirections (301/302).

---

## 2. Structure Standard Conforme

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Pages Générales & Univers -->
  <url>
    <loc>https://maison-kenzi.com/</loc>
    <lastmod>2026-09-15</lastmod>
  </url>
  <url>
    <loc>https://maison-kenzi.com/collection/all</loc>
    <lastmod>2026-09-15</lastmod>
  </url>
  <url>
    <loc>https://maison-kenzi.com/collection/homme</loc>
    <lastmod>2026-09-15</lastmod>
  </url>
  <url>
    <loc>https://maison-kenzi.com/collection/femme</loc>
    <lastmod>2026-09-15</lastmod>
  </url>
  <url>
    <loc>https://maison-kenzi.com/collection/mixte</loc>
    <lastmod>2026-09-15</lastmod>
  </url>

  <!-- Fiches Produits Actives -->
  <url>
    <loc>https://maison-kenzi.com/parfum/sovereign-oud</loc>
    <lastmod>2026-09-15</lastmod>
  </url>

  <!-- Pages Institutionnelles & E-E-A-T -->
  <url>
    <loc>https://maison-kenzi.com/about/notre-histoire</loc>
    <lastmod>2026-09-01</lastmod>
  </url>
  <url>
    <loc>https://maison-kenzi.com/about/service-client</loc>
    <lastmod>2026-09-01</lastmod>
  </url>
</urlset>
```

---

## 3. Déclaration dans `robots.txt`

Le fichier `robots.txt` doit toujours référencer le sitemap de façon visible :
```text
Sitemap: https://maison-kenzi.com/sitemap.xml
```
