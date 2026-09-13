# API d’administration IMANA Signature

Toutes les routes sont préfixées par `/api/admin`. Elles nécessitent une session
ouverte via `POST /api/auth/login` et un utilisateur de rôle `manager` ou
`admin`. Les suppressions, la gestion des rôles et le journal d’audit exigent le
rôle `admin`.

## Initialisation

Définir avant le premier démarrage :

```dotenv
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=une-phrase-secrete-de-12-caracteres-minimum
ADMIN_NAME=Administrateur
```

Le compte est créé automatiquement. Si l’adresse existe déjà, elle reçoit le
rôle administrateur sans modifier son mot de passe.

## Ressources CRUD

Les ressources suivantes acceptent `GET`, `GET /:id`, `POST`, `PATCH /:id` et
`DELETE /:id` :

- `/categories`
- `/products`
- `/variants`
- `/payment-methods`
- `/delivery-zones`
- `/campaigns`
- `/articles`
- `/faqs`
- `/social-publications`

Les listes acceptent `page`, `limit` et `q`. Les champs JSON comme les attributs
de variantes, la configuration des paiements ou les métriques de campagne sont
validés puis sérialisés par le serveur.

## CRM et droits

- `GET /me`
- `GET|POST /users`
- `PATCH /users/:id`
- `GET /members`
- `PATCH /members/:email`
- `GET /audit-logs` — administrateur uniquement

Rôles disponibles : `visitor`, `client`, `manager`, `admin`.

## Commerce et opérations

- `GET|POST /orders`
- `PATCH /orders/:id`
- `GET /invoices`
- `POST /invoices`
- `PATCH /invoices/:id`
- `GET /transactions`
- `PATCH /transactions/:id`
- `GET|POST /deliveries`
- `PATCH /deliveries/:id`
- `POST /stock/movements`

Un mouvement de stock cible exactement un produit ou une variante. Sa création
et la mise à jour du stock sont exécutées dans la même transaction SQLite. Un
stock négatif est refusé.

## Pilotage

- `GET /dashboard` — commandes, CA, facturation, transactions, livraisons,
  clients, membres, stock réel et valorisations au coût et au prix de vente.
- `GET /seo-analysis` — contrôles et scores des produits et articles.
- `GET /integrations` — état de configuration des fournisseurs.

## Paiements

Les méthodes initiales sont : espèces, virement bancaire, Wave, Orange Money et
Stripe. Leur activation et leur moment d’encaissement (`order` ou `delivery`)
sont administrables.

`POST /api/payments/create` initialise un règlement alternatif à partir d’une
commande existante :

```json
{
  "checkoutSessionId": "cs_...",
  "method": "wave"
}
```

Wave utilise son endpoint Checkout officiel. Orange Money utilise l’URL et le
jeton fournis par le contrat marchand, qui varie selon le pays et l’offre :

```dotenv
WAVE_API_KEY=
ORANGE_MONEY_API_URL=
ORANGE_MONEY_ACCESS_TOKEN=
ORANGE_MONEY_MERCHANT_KEY=
```

Les secrets restent exclusivement côté serveur.

## Publications sociales

Les publications peuvent être préparées et planifiées dans
`/social-publications`. La publication immédiate utilise :

```text
POST /social-publications/:id/publish
```

Le backend appelle un connecteur fixe configuré avec
`SOCIAL_PUBLISH_WEBHOOK_URL` et éventuellement
`SOCIAL_PUBLISH_WEBHOOK_TOKEN`. Ce connecteur peut être une automatisation
Meta/Instagram, TikTok, LinkedIn ou un outil d’orchestration disposant des
autorisations propres à chaque réseau.

## Limites de déploiement

SQLite convient à une instance unique. Pour plusieurs instances applicatives,
les tables et transactions doivent être migrées vers PostgreSQL. Les tâches
planifiées de campagnes et publications nécessitent également un worker et une
file de travaux en production.
