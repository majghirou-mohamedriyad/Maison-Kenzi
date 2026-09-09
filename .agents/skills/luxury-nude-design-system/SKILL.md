---
name: luxury-nude-design-system
description: Guide d'application du système de design haut de gamme avec palette chromatique nude, matériaux nobles (lin, travertin, albâtre) et accents dorés champagne.
---

# Système de Design Luxe & Palette Nude (Maison-Kenzi)

Ce skill définit les principes directeurs pour concevoir et implémenter des interfaces e-commerce et vitrines de luxe avec une palette chromatique nude, épurée et intemporelle.

## 1. Principes Fondamentaux de la Palette Nude

L'esthétique repose sur l'élégance discrète (*quiet luxury*). Les contrastes violents (noir pur sur blanc pur) sont remplacés par des teintes organiques, douces et texturées.

### Nuancier Officiel (Valeurs HSL & Hex)

| Rôle | Nom de la Teinte | Code Hex | Valeur HSL | Usage Principal |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas / Fond** | Blanc Albâtre / Lin | `#F9F6F0` | `hsl(38, 30%, 96%)` | Arrière-plan global de l'application |
| **Surface Élevée** | Sable Doux / Travertin | `#F2EBE3` | `hsl(30, 25%, 92%)` | Cartes produits, panneaux latéraux, dropdowns |
| **Surface Accent** | Porcelaine Poudrée | `#EAE0D5` | `hsl(30, 28%, 88%)` | Badges délicats, survols légers, états actifs |
| **Bordure Subtile** | Cordon de Soie | `#E6DDD4` | `hsl(30, 20%, 88%)` | Filets de séparation ultra-fins (1px) |
| **Texte Principal** | Noir d'Ébène Satiné | `#1A1715` | `hsl(24, 10%, 10%)` | Titres, prix principaux, textes à fort contraste |
| **Texte Secondaire** | Taupe Chaud / Muted | `#6E655F` | `hsl(25, 8%, 40%)` | Descriptions, labels de navigation, métadonnées |
| **Accent Noble** | Doré Champagne Brossé | `#C5A880` | `hsl(35, 40%, 64%)` | Boutons d'action précieux, liserés, focus rings |

---

## 2. Intégration TailwindCSS & Classes Utilitaires

### Variables CSS à déclarer dans `src/index.css`

```css
@layer base {
  :root {
    --background: 38 30% 96%;
    --foreground: 24 10% 10%;

    --card: 30 25% 92%;
    --card-foreground: 24 10% 10%;

    --popover: 30 25% 92%;
    --popover-foreground: 24 10% 10%;

    --primary: 24 10% 10%;
    --primary-foreground: 38 30% 96%;

    --secondary: 30 28% 88%;
    --secondary-foreground: 24 10% 10%;

    --muted: 30 25% 92%;
    --muted-foreground: 25 8% 40%;

    --accent: 35 40% 64%;
    --accent-foreground: 24 10% 10%;

    --border: 30 20% 88%;
    --input: 30 20% 88%;
    --ring: 35 40% 64%;
  }
}
```

---

## 3. Directives pour les Composants UI

1. **Boutons Principaux (CTA de Luxe)** :
   * Fond noir d'ébène (`bg-[#1A1715]`) avec texte lin chaud (`text-[#F9F6F0]`).
   * Rayon de courbure subtil ou droit (`rounded-none` ou `rounded-sm`).
   * Effet de survol fluide avec légère transition d'opacité ou changement d'accent doré.

2. **Boutons Secondaires (Outline)** :
   * Fond transparent avec bordure 1px ton-sur-ton (`border border-[#E6DDD4]`).
   * Texte taupe ou ébène (`text-[#1A1715]`), passage en fond sable doux au survol (`hover:bg-[#F2EBE3]`).

3. **Cartes & Conteneurs** :
   * Bannir les ombres lourdes. Utiliser des bordures ultra-fines (`border border-[#E6DDD4]/60`) ou un léger halo chaud (`shadow-[0_8px_30px_rgb(26,23,21,0.03)]`).
   * Fond légèrement distinct du canvas principal pour hiérarchiser les blocs.

4. **Photos & Médias** :
   * Traitement d'image chaud et lumineux.
   * Ratios d'aspect élancés (portrait `aspect-[3/4]` ou `aspect-[4/5]`).
