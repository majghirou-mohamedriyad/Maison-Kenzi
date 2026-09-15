---
name: seo-ecommerce
description: Optimisation SEO avancée pour boutique e-commerce de prestige et haute parfumerie. Couvre l'optimisation des fiches produits, la structure des catégories et collections, les prix en MAD, la gestion des stocks, les attributs visuels, le maillage interne et les déclinaisons de formats (flacons, décants, coffrets). Utiliser pour toute tâche liée au catalogue, aux fiches produits et au tunnel de commande.
---

# Expertise SEO E-Commerce & Haute Parfumerie (Maison Kenzi)

Ce skill définit les meilleures pratiques SEO pour valoriser le catalogue de créations, flacons et produits artisanaux de Maison Kenzi sur les moteurs de recherche.

---

## 1. Structure Optimale d'une Fiche Produit de Prestige

Chaque page produit (`/parfum/:slug`) doit comporter :

### Balises Titre & Méta
- **Title (50-60 caractères)** :  
  `Nom du Parfum | Maison Kenzi — Haute Parfumerie`
- **Meta Description (140-155 caractères)** :  
  `Découvrez Nom du Parfum par Maison Kenzi. Fragrance d'exception, notes de tête précieuses. Flacon authentique scellé, livraison rapide au Maroc.`
- **Balise H1 Unique** :  
  `<h1>Nom du Parfum</h1>`

### Contenu Éditorial & Pyramide Olfactive
- **Volume minimal** : Au moins 300 mots de description unique (éviter les copier-coller de fiches fabricants).
- **Structure olfactive claire** : Section structurée avec sous-titres H2/H3 pour :
  - Notes de tête (première impression fraîche ou épicée).
  - Notes de cœur (signature florale, boisée ou ambrée).
  - Notes de fond (sillage persistant, musc, oud, vanille).
- **Conseils de port et saisonnalité** : Saisons idéales (Printemps, Été, Automne, Hiver) et occasions.

---

## 2. Optimisation des Médias Produits

1. **Attribut `alt` systématique et riche** :
   - *Mauvais* : `alt="photo parfum"` ou `alt=""`.
   - *Optimal* : `alt="Flacon de parfum NomDuParfum Maison Kenzi 100ml avec bouchon gravé et écrin"`
2. **Formats d'image modernes** :
   - Servir en **WebP** ou **AVIF** avec fallback PNG/JPG.
   - Résolution minimale recommandée : **800x800 px** pour permettre l'affichage haute définition sans flou.
3. **Cadrage & Marges de sécurité** :
   - Cadrage `object-contain` pour ne jamais rogner les bouchons, liserés ou étiquettes.
   - Micro-zoom doux au survol (`scale-[0.98]`) sans débordement hors du conteneur.

---

## 3. Clarté Commerciale & Signaux de Réassurance

- **Devise officielle** : `MAD` (Dirham Marocain).
- **Statut de stock dynamique** : Affichage clair du statut (En stock / Rupture de stock / Bientôt disponible).
- **Options de commande rapides** : Présence du bouton de commande express et du contact direct WhatsApp pour l'assistance personnalisée.
- **Réassurance client** : Badges d'authenticité 100% garantie, paiement sécurisé à la livraison, livraison express dans tout le Royaume.

---

## 4. Maillage Interne & Architecture des Collections

- **Fil d'Ariane (Breadcrumbs)** : Toujours présent et balisé en JSON-LD (`Accueil > Univers > Nom du Produit`).
- **Produits Recommandés & Similaires** : 3 à 4 créations de la même famille olfactive ou collection pour fluidifier la navigation et répartir l'autorité de domaine.
- **Pagination et Filtres** : Liens de collections stables (`/collection/parfums`, `/collection/cosmetiques`, `/collection/artisanat`, `/collection/antiques`) avec URLs canoniques propres sans paramètres superflus.
