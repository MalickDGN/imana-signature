# Plan QA, recette et mise en production

## Pyramide de tests

- Unitaires : mapping Odoo, stock, règles commande, validation DTO.
- Intégration : checkout React, persistance panier, erreurs API.
- Contrat : OpenAPI contre les contrôleurs et réponses.
- E2E : catalogue -> produit -> panier -> checkout -> confirmation.
- Non fonctionnels : accessibilité, sécurité, charge et Core Web Vitals.

## Scénarios de recette critiques

| ID | Scénario | Résultat attendu |
|---|---|---|
| CAT-01 | Recherche par nom | Résultats Odoo correspondants |
| CAT-02 | Filtre catégorie + tri prix | Liste filtrée et ordonnée |
| STO-01 | Stock insuffisant après ajout panier | Commande refusée, panier conservé |
| ORD-01 | Paiement livraison | Commande Odoo confirmée |
| ORD-02 | Mobile Money | Commande en attente, aucune confirmation anticipée |
| ORD-03 | Double soumission | Une seule commande après idempotence |
| CRM-01 | Formulaire valide | Lead Odoo créé |
| CRM-02 | Odoo indisponible | Message temporaire, réponse 503 |
| A11Y-01 | Parcours clavier | Toutes les actions atteignables et visibles |
| SEO-01 | Fiche produit | title, description et Product JSON-LD valides |

## CI

Chaque pull request doit exécuter :

1. installation avec lockfile gelé ;
2. typecheck des packages, applications et tests ;
3. lint ;
4. tests unitaires et intégration ;
5. build de production ;
6. à ajouter : audit dépendances, SAST et Playwright.

## Critères de mise en production

- Zéro test critique en échec.
- Secrets fournis par un gestionnaire de secrets.
- Sauvegarde/restauration Odoo testée.
- Webhooks de paiement signés et idempotents.
- Textes légaux et consentement analytics validés.
- Audit WCAG manuel et Lighthouse réalisé sur l'environnement cible.
- Procédure de rollback et supervision opérationnelles.
