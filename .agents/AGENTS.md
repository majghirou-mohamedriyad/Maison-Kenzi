# NexPoint POS — Directives du Projet & Règles d'Ingénierie

## 1. Règle Absolue d'Interface Utilisateur (UI/UX)
- **Zéro Emoji dans l'Interface et le Code** : Ne jamais insérer d'emojis dans les composants React, l'UI de l'application desktop, le site web, les boutons, les notifications, les tickets thermiques ou les factures PDF.
- **Icônes Professionnelles Uniquement** : Utiliser exclusivement la bibliothèque d'icônes vectorielles **`lucide-react`** (ou équivalent SVG pro) avec une épaisseur de trait cohérente et un design épuré, sobre et professionnel.

## 2. Règle de Documentation du Code (Commentaires en Français & En-tête)
- **En-tête Descriptif Obligatoire** : Chaque fichier de code source doit comporter en haut un bloc de commentaire descriptif en français indiquant son but, son contenu et son rôle.
- **Commentaires en Français** : Tous les commentaires internes, explications d'algorithmes et docstrings doivent être rédigés en français clair et accessible pour faciliter la collaboration.

## 3. Règle d'Exécution des Commandes Terminal
- **Commandes à Fournir à l'Utilisateur** : Toujours fournir les blocs de commandes formatés à l'utilisateur pour qu'il les exécute lui-même dans son terminal (ne pas exécuter de commandes de build/install automatiquement).

## 4. Règle de Suivi de Projet (`Avancement.md`)
- **Mise à Jour Systématique après Chaque Tâche** : Le fichier [`Avancement.md`](../Avancement.md) à la racine doit être automatiquement mis à jour à la fin de chaque tâche (statuts des phases, historique des tâches cochées, prochaine tâche).

## 5. Règle de Structure & Organisation du Code
- **Structure Modulaire & Typée** : Respecter scrupuleusement l'arborescence définie dans [`.agents/rules/project-structure.md`](rules/project-structure.md) :
  - `src/main/` : Processus principal Node.js, services métier, base de données SQLite WAL, hardware.
  - `src/preload/` : Ponts `contextBridge` sécurisés.
  - `src/renderer/` : UI React 18, TailwindCSS, shadcn/ui, Zustand stores, pages modulaires.
  - `src/shared/` : Types TypeScript et schémas Zod partagés.

## 6. Règle de Workflow Git
- **Commandes Git à la Fin de Chaque Tâche** : Après l'achèvement de chaque tâche ou étape de développement, fournir systématiquement le bloc de commandes Git prêt à être exécuté par l'utilisateur avec un message de commit précis et descriptif :
  ```bash
  git add .
  git commit -m "type(scope): message descriptif"
  git push
  ```

## 7. Architecture & Standards Fiscaux
- **Desktop** : Electron + React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui.
- **IPC** : `contextBridge` sécurisé avec validation Zod (aucun serveur HTTP local).
- **Base de données** : SQLite en mode WAL (`PRAGMA journal_mode = WAL;`) avec Prisma ORM.
- **Conformité Fiscale** : Respect strict du CGI marocain (TVA 0/7/10/14/20%, ICE, IF, RC, TP, CNSS, facturation séquentielle).
