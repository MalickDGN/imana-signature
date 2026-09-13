# Guide des Conventions de Code - IMANA Signature

Ce document définit les standards et les bonnes pratiques à suivre pour tout le développement au sein du projet.

## 1. Stratégie Git : GitFlow

Nous utilisons une stratégie GitFlow simplifiée.

-   **`main`** : Branche principale. Contient le code de production. Personne ne pousse directement dessus. Les merges se font uniquement via des Pull Requests depuis `develop`.
-   **`develop`** : Branche de développement principale. C'est la branche de base pour toutes les nouvelles fonctionnalités.
-   **`feature/<ticket-id>-description-courte`** : Branches de fonctionnalités.
    -   Exemple : `feature/IMN-123-add-product-wishlist`
    -   Créées à partir de `develop`.
    -   Une fois la fonctionnalité terminée, une Pull Request est ouverte pour merger dans `develop`.
-   **`fix/<ticket-id>-description-courte`** : Pour les corrections de bugs non urgents.
-   **`hotfix/<ticket-id>-description-courte`** : Pour les corrections urgentes en production. Créées à partir de `main` et mergées dans `main` ET `develop`.

## 2. Convention de Commits : Conventional Commits

Chaque message de commit **doit** respecter le format Conventional Commits. Ceci est **renforcé par `commitlint`** via un hook pre-commit.

**Format :** `<type>(<scope>): <sujet>`

-   **Types principaux :**
    -   `feat`: Ajout d'une nouvelle fonctionnalité.
    -   `fix`: Correction d'un bug.
    -   `docs`: Modification de la documentation.
    -   `style`: Changements de formatage (Prettier).
    -   `refactor`: Refactoring de code n'impactant pas les fonctionnalités.
    -   `test`: Ajout ou modification de tests.
    -   `chore`: Tâches diverses (mise à jour de build, dépendances).
    -   `ci`: Changements sur les fichiers de CI/CD.

-   **Exemples :**
    -   `feat(api): add endpoint for product reviews`
    -   `fix(frontend): correct cart total calculation`
    -   `docs(readme): update setup instructions`

## 3. Standards de Code

-   **Langage** : TypeScript sur tout le projet.
-   **Formatage** : `Prettier` est utilisé pour le formatage automatique. Il est exécuté via un hook `pre-commit`.
-   **Linting** : `ESLint` est utilisé pour l'analyse statique du code. Les règles sont définies dans les `package.json` de chaque application/package.