# NexPoint / Maison-Kenzi — Suivi d'Avancement du Projet

## État d'Avancement Global

- **Dernière mise à jour** : 2026-09-09
- **Statut général** : Création du schéma PostgreSQL dédié `maisonkenzi` et mise à jour du script d'initialisation

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
- [x] Configuration de la Base de Données Supabase VPS :
  - [x] Fichier `.env` configuré avec l'IP et la clé du VPS.
  - [x] Création du script SQL dédié [`setup_maisonkenzi_database.sql`](file:///c:/Users/PC/Desktop/Maison-Kenzi/supabase/setup_maisonkenzi_database.sql) avec le schéma `maisonkenzi` et les droits PostgREST (`anon`, `authenticated`, `service_role`).
  - [x] Mise à jour de [`src/integrations/supabase/client.ts`](file:///c:/Users/PC/Desktop/Maison-Kenzi/src/integrations/supabase/client.ts) pour interroger par défaut le schéma `maisonkenzi`.

---

## Prochaines Tâches Planifiées

- [ ] Exécution du script SQL `setup_maisonkenzi_database.sql` dans le SQL Editor de Supabase sur le VPS.
- [ ] Ajout de la variable `PGRST_DB_SCHEMAS="public,storage,graphql_public,maisonkenzi"` dans la configuration Supabase du VPS si besoin.
