# Règle de Documentation du Code : Commentaires en Français & En-tête Descriptif

## 1. En-tête Obligatoire au Début de Chaque Fichier
Chaque fichier de code source (TypeScript, TSX, JS, Prisma, etc.) doit impérativement débuter par un bloc de commentaire en français décrivant clairement :
- Le rôle et l'objectif du fichier.
- Son module ou domaine de rattachement.
- Ses interactions principales avec le reste du système.

### Exemple de Format d'En-tête :
```typescript
/**
 * @file src/renderer/src/components/layout/Navbar.tsx
 * @description Barre de navigation principale de l'application de caisse NexPoint POS.
 * Permet la navigation tactile entre les modules (Caisse, Stocks, Factures, RH) avec des icônes Lucide.
 */
```

---

## 2. Commentaires de Code en Français
- L'ensemble des commentaires explicatifs, docstrings de fonctions, descriptions de types et blocs de logique métier doivent être rédigés **exclusivement en français**.
- Documenter le *pourquoi* des calculs (ex: ventilation de TVA marocaine, calcul des écarts de caisse lors du Ticket Z, dérivation de clé `safeStorage`).
- Maintenir un style clair, pédagogique et directement compréhensible par toute l'équipe de développement et les collaborateurs.
