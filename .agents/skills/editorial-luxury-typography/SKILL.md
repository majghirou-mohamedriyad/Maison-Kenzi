---
name: editorial-luxury-typography
description: Directives pour la typographie éditoriale haut de gamme, mariant polices serif de prestige, sans-serif ultra-épurés, espacement des lettres (tracking) et hiérarchie visuelle.
---

# Typographie Éditoriale & Hiérarchie de Prestige (Maison-Kenzi)

Ce skill formalise les règles typographiques pour conférer au projet l'allure d'une revue d'art et d'une maison de haute création.

## 1. Duo Typographique Officiel

### Police Primaire Serif (Titres, Collections, Citations)
* **Famille** : *Playfair Display*, *Cormorant Garamond* ou *Cinzel*.
* **Usage** : Titres de sections (H1, H2), noms de collections phares, en-têtes éditoriaux.
* **Caractéristiques** : Graisses légères à moyennes (`font-light` / `font-normal` soit 300 à 400), sérifs affûtés, proportions élégantes.

### Police Secondaire Sans-Serif (Navigation, Corps de texte, Boutons, Données)
* **Famille** : *Plus Jakarta Sans*, *Manrope* ou *Inter*.
* **Usage** : Descriptions produits, filtres, boutons d'action, tableaux de prix, navigation.
* **Caractéristiques** : Lisibilité géométrique irréprochable, hauteur d'x généreuse.

---

## 2. Échelle Typographique & Règles de Composition

### Sur-titres & Catégories (*Eyebrows*)
* **Classes Tailwind** : `text-[11px] uppercase tracking-[0.25em] font-sans font-medium text-muted-foreground`
* **Objectif** : Situer le contexte avec finesse sans surcharger la vue.

### Grands Titres H1 / Hero
* **Classes Tailwind** : `font-serif text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-foreground leading-[1.15]`
* **Règle** : Pas de texte en gras lourd (`font-extrabold` est proscrit). Le luxe s'exprime par la finesse du tracé.

### Titres de Sections H2
* **Classes Tailwind** : `font-serif text-2xl sm:text-3xl font-normal tracking-wide text-foreground`

### Noms de Produits
* **Classes Tailwind** : `font-sans text-sm font-medium tracking-wider uppercase text-foreground`

### Corps de Texte & Descriptions
* **Classes Tailwind** : `font-sans text-sm sm:text-base font-light leading-relaxed text-muted-foreground`
* **Interlignage** : Toujours privilégier `leading-relaxed` ou `leading-loose` pour aérer la lecture.

### Prix & Tarification
* **Classes Tailwind** : `font-serif text-lg sm:text-xl font-normal tracking-wide text-foreground`

---

## 3. Bonnes Pratiques & Interdictions

* **Interdiction du Gras Excessif** : Ne jamais utiliser `font-bold` ou `font-extrabold` sur les polices Serif.
* **Espacement des Lettres (*Tracking*)** : Les textes en majuscules (boutons, labels, navigation) doivent systématiquement porter un espacement de lettres élargi (`tracking-widest` ou `tracking-[0.2em]`).
* **Zéro Soulignement Brut** : Éviter `underline` classique; préférer une bordure inférieure animée ou un liseré fin espacé.
