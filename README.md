# Maison Kenzi — Plateforme E-Commerce Haute Couture

<p align="center">
  <img src="public/mk-logo.png" alt="Logo Maison Kenzi" width="140" />
</p>

<p align="center">
  <strong>Plateforme e-commerce de prestige dédiée à la Haute Parfumerie, aux Soins Cosmétiques, aux Créations Artisanales et au Bazar Chic & Décoration.</strong><br>
  Une expérience d'achat sur-mesure alliant élégance visuelle, personnalisation d'exception, rapidité de commande et administration complète des ventes.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React 18" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Stripe-Elements-635BFF?style=flat-square&logo=stripe&logoColor=white" alt="Stripe" />
  <img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" />
</p>

---

## Sommaire

- [Aperçu du Projet](#aperçu-du-projet)
- [Piliers Fonctionnels](#piliers-fonctionnels)
  - [1. Expérience Client & Design Haute Couture](#1-expérience-client--design-haute-couture)
  - [2. Catalogue & Les 4 Univers](#2-catalogue--les-4-univers)
  - [3. Tunnels de Commande & Paiement Sécurisé](#3-tunnels-de-commande--paiement-sécurisé)
  - [4. Espace Client Privilège](#4-espace-client-privilège)
  - [5. Moteur de Promotions & Codes Réduction](#5-moteur-de-promotions--codes-réduction)
  - [6. Espace d'Administration & Pilotage](#6-espace-dadministration--pilotage)
  - [7. Infrastructure Serveur & Sécurité](#7-infrastructure-serveur--sécurité)
- [Stack Technique](#stack-technique)
- [Architecture du Projet](#architecture-du-projet)
- [Installation & Démarrage](#installation--démarrage)
  - [Prérequis](#prérequis)
  - [Configuration de l'Environnement](#configuration-de-lenvironnement)
  - [Lancement Local](#lancement-local)
- [Commandes Disponibles](#commandes-disponibles)
- [Sécurité & Conformité](#sécurité--conformité)
- [Licence & Droits](#licence--droits)

---

## Aperçu du Projet

**Maison Kenzi** est une solution e-commerce haut de gamme conçue pour valoriser des créations artisanales et des collections exclusives de haute parfumerie. Conçue avec une exigence éditoriale stricte, la plateforme associe des performances de chargement instantanées, un design immersif adaptatif (clair/sombre), un double tunnel de commande sécurisé et un back-office complet de pilotage commercial.

---

## Piliers Fonctionnels

### 1. Expérience Client & Design Haute Couture
- **Direction Artistique Luxury Nude** : Palette chromatique élégante (Nude, Travertin, Noir épuré et accents Doré Champagne `#9E7938`).
- **Double Thème Visuel** : Basculement fluide entre Mode Clair et Mode Sombre.
- **Conception 100% Responsive** : Expérience tactile fluide optimisée pour mobiles, tablettes et grands écrans.
- **Plateforme Bilingue (Français / Anglais)** : Internationalisation complète (i18n) des interfaces, catalogues, fiches et formulaires.
- **Micro-interactions Cinématographiques** : Transitions douces, survol subtil et icônes vectorielles professionnelles exclusives (`lucide-react`, zéro emoji).

### 2. Catalogue & Les 4 Univers
- **Parfums de Niche** : Pyramide olfactive éditoriale (Notes de tête, cœur, fond), filtres par genre, saisons et formats.
- **Produits Cosmétiques & Soins** : Fiches détaillées, conseils d'application et ingrédients d'exception.
- **Produits Artisanaux** : Offres par paliers et packs multi-pièces avec calcul direct de l'économie réalisée.
- **Bazar Chic & Décoration** : Options de personnalisation client sur-mesure (pastilles de teintes, tailles/dimensions, gravure/monogramme personnalisé).
- **Recherche & Recommandations** : Moteur de recherche instantané et carrousels intelligents de produits similaires.

### 3. Tunnels de Commande & Paiement Sécurisé
- **Tiroir Panier Flottant** : Consultation en direct sans rupture de navigation, gestion des quantités et jauge dynamique pour le palier de livraison offerte.
- **Commande Express (1-Clic)** : Formulaire d'achat direct accéléré depuis la fiche produit avec pré-remplissage des coordonnées.
- **Paiement Sécurisé Stripe Elements** : Prise en charge des Cartes Bancaires, Apple Pay et Stripe Link avec validation stricte des adresses et formats internationaux (Belgique, France, Maroc, etc.).
- **Canal Conciergerie WhatsApp** : Accès direct à l'assistance privée pour un suivi personnalisé des commandes.

### 4. Espace Client Privilège
- **Gestion des Comptes Clients** : Inscription et connexion complètes (Nom, Prénom, Téléphone, Email, Date de naissance, Mot de passe avec affichage/masquage sécurisé).
- **Espace « Mon Compte »** : Consultation et mise à jour en direct des coordonnées personnelles et de l'adresse de livraison par défaut.
- **Historique & Suivi des Commandes** : Consultation en temps réel des commandes passées et des statuts de livraison.
- **Sécurisation du Processus d'Achat** : Protection du tunnel de paiement et invitation fluide à l'authentification avec reprise immédiate du panier.

### 5. Moteur de Promotions & Codes Réduction
- **Typologie des Réductions** : Pourcentages (-10%, -20%), Montants fixes (-15 EUR) et Livraison gratuite.
- **Périmètre de Ciblage Avancé** :
  - Offre globale sur l'ensemble de la boutique.
  - Offre restreinte à un univers spécifique (ex. Parfums ou Bazar Chic).
  - Offre ciblée nominativement sur une sélection de produits précis avec calcul de remise appliqué exclusivement sur les articles éligibles.
- **Contrôles Anti-Fraude** : Seuils minimaux d'achat, dates de validité, quotas d'utilisations globaux et limitation stricte à une utilisation par client.

### 6. Espace d'Administration & Pilotage
- **Tableau de Bord Stratégique** : Indicateurs clés en direct (Chiffre d'affaires, volume de commandes, catalogue actif, meilleures ventes).
- **Gestion Complète du Catalogue & Stocks** : Création, modification, upload d'images haute définition, gestion des variantes et des options de personnalisation.
- **Répertoire & Fiches Clients** : Consultation complète des clients, âges calculés, coordonnées, volume d'achats et montant cumulé dépensé, avec recherche multi-champs et tri avancé.
- **Gestion des Promotions** : Création assistée de codes promotionnels, générateur de préfixes, interrupteur d'activation 1-clic et purge globale sécurisée.

### 7. Infrastructure Serveur & Sécurité
- **Déploiement VPS & Haute Disponibilité** : Conteneurisation Docker, gestionnaire de processus PM2 et serveur Nginx.
- **Chiffrement SSL / HTTPS** : Certificats Let's Encrypt et protocoles cryptographiques stricts.
- **Base de Données PostgreSQL & Sécurité RLS** : Politiques de Row Level Security garantissant l'étanchéité des données sensibles.

---

## Stack Technique

| Domaine | Technologies |
| :--- | :--- |
| **Frontend Framework** | React 18, TypeScript 5, Vite 5 |
| **Styling & Design System** | Tailwind CSS 3.4, Radix UI, Class Variance Authority, Lucide Icons |
| **State Management** | Context API React, Stores personnalisés |
| **Backend & Base de Données** | Supabase (PostgreSQL, Auth, Storage, Row Level Security) |
| **Paiement & Monétique** | Stripe Elements, Stripe JS (@stripe/react-stripe-js) |
| **Formulaires & Validation** | React Hook Form, Zod |
| **Internationalisation** | Architecture bilingue native (FR / EN) |
| **Serveur & Déploiement** | VPS Debian/Ubuntu, Docker, Nginx, PM2, Node.js |

---

## Architecture du Projet

```text
Maison-Kenzi/
├── public/                 # Assets statiques publics (logo officiel, icônes, manifest)
├── src/
│   ├── admin/              # Module Back-Office Administration
│   │   ├── components/     # Composants dédiés (ProductModal, ProductTable, etc.)
│   │   ├── pages/          # Dashboard, Produits, Commandes, Clients, Promotions, Finances
│   │   ├── AdminGuard.tsx  # Protection des accès administrateur
│   │   └── AdminLayout.tsx # Structure et navigation de la console d'administration
│   ├── assets/             # Visuels et feuilles de style spécifiques
│   ├── components/         # Composants réutilisables
│   │   ├── auth/           # Modales de connexion et d'inscription client
│   │   ├── checkout/       # Modules de paiement Stripe Elements et validation
│   │   ├── content/        # Sections éditoriales, carrousels, formulaires express
│   │   ├── header/         # En-tête, navigation bilingue et tiroir panier flottant
│   │   ├── footer/         # Pied de page de prestige et mentions légales
│   │   └── ui/             # Composants d'interface stylisés (shadcn/ui / Radix UI)
│   ├── contexts/           # Fournisseurs d'état (CustomerAuth, Promo, Cart, Theme)
│   ├── data/               # Données de référence initiales
│   ├── hooks/              # Hooks React sur-mesure (useParfums, useToast, etc.)
│   ├── i18n/               # Dictionnaires de traduction (Français / Anglais)
│   ├── lib/                # Fonctions utilitaires, calculs de prix et helpers
│   ├── pages/              # Pages publiques (Accueil, Univers, Fiche Produit, Commande, Compte)
│   ├── services/           # Services API Supabase & Stripe (promo, client, commande)
│   ├── store/              # Stores de synchronisation d'état local et persistance
│   ├── types/              # Définitions des types et interfaces TypeScript
│   ├── App.tsx             # Configuration des routes publiques et administratives
│   ├── index.css           # Tokens de design, typographies et styles globaux
│   └── main.tsx            # Point d'entrée de l'application
├── supabase/
│   ├── migrations/         # Schémas et migrations SQL de la base de données
│   └── setup_maisonkenzi_database.sql # Script SQL complet d'initialisation
├── index.html              # Fichier HTML d'entrée & métadonnées SEO
├── tailwind.config.ts      # Configuration des couleurs et du design system Tailwind
├── vite.config.ts          # Configuration de l'environnement Vite
└── package.json            # Dépendances et scripts de développement
```

---

## Installation & Démarrage

### Prérequis
- **Node.js** version 18 ou supérieure
- Gestionnaire de paquets **npm**, **pnpm** ou **yarn**
- Instance **Supabase** (Cloud ou VPS Docker auto-hébergé)
- Compte **Stripe** (Clé publiable & clé secrète)

### Configuration de l'Environnement

Créez un fichier `.env` à la racine du projet avec les variables suivantes :

```env
VITE_SUPABASE_URL="https://votre-domaine-ou-projet.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="votre_cle_publique_anon_supabase"
VITE_STRIPE_PUBLISHABLE_KEY="pk_test_votre_cle_publique_stripe"
```

### Lancement Local

1. **Installer les dépendances :**
   ```bash
   npm install
   ```

2. **Démarrer le serveur de développement :**
   ```bash
   npm run dev
   ```

3. **Accéder à l'application :**
   Ouvrez votre navigateur à l'adresse [http://localhost:5173](http://localhost:5173).

---

## Commandes Disponibles

| Commande | Rôle |
| :--- | :--- |
| `npm run dev` | Démarre le serveur local de développement avec rechargement à chaud (HMR) |
| `npm run build` | Génère le bundle de production optimisé dans le dossier `dist/` |
| `npm run preview` | Prévisualise localement le rendu de production généré |
| `npm run lint` | Analyse le code TypeScript et React pour vérifier la conformité |

---

## Sécurité & Conformité

- **Row Level Security (RLS)** : Cloisonnement strict des données entre clients et administrateurs sur PostgreSQL.
- **Paiements Conformes PCI-DSS** : Les données bancaires transitent exclusivement par les serveurs sécurisés de Stripe (aucune donnée de carte n'est stockée localement).
- **Protection des Routes & Guards** : Contrôle systématique des autorisations administratives avant l'accès au back-office.
- **Validation Zod de Bout en Bout** : Assainissement et validation stricte de toutes les données saisies par les utilisateurs.
- **Règles d'Ingénierie & Zéro Emoji** : Interface épurée et typographie sobre respectant les standards de l'industrie du luxe.

---

## Licence & Droits

Tous droits réservés. Projet conçu et développé pour la marque **Maison Kenzi**.