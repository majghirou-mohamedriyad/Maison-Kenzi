# Règle de Structure du Projet & Organisation des Dossiers

## 1. Principe de Modularité & Séparation des Responsabilités (Clean Architecture)
Le projet doit respecter une arborescence claire, prévisible et strictement typée. Chaque responsabilité (Main process, Preload, Renderer UI, Services métier, Schéma base de données, Tests) possède son répertoire dédié.

---

## 2. Arborescence Standard du Projet NexPoint POS

```
NexPoint/
├── .agents/                      # Skills, Rules et Directives de l'assistant
│   ├── rules/
│   └── skills/
├── docs/                         # Documentation technique, ADRs, guides matériel
│   ├── adr/                      # Architecture Decision Records
│   ├── api/                      # Documentation API IPC et REST
│   └── hardware/                 # Guides de configuration imprimantes/balances
├── prisma/                       # Schéma ORM, migrations et scripts de seed
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── main/                     # Processus Principal Electron (Node.js)
│   │   ├── config/               # Constantes, chemins de DB, safeStorage
│   │   ├── database/             # Client Prisma initialisé, PRAGMA WAL
│   │   ├── hardware/             # Drivers ESC/POS, RS232, tiroir RJ11
│   │   ├── ipc/                  # Handlers IPC organisés par domaine métier
│   │   │   ├── auth.ipc.ts
│   │   │   ├── cash.ipc.ts
│   │   │   ├── products.ipc.ts
│   │   │   └── sales.ipc.ts
│   │   ├── services/             # Logique métier pure (calcul TVA, stock, Z)
│   │   ├── index.ts              # Point d'entrée Main process
│   │   └── updater.ts            # Gestion auto-updater
│   ├── preload/                  # Ponts IPC sécurisés (contextBridge)
│   │   ├── index.ts              # API exposée au Renderer (window.api)
│   │   └── customer.ts           # Preload spécifique écran client
│   ├── renderer/                 # Interface Utilisateur React + Tailwind
│   │   ├── src/
│   │   │   ├── assets/           # Logos, sons de confirmation scan
│   │   │   ├── components/       # Composants réutilisables (shadcn/ui, boutons, modals)
│   │   │   │   ├── common/
│   │   │   │   ├── layout/
│   │   │   │   └── ui/
│   │   │   ├── hooks/            # Hooks React personnalisés (raccourcis clavier, scan)
│   │   │   ├── i18n/             # Fichiers de traductions (FR, AR, EN)
│   │   │   ├── pages/            # Écrans de l'application
│   │   │   │   ├── Caisse/
│   │   │   │   ├── ClotureZ/
│   │   │   │   ├── Depenses/
│   │   │   │   ├── Facturation/
│   │   │   │   ├── Produits/
│   │   │   │   ├── Rapports/
│   │   │   │   └── RhPointage/
│   │   │   ├── stores/           # Zustand Stores (panier, session, UI)
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── index.css
│   │   ├── index.html
│   │   └── customer.html         # Template HTML écran client secondaire
│   └── shared/                   # Types et contrats partagés Main <-> Renderer
│       ├── constants/
│       ├── schemas/              # Schémas de validation Zod
│       └── types/                # Types TypeScript (IpcResponse, etc.)
├── tests/                        # Tests automatisés
│   ├── e2e/                      # Tests Playwright Electron
│   └── unit/                     # Tests unitaires Vitest (TVA, panier)
├── Avancement.md                 # Journal de suivi du projet (mis à jour après chaque tâche)
├── cdc.md                        # Cahier des charges exhaustif
├── electron-builder.yml          # Configuration de packaging NSIS Windows
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Règles d'Organisation
1. **Un composant = Un fichier dédié** : Ne pas accumuler plusieurs gros composants dans le même fichier.
2. **Types partagés dans `src/shared/`** : Tout type ou schéma Zod utilisé à la fois côté Renderer et Main doit résider dans `src/shared/`.
3. **Services découplés** : La logique métier de calculs de prix/TVA ne doit pas dépendre de React ni d'Electron, afin de pouvoir être testée unitairement sous Vitest.
