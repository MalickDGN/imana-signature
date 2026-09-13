# Archive de consolidation Maison IMANA

Cette zone contient uniquement des éléments historiques sortis des chemins d'exécution actifs.
Elle n'est pas incluse dans les workspaces pnpm, les tâches Turborepo, les builds Docker,
les tests ou les déploiements.

## Matrice de classement

| Élément | Type | Ancien emplacement | Classification | Motif | Remplacement | Statut |
| --- | --- | --- | --- | --- | --- | --- |
| Snapshots `final`, `imana-signature`, `imana-signature-preview`, `unified` | Sources de consolidation | `merged/` | ARCHIVE / DELETE_CANDIDATE | Versions concurrentes non référencées par la racine active | Monorepo racine `apps/`, `packages/`, `services/`, `odoo/` | Archivé, suppression possible après validation historique |
| `index-save.html` | Sauvegarde storefront | racine | ARCHIVE / DELETE_CANDIDATE | Copie explicitement nommée, aucune référence runtime | `index.html` et `apps/frontend-web/` | Archivé |
| Templates HTML parfum | Prototype / template | `template/` | ARCHIVE / DELETE_CANDIDATE | Aucun import, route, script ou pipeline actif | Storefront actif et frontend Next.js | Archivé |
| Modèles d'import | Artefacts générés | `outputs/` | ARCHIVE / DELETE_CANDIDATE | Aucun runtime ne les lit depuis ce chemin | Génération et téléchargement par `apps/admin-portal/` et `apps/api-gateway/` | Archivé |
| Documents roadmap/backlog | Documentation historique | `baseline/` | ARCHIVE | Référentiel de consolidation, pas une dépendance d'exécution | `docs/` et `ROADMAP_FINAL.md` | Archivé pour traçabilité |
| Services vides `delivery-service`, `notification-service`, `payment-service`, `search-service` | Squelettes | `services/` | DELETE_CANDIDATE | Aucun package, script, import ou test validé | À recréer comme workspaces lorsqu'une implémentation validée existe | Retirés des chemins actifs |

## Règles d'isolation

- Aucun fichier actif ne dépend d'un chemin sous `archived/`.
- `pnpm-workspace.yaml` ne contient pas `archived/*`.
- Les tâches Turborepo ciblent uniquement les workspaces déclarés.
- Les Dockerfiles utilisent la racine comme contexte mais les fichiers archivés sont exclus
  par `.dockerignore`.
- Les snapshots archivés ont été copiés sans `node_modules`, `.next`, `dist`, caches,
  rapports, bases locales, logs ou fichiers `.env`.

## Politique de suppression

Les éléments marqués `DELETE_CANDIDATE` peuvent être supprimés définitivement après une
période de validation et après vérification qu'aucune comparaison historique n'est encore
requise. Cette archive n'est pas une seconde codebase et ne doit pas recevoir de nouveau code actif.
