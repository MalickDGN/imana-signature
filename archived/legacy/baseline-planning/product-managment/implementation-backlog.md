# Backlog d'alignement SFD

## Critique - MVP

| Epic | User story | Charge | Dépendances | Risque |
|---|---|---:|---|---|
| Identité | En tant que client, je crée et sécurise mon compte | 15-25 j | Choix Odoo Portal/OIDC | Élevé |
| Paiement | Je paie via un fournisseur réel et vérifié | 15-20 j | Contrat, sandbox, clés | Élevé |
| Commande | Une relance ne crée jamais deux commandes | 5-8 j | Stockage idempotence | Élevé |
| E2E | Le parcours achat passe dans un navigateur en CI | 4-6 j | Environnement Odoo QA | Moyen |
| Sécurité | API protégée par rate limit, headers et audit | 5-8 j | Politique sécurité | Moyen |

## Haute - V1

| Epic | Feature | Charge |
|---|---|---:|
| Compte | Historique, factures, adresses et retours | 15-25 j |
| Marketing | Promotions et coupons Odoo | 8-12 j |
| Engagement | Wishlist persistée par compte | 5-8 j |
| Contenu | Blog, avis et newsletter | 12-18 j |
| Admin | Tableau de bord commandes et alertes | 10-15 j |
| SEO | Sitemap produits et breadcrumbs structurés | 3-5 j |

## Moyenne - V1.5

- Filtres avancés, suggestions et recherche instantanée : 10-15 j.
- Produits associés et récemment consultés : 5-8 j.
- Fidélité Odoo : 12-20 j.
- WhatsApp Business, chat et FAQ dynamique : 8-15 j.

## Faible - V2+

- Application mobile et notifications push.
- Comparateur.
- Recommandations personnalisées.
- Multi-boutiques, langues, devises et marketplace.

Les estimations sont des jours-personne indicatifs et doivent être recalibrées
après réception du CDC, des maquettes et des contrats fournisseurs.
