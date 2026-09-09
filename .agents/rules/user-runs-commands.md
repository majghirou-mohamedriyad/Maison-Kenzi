# Règle d'Exécution des Commandes : Contrôle Total par l'Utilisateur

## Principe Fondamental
L'assistant IA **ne doit pas exécuter automatiquement les commandes de build, d'installation (`npm install`, `npx prisma...`) ou de terminal**, sauf demande explicite.

---

## Directives d'Exécution :
1. **Fournir les Commandes Formatées** : Toujours présenter les blocs de commandes bash / powershell clairs, ordonnés et commentés dans la réponse pour que l'utilisateur les lance lui-même dans son terminal.
2. **Explication & Objectif** : Pour chaque groupe de commandes (installation, migration de base, démarrage du serveur de dév), expliquer brièvement ce qu'elle accomplit.
