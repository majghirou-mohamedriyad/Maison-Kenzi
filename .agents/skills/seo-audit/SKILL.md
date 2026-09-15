---
name: seo-audit
description: Audit complet du référencement naturel (SEO), de l'indexabilité et de la santé technique d'un site web ou d'une boutique e-commerce. Analyse approfondie des balises Schema.org / JSON-LD, Core Web Vitals, sitemap, robots.txt, E-E-A-T, SEO international bilingue (hreflang), optimisation pour moteurs de recherche IA (GEO/AEO) et plan d'action hiérarchisé. Utiliser dès que l'utilisateur demande un audit SEO, une analyse de référencement, un bilan de santé du site, ou une vérification de visibilité Google.
---

# Audit SEO Complet & Diagnostic de Santé Web

Ce skill guide l'assistant pour réaliser des audits SEO complets, rigoureux et directement actionnables sur tout site web ou boutique e-commerce (notamment Maison Kenzi).

---

## 1. Méthodologie d'Audit en 6 Étapes

1. **Rendu et Inspection de la Page d'Accueil & Pages Clés** :
   - Analyse du code source brut (`index.html`, composants React/SSR) et du rendu dynamique.
   - Détection du type d'architecture (Single Page Application, SSR, SSG).
   - Vérification de l'accessibilité et de la structure sémantique.

2. **Exploration & Cartographie du Site** :
   - Parcours des routes principales (accueil, collections, fiches produits, pages institutionnelles).
   - Respect strict des directives du fichier `robots.txt`.
   - Identification des liens brisés ou des boucles de redirection.

3. **Analyse Spécialisée par Piliers SEO** :
   - **SEO Technique** : `robots.txt`, `sitemap.xml`, balises canoniques, balises `hreflang`, en-têtes de sécurité (CSP, HSTS).
   - **Données Structurées (Schema.org / JSON-LD)** : Détection et validation des entités (`Organization`, `WebSite`, `Product`, `Offer`, `BreadcrumbList`).
   - **Qualité du Contenu & E-E-A-T** : Analyse de l'autorité, pertinence des descriptions olfactives, absence de contenu dupliqué ou pauvre (*thin content*).
   - **SEO On-Page & Sémantique** : Unicité et longueur des balises `<title>`, `<meta name="description">`, hiérarchie stricte des en-têtes (`H1` unique, `H2/H3` structurés).
   - **Performance & Core Web Vitals** : LCP (Largest Contentful Paint), CLS (Cumulative Layout Shift), INP (Interaction to Next Paint), scripts tiers bloquants.
   - **Visuels & Médias** : Attributs `alt` systématiques et descriptifs, dimensions déclarées, formats modernes (WebP, AVIF), prévention du décalage de mise en page.
   - **Optimisation pour l'IA (GEO / AEO)** : Citabilité par Google AI Overviews, Perplexity et ChatGPT, présence d'un fichier `llms.txt`, clarté des entités nommées.
   - **Spécificités E-Commerce** : Affichage des prix en MAD, devises conformes, statut de stock, déclinaisons de formats, clarté du processus de commande express.

4. **Calcul du Score de Santé SEO Global (0 - 100)** :
   - Application de la grille de pondération officielle.

5. **Génération des Livrables d'Audit** :
   - Création du dossier `{domain}-audit/` avec le rapport complet et le plan d'action par phase.

6. **Restitution & Priorisation** :
   - Présentation claire des résultats classés par criticité (Critique > Élevé > Moyen > Faible).

---

## 2. Grille de Pondération du Score Global

| Catégorie | Pondération | Critères Principaux |
| :--- | :--- | :--- |
| **SEO Technique** | 22% | Indexabilité, `robots.txt`, `sitemap.xml`, URLs canoniques, bilinguisme |
| **Qualité du Contenu & E-E-A-T** | 23% | Richesse éditoriale, autorité de marque, originalité, exhaustivité |
| **SEO On-Page** | 20% | Balises Title/Description uniques, balises `H1`/`H2`, maillage interne |
| **Données Structurées (Schema.org)** | 10% | Présence JSON-LD valide (`Product`, `Offer`, `BreadcrumbList`) |
| **Performance (Core Web Vitals)** | 10% | Vitesse de chargement, LCP sous 2.5s, CLS sous 0.1 |
| **Préparation aux Moteurs IA (GEO/AEO)** | 10% | Structure pour réponses génératives, clarté factuelle, `llms.txt` |
| **Optimisation des Images** | 5% | Présence systématique de `alt`, cadrage sans distorsion, compression |

---

## 3. Matrice de Priorité des Recommandations

- **Critique (Bloquant)** : Problème bloquant l'indexation par Google, sitemap rejeté, balise `noindex` accidentelle, URLs relatives dans le sitemap, ou pénalités sévères. *Correction immédiate requise.*
- **Élevé (Impact Fort)** : Absence de balises JSON-LD sur les fiches produits, titres dupliqués, absence de balises `hreflang` sur un site bilingue, temps de chargement excessif. *Correction sous 1 semaine.*
- **Moyen (Optimisation)** : Descriptions méta trop courtes ou génériques, maillage interne perfectible, attributs `alt` peu descriptifs. *Correction sous 1 mois.*
- **Faible (Finitions)** : Micro-ajustements de formatage, améliorations mineures du fichier `robots.txt`. *À planifier au fil de l'eau.*

---

## 4. Structure Standard des Fichiers de Rapport

Lors d'un audit complet sur un domaine (ex: `maison-kenzi.com`), les livrables suivants sont générés sous le répertoire `{domaine}-audit/` :

1. **`{domaine}-audit/FULL-AUDIT-REPORT.md`** :
   - Synthèse managériale et score global sur 100.
   - Détail exhaustif pour chaque catégorie (Ce qui fonctionne bien / Vulnérabilités détectées).
   - Recommandations techniques avec snippets de code correctifs.

2. **`{domaine}-audit/ACTION-PLAN.md`** :
   - **Phase 1 : Correctifs Critiques (Semaine 1)** : Résolution des blocages d'indexation et conformité sitemap/robots.
   - **Phase 2 : Optimisations à Fort Impact (Semaines 2-3)** : Données structurées JSON-LD, Open Graph, bilinguisme.
   - **Phase 3 : Contenu & Autorité (Mois 2)** : Enrichissement éditorial, stratégie de mots-clés de niche, GEO/AEO.
   - **Phase 4 : Suivi Continu & Monitoring** : Vérification dans Google Search Console et alertes de régression.

3. **`{domaine}-audit/audit-data.json`** :
   - Enveloppe de données JSON structurée synthétisant les scores, constats et métadonnées pour génération automatisée de rapports :

```json
{
  "summary": {
    "domain": "maison-kenzi.com",
    "health_score": 0,
    "business_type": "Luxury E-commerce & Haute Parfumerie",
    "top_findings": [],
    "quick_wins": []
  },
  "categories": [
    {
      "name": "Technical SEO",
      "score": 0,
      "what_works": [],
      "findings": [
        {
          "title": "Titre du constat",
          "severity": "Critical",
          "description": "Détail appuyé par le code source",
          "recommendation": "Correctif précis"
        }
      ]
    }
  ],
  "action_plan": {
    "phases": [
      {
        "name": "Phase 1 : Correctifs Critiques",
        "timeframe": "Semaine 1",
        "items": []
      },
      {
        "name": "Phase 2 : Optimisations Prioritaires",
        "timeframe": "Semaines 2-3",
        "items": []
      }
    ]
  }
}
```

---

## 5. Checklist Spécifique E-Commerce & Haute Parfumerie

- [ ] **Validité Schema.org `Product`** :
  - `name` : Nom officiel du parfum.
  - `image` : URL absolue HTTPS de haute définition.
  - `description` : Description poétique et olfactive riche.
  - `brand` : Objet `Brand` avec `name: "Maison Kenzi"`.
  - `offers` : Objet `Offer` avec `priceCurrency: "MAD"`, `price`, `availability: "https://schema.org/InStock"` ou `OutOfStock`.
- [ ] **Sitemap XML & Robots.txt** :
  - URLs impérativement absolues (`https://maison-kenzi.com/...`).
  - Déclaration explicite du sitemap dans `robots.txt`.
- [ ] **Open Graph pour Réseaux Sociaux & Messageries** :
  - `og:image` en URL absolue HTTPS (affichage parfait sur WhatsApp, Facebook, iMessage).
  - `og:title` et `og:description` valorisant l'univers de la maison.
- [ ] **SEO Bilingue (FR / EN)** :
  - Balises `hreflang="fr"` et `hreflang="en"` déclarées avec `hreflang="x-default"`.
- [ ] **Absence Totale d'Emojis** :
  - Aucun emoji dans les titres, méta-descriptions, tickets ou balises alt (conformité absolue à la règle d'ingénierie de Maison Kenzi).
