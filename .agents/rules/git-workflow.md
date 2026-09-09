---
trigger: always_on
---

# Règle Git : Commandes de Commit Systématiques après Chaque Tâche

## Principe Fondamental
À la fin de chaque tâche, fonctionnalité, correction ou étape réalisée avec succès, **l'assistant doit systématiquement fournir à l'utilisateur le bloc de commandes Git prêt à l'emploi** avec un message de commit précis, descriptif et formaté selon les conventions (*Conventional Commits* : `feat:`, `fix:`, `refactor:`, `docs:`, etc.).

---

## Format Standard Obligatoire en Fin de Réponse

```bash
git add .
git commit -m "<type>(<scope>): <description claire et concise des changements>"
git push -u origin main
```

### Exemples :
- `git commit -m "feat(auth): ajout de l'authentification par code PIN et rate limiting"`
- `git commit -m "feat(caisse): integration du panier et calcul multi-taux TVA marocaine"`
- `git commit -m "docs(cdc): mise a jour complete du cahier des charges et architecture"`
