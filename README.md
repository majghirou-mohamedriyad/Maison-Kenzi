# 🌿 Maison Kenzi | Parfums & Produits Cosmétiques

<p align="center">
  <img src="public\mk-logo-light-removebg.png" alt="Maison Kenzi Logo" width="120" />
</p>

<p align="center">
  <strong>Maison marocaine de haute parfumerie et soins d'exception.</strong><br>
  Une plateforme e-commerce moderne, élégante et performante dédiée aux fragrances authentiques et aux soins premium au Maroc.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
</p>

---

## 📑 Sommaire

- [À propos du projet](#-à-propos-du-projet)
- [✨ Fonctionnalités Principales](#-fonctionnalités-principales)
  - [🛍️ Boutique & Expérience Client](#-boutique--expérience-client)
  - [⚡ E-Commerce & Tunnel d'Achat](#-e-commerce--tunnel-dachat)
  - [🛡️ Back-Office & Administration](#️-back-office--administration)
  - [🤖 Support Client & Assistant IA](#-support-client--assistant-ia)
- [🛠️ Stack Technique](#️-stack-technique)
- [📂 Structure du Projet](#-structure-du-projet)
- [🚀 Démarrage Rapide](#-démarrage-rapide)
  - [Prérequis](#prérequis)
  - [Installation](#installation)
  - [Variables d'Environnement](#variables-denvironnement)
  - [Initialisation de la Base de Données](#initialisation-de-la-base-de-données)
  - [Lancer l'Application](#lancer-lapplication)
- [📦 Scripts Disponibles](#-scripts-disponibles)
- [🔒 Sécurité & Bonnes Pratiques](#-sécurité--bonnes-pratiques)
- [🌐 Déploiement](#-déploiement)
- [🤝 Contribution](#-contribution)
- [📄 Licence](#-licence)

---

## 📖 À propos du projet

**Maison Kenzi** est une application web e-commerce moderne conçue pour offrir une expérience utilisateur haut de gamme et immersive. Elle met en valeur des collections exclusives de parfums (Homme, Femme, Unisexe), de déodorants sticks de luxe et de coffrets cadeaux, avec une logistique adaptée au marché marocain (paiement à la livraison - *Cash on Delivery*, suivi en temps réel et livraison rapide).

---

## ✨ Fonctionnalités Principales

### 🛍️ Boutique & Expérience Client
- **Catalogue Dynamique** : Navigation fluide par collections, genres, notes olfactives et saisons.
- **Fiches Produits Riches** : Visualisation détaillée, sélection des contenances, prévisualisation interactive des flacons (`FlaconPreview`).
- **Thèmes Personnalisables** : Support complet du mode Sombre (*Dark Mode*) et Clair (*Light Mode*).
- **SEO Avancé & Données Structurées** : Intégration OpenGraph, Twitter Cards et balises JSON-LD (`schema.org`) pour un référencement optimal.
- **Design Responsive & Micro-interactions** : Interface ultra-fluide adaptée mobile, tablette et desktop grâce à Tailwind CSS et Radix UI.

### ⚡ E-Commerce & Tunnel d'Achat
- **Panier Interactif (`CartProvider`)** : Sauvegarde locale, modification rapide des quantités et calcul dynamique des totaux.
- **Tunnel de Commande Express (`Checkout`)** : Formulaire optimisé pour le marché local avec validation Zod et gestion du paiement à la livraison (COD).
- **Génération de Factures PDF** : Téléchargement et visualisation des reçus et factures au format PDF avec `jspdf` et `jspdf-autotable`.

### 🛡️ Back-Office & Administration
- **Espace Administrateur Sécurisé (`/admin`)** : Authentification protégée par `AdminGuard`.
- **Tableau de Bord & Analytics** : Statistiques des ventes, graphiques d'évolution du chiffre d'affaires et indicateurs de performance avec `Recharts`.
- **Gestion des Produits & Stocks** : Ajout, modification, gestion des prix, statuts et stocks en temps réel.
- **Gestion des Commandes & Clients** : Suivi des statuts (En attente, Confirmée, Expédiée, Livrée), historique client et fiches de livraison.
- **Gestion Saisonnière & Best-Sellers** : Mise en avant simplifiée des produits vedettes et offres du moment.
- **Finances & Rapports** : Suivi détaillé des transactions et marges.
- **Mode Maintenance** : Passerelle de maintenance activable pour les opérations techniques (`MaintenanceGate`).

### 🤖 Support Client & Assistant IA
- **ChatBot Interactif Intégré** : Réponse instantanée aux questions fréquentes des clients (suivi de commande, conseils parfumerie, délais de livraison).
- **Console d'Administration du Bot** : Personnalisation des réponses et paramètres de l'assistant depuis l'espace admin.

---

## 🛠️ Stack Technique

| Domaine | Technologies |
| :--- | :--- |
| **Frontend** | [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/) |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/) (Radix UI), [Lucide Icons](https://lucide.dev/) |
| **State & Data Fetching** | Context API, [TanStack React Query v5](https://tanstack.com/query/latest) |
| **Base de Données & Auth** | [Supabase](https://supabase.com/) (PostgreSQL, Row Level Security, Edge Functions) |
| **Formulaires & Validation** | [React Hook Form](https://react-hook-form.com/), [Zod](https://zod.dev/) |
| **Visualisation & Rapports** | [Recharts](https://recharts.org/), [jsPDF](https://github.com/parallax/jsPDF) & `jspdf-autotable` |
| **Carrousels & Gestures** | [Embla Carousel React](https://www.embla-carousel.com/) |

---

## 📂 Structure du Projet

```text
tabatparfum/
├── public/                 # Assets statiques (logos, favicons, illustrations)
├── src/
│   ├── admin/              # Module Back-Office (Pages, Composants, Layouts, Guards)
│   │   ├── pages/          # Dashboard, Produits, Commandes, Clients, Finances, etc.
│   │   ├── AdminGuard.tsx  # Protection des routes admin
│   │   ├── AdminLayout.tsx # Navigation et mise en page back-office
│   │   └── AdminLogin.tsx  # Connexion administrateur
│   ├── assets/             # Images, icônes et styles importés
│   ├── components/         # Composants réutilisables
│   │   ├── ui/             # Composants de base shadcn/ui (Button, Dialog, etc.)
│   │   ├── header/         # En-tête et navigation principale
│   │   ├── footer/         # Pied de page et liens légaux
│   │   ├── product/        # Cartes produits, filtres, sélecteurs
│   │   ├── ChatBot.tsx     # Assistant conversationnel
│   │   └── Seo.tsx         # Gestionnaire de métadonnées SEO
│   ├── contexts/           # Contextes React (ThemeContext, etc.)
│   ├── data/               # Données de référence et mock data (parfums.ts)
│   ├── hooks/              # Hooks React personnalisés (use-toast, use-mobile, etc.)
│   ├── integrations/       # Client et connecteurs d'APIs (Supabase)
│   ├── lib/                # Fonctions utilitaires (utils.ts)
│   ├── pages/              # Pages publiques (Index, Category, ProductDetail, Checkout, About)
│   ├── store/              # Gestion d'état global du panier (cart.tsx)
│   ├── types/              # Définitions TypeScript
│   ├── App.tsx             # Routeur principal et configuration globale
│   ├── index.css           # Thèmes Tailwind et variables CSS
│   └── main.tsx            # Point d'entrée de l'application
├── supabase/
│   ├── migrations/         # Migrations SQL de la base de données
│   └── setup_tabat_database.sql # Script complet d'initialisation Supabase
├── index.html              # Fichier HTML d'entrée & métadonnées globales
├── tailwind.config.ts      # Configuration Tailwind CSS
├── vite.config.ts          # Configuration de Vite
└── package.json            # Dépendances et scripts du projet
```

---

## 🚀 Démarrage Rapide

### Prérequis
- [Node.js](https://nodejs.org/) (version 18+ recommandée)
- Un gestionnaire de paquets : `npm`, `yarn` ou `pnpm`
- Un projet [Supabase](https://supabase.com/) configuré

### Installation

1. **Cloner le dépôt :**
   ```bash
   git clone https://github.com/Azzammoo10/tabatparfum.git
   cd tabatparfum
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

### Variables d'Environnement

Créez un fichier `.env` à la racine du projet et renseignez vos clés Supabase :

```env
VITE_SUPABASE_PROJECT_ID="votre_project_id"
VITE_SUPABASE_URL="https://votre_project_id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="votre_publishable_key"
```

### Initialisation de la Base de Données

Exécutez le script SQL fourni dans le SQL Editor de votre projet Supabase :
- Fichier : [`supabase/setup_tabat_database.sql`](supabase/setup_tabat_database.sql)

Ce script configure les tables de produits, catégories, commandes, clients, paramètres du site, ainsi que les stratégies de sécurité RLS (*Row Level Security*).

### Lancer l'Application

Démarrez le serveur de développement local :

```bash
npm run dev
```

Ouvrez ensuite [http://localhost:5173](http://localhost:5173) dans votre navigateur.

---

## 📦 Scripts Disponibles

| Commande | Description |
| :--- | :--- |
| `npm run dev` | Démarre le serveur de développement avec HMR |
| `npm run build` | Compile l'application TypeScript & Vite pour la production |
| `npm run build:dev` | Compile l'application en mode développement |
| `npm run preview` | Prévisualise localement le bundle de production généré |
| `npm run lint` | Analyse le code avec ESLint pour détecter les erreurs |

---

## 🔒 Sécurité & Bonnes Pratiques

- **Politique de Sécurité du Contenu (CSP)** : Configurée dans `index.html` pour restreindre les sources autorisées.
- **Row Level Security (RLS)** : Activé sur Supabase pour garantir la confidentialité des données sensibles (commandes, clients, finances).
- **Règles de Guarding Admin** : Vérification des droits d'accès avant le rendu des modules d'administration.
- **Validation Stricte** : Typage TypeScript de bout en bout et validation de formulaires avec Zod.

---

## 🌐 Déploiement

L'application est optimisée pour être déployée instantanément sur [Vercel](https://vercel.com/) ou [Netlify] :

1. Connectez votre dépôt GitHub à **Vercel** ou **Netlify**.
2. Configurez les variables d'environnement (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).
3. Le fichier [`vercel.json`](vercel.json) inclus gère automatiquement la réécriture des routes Single Page Application (SPA).

---

## 📄 Licence

Ce projet est développé pour la marque **Tabat**. Tous droits réservés.