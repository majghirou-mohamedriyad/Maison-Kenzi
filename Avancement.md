# NexPoint / Maison-Kenzi — Suivi d'Avancement du Projet

## État d'Avancement Global

- **Dernière mise à jour** : 2026-09-09
- **Statut général** : Transition complète de l'application (client et admin) sur la nouvelle base de données Supabase VPS (schéma `maisonkenzi`)

---

## Historique des Tâches Réalisées

- [x] Définition et création des 4 compétences d'agent dans `.agents/skills/` :
  - [x] `luxury-nude-design-system` : Nuancier HSL / Hex nude, albâtre, sable et champagne.
  - [x] `editorial-luxury-typography` : Duo typographique Serif / Sans-Serif avec espacement tracking.
  - [x] `minimalist-spatial-composition` : Gestion des marges, conteneurs, respiration visuelle et grilles produits.
  - [x] `cinematic-micro-interactions` : Micro-animations douces, transitions Bézier et iconographie Lucide fine (zéro emoji).
- [x] Optimisation du fichier `.gitignore` :
  - Déblocage du versionnement pour `.agents/skills/`, `.agents/rules/` et `.agents/AGENTS.md`.
  - Protection des bases de données locales, certificats et caches.
- [x] Implémentation du Thème Luxe Minimaliste & Couleurs Nudes :
  - [x] `src/index.css` & `tailwind.config.ts` : Palette Nude Albâtre & Warm Espresso Obsidian, polices Playfair Display / Manrope.
- [x] Recentrage Exclusif sur les Parfums de Niche :
  - [x] `index.html`, `StatusBar.tsx`, `LargeHero.tsx`, `FiftyFiftySection.tsx`, `Footer.tsx` recentrés sur les parfums de niche et décants.
- [x] Correction et Optimisation du Switch de Thème :
  - [x] Suppression des saccades CSS et fluidification du basculement.
- [x] Raccordement Intégral du Site à la Base Supabase VPS (`maisonkenzi.*`) :
  - [x] Catalogue Produits : `src/hooks/useParfums.ts` connecté en direct à `maisonkenzi.parfums`.
  - [x] Catégories : `src/store/useCategoryStore.ts` synchronisé avec `maisonkenzi.categories`.
  - [x] Commandes & Formulaire Express : `Checkout.tsx` et `ExpressOrderForm.tsx` enregistrent directement dans `maisonkenzi.orders`.
  - [x] Suivi Client & Dashboard : `useAdminOrders.ts`, `useAdminCustomers.ts` et `useAdminDashboard.ts` branchés sur `maisonkenzi.customers`.
  - [x] Stocks de Décants & Flaconnage : `useFlaconnage.ts` branché sur `maisonkenzi.flaconnage`.
  - [x] Finances & Dépenses : `useAdminFinances.ts` branché sur `maisonkenzi.expenses`.
  - [x] Paramètres Généraux & Bot : `useAppSettings.ts` et `Bot.tsx` branchés sur `maisonkenzi.app_settings` et `maisonkenzi.bot_qa`.

---

## Prochaines Tâches Planifiées

- [ ] Saisie des premiers parfums de niche réels depuis l'interface [`/admin/produits`](file:///c:/Users/PC/Desktop/Maison-Kenzi/src/admin/pages/Produits).
- [ ] Test d'une commande test en direct sur le site pour valider le flux complet.
