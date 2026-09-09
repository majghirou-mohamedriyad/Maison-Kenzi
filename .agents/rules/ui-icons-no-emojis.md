---
trigger: always_on
---

# Règle UI/UX : Interdiction des Emojis & Usage Exclusif d'Icônes Professionnelles

## 1. Principe Fondamental
Dans l'ensemble de l'application desktop (**NexPoint POS**), du site web vitrine, des composants d'interface utilisateur (UI), des modales, des boutons, des tickets de caisse, des factures PDF et des notifications :
- **INTERDICTION FORMELLE D'UTILISER DES EMOJIS DANS LE CODE ET L'INTERFACE** (ex: 🚀, 📦, 🇲🇦, 💰, 🛒, 👥, etc.).
- Tous les éléments visuels doivent reposer **exclusivement sur des icônes vectorielles professionnelles et cohérentes**.

---

## 2. Bibliothèques d'Icônes Autorisées

1. **Frontend React / Desktop POS & Site Web** :
   - Bibliothèque de référence : **`lucide-react`** (icônes SVG vectorielles modernes, sobres et légères).
   - Alternatives autorisées si besoin : `@radix-ui/react-icons` ou `heroicons/react`.

2. **Règles d'Intégration** :
   - Toujours importer les icônes explicitement (ex: `import { ShoppingCart, Printer, User, ShieldCheck, FileText, AlertTriangle } from 'lucide-react';`).
   - Dimensionner et colorer les icônes via des classes Tailwind sobres (ex: `w-5 h-5 text-slate-700 dark:text-slate-300`, `stroke-[1.75]`).
   - Conserver un style de trait (*stroke width*) uniforme dans toute l'application.

---

## 3. Documents Imprimés (Tickets ESC/POS & Factures PDF)
- **Tickets thermiques** : Uniquement du texte typographique net, des séparateurs en pointillés/lignes (`-` ou `=`), et éventuellement le logo bitmap monochrome de l'entreprise. Aucun emoji textuel.
- **Factures A4 PDF** : Logo vectoriel haute définition de la société et pictogrammes vectoriels SVG monochromes si nécessaire.
