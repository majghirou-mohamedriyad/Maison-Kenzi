---
name: minimalist-spatial-composition
description: Principes de mise en page aérée, gestion généreuse de l'espace négatif, grilles asymétriques et mise en scène de produits haut de gamme.
---

# Composition Spatiale & Minimalisme Épuré (Maison-Kenzi)

Ce skill régit l'agencement des éléments, la gestion du vide constructif (*white/nude space*) et la structure des pages pour créer une atmosphère calme, ordonnée et haut de gamme.

## 1. Principes d'Espace Négatif

L'espace négatif n'est pas un vide à combler, mais un élément de design structurant qui valorise le produit et guide le regard.

### Marges et Espacements Standards

* **Espacement Inter-Sections** : `py-20 sm:py-28 lg:py-36` pour laisser chaque section respirer pleinement.
* **Largeur Maximale de Lecture** : `max-w-prose` ou `max-w-2xl` pour les paragraphes afin d'éviter les lignes de lecture trop étirées.
* **Conteneur Global Centré** : `max-w-7xl mx-auto px-6 sm:px-8 lg:px-12` avec un padding horizontal généreux.

---

## 2. Grilles de Présentation Produits & Galeries

### Grille Minimaliste Produits
* Ratio d'image vertical : `aspect-[3/4]` ou `aspect-[4/5]`.
* Disposition aérée : 2 à 3 colonnes sur grand écran (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-12`).
* Pas de cartes bordées encombrantes : le visuel et la typographie suffisent à structurer le composant.

```tsx
<div className="group flex flex-col space-y-4">
  <div className="relative overflow-hidden bg-[#F2EBE3] aspect-[3/4]">
    <img
      src={productImage}
      alt={productTitle}
      className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
    />
  </div>
  <div className="flex flex-col space-y-1">
    <span className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground font-sans">
      {category}
    </span>
    <h3 className="text-base font-normal tracking-wide text-foreground font-serif">
      {productTitle}
    </h3>
    <p className="text-sm font-light text-foreground font-sans">
      {price} MAD
    </p>
  </div>
</div>
```

---

## 3. Règle d'Élimination du Bruit Visuel

1. **Suppression des Éléments Superflus** :
   * Pas de badges multiples criards ou de compteurs clignotants.
   * Remplacer les séparateurs épais par de simples filets de 1 pixel ton-sur-ton (`border-t border-[#E6DDD4]`).

2. **Alignement & Rythme** :
   * Conserver un alignement rigoureux des textes (gauche ou centré pour les citations d'exception).
   * Éviter les décalages de hauteur aléatoires entre éléments de même niveau.
