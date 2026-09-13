# Architecture d'intégration Odoo

## Principes

- Odoo est la source de vérité pour produits, catégories, stock, clients,
  commandes, tarifs et CRM.
- Les navigateurs ne communiquent jamais directement avec Odoo.
- L'API Gateway NestJS traduit les contrats publics en appels Odoo et masque
  identifiants techniques, erreurs internes et secrets.
- Les montants envoyés par le navigateur ne servent jamais à valoriser une
  commande.

## Flux catalogue

```mermaid
sequenceDiagram
  participant Web as Next.js
  participant BFF as API Gateway
  participant ERP as Odoo
  Web->>BFF: GET /api/products?search=&category=&sort=
  BFF->>ERP: searchRead(product.product)
  ERP-->>BFF: produits, prix, stock, catégorie
  BFF-->>Web: contrat Product
```

Le cache storefront est limité à cinq minutes. La disponibilité est toujours
revalidée au moment de commander.

## Flux commande

```mermaid
sequenceDiagram
  participant Web as Checkout
  participant BFF as API Gateway
  participant ERP as Odoo
  Web->>BFF: POST /api/orders (IDs + quantités)
  BFF->>ERP: stock temps réel
  BFF->>ERP: rechercher/créer partenaire
  BFF->>ERP: créer sale.order
  alt Paiement à la livraison
    BFF->>ERP: action_confirm
    BFF-->>Web: confirmed
  else Mobile Money
    BFF-->>Web: pending_payment
  end
```

## Flux CRM

`POST /api/contacts` valide les données et crée un `crm.lead`. Une panne Odoo
est exposée en `503`, sans perdre la nature temporaire de l'erreur.

## Durcissement requis avant paiement en production

1. Ajouter une clé d'idempotence à `POST /orders`.
2. Créer la commande en brouillon avant le paiement.
3. Initialiser la transaction chez le fournisseur depuis le serveur.
4. Vérifier signature, montant, devise et unicité du webhook.
5. Confirmer la commande dans une transaction métier idempotente.
6. Publier un événement de confirmation et envoyer les notifications.
7. Stocker un journal d'audit sans données bancaires ni secrets.

## Décisions à prendre

- Odoo Portal ou fournisseur OIDC pour l'identité client.
- Fournisseur de paiement prioritaire et pays/devise couverts.
- Politique de réservation de stock et expiration des commandes impayées.
- Gestion des remboursements, retours et avoirs.
- SLA, retry, circuit breaker et file d'attente asynchrone.
