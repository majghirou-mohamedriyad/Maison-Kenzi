---
name: cinematic-micro-interactions
description: Directives pour concevoir des micro-animations douces, transitions cinématographiques, survols subtils et icônes vectorielles ultra-fines (zéro emoji).
---

# Micro-Interactions Cinématographiques & Finitions (Maison-Kenzi)

Ce skill détaille les standards d'interaction, d'animation et d'iconographie pour garantir une expérience utilisateur fluide, feutrée et sans brutalité visuelle.

## 1. Principes Temporels & Courbes d'Accélération

Dans le luxe, les mouvements ne doivent jamais être saccadés ou trop rapides. Ils doivent évoquer la lenteur maîtrisée et la fluidité de la soie.

### Courbes de Bézier Recommandées
* **Courbe Douce Standard** : `cubic-bezier(0.25, 1, 0.5, 1)` (démarrage franc, amorti extrêmement doux).
* **Durées Clés** :
  * Survol de bouton / couleur : `300ms` à `500ms`.
  * Zoom visuel / image produit : `700ms` à `1000ms`.
  * Transition d'ouverture modale / drawer : `400ms` à `600ms`.

---

## 2. Effets de Survol (*Hover States*)

### 1. Survol d'Image Produit
* Légère expansion fluide sans à-coups : `group-hover:scale-[1.03] transition-transform duration-700 ease-out`.
* Aucun filtre de couleur agressif (pas de saturation excessive).

### 2. Boutons d'Action & Liens
* Liseré inférieur animé : un trait de 1px qui s'étire doucement de gauche à droite au survol.
* Transition de couleur de fond fluide avec `transition-colors duration-300 ease-out`.

---

## 3. Règle Absolue d'Iconographie : Zéro Emoji & Traits Fins

### Règle Invariable
* **Aucun Emoji** dans le code, les boutons, les fiches produits ou les messages de notification.
* **Bibliothèque Exclusive** : `lucide-react`.

### Configuration des Icônes
* **Épaisseur de Trait (*Stroke Width*)** : Toujours fixée à `1.25` ou `1.5` pour préserver la légèreté visuelle.
* **Taille** : `w-4 h-4` ou `w-5 h-5` maximum dans les barres de navigation et boutons.
* **Couleur** : Héritée du texte parent (`text-current` ou `text-muted-foreground`).

Exemple d'intégration :
```tsx
import { ShoppingBag, ArrowRight, Search, Heart } from 'lucide-react';

<button className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-foreground hover:text-accent transition-colors duration-300">
  <span>Découvrir</span>
  <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.25} />
</button>
```
