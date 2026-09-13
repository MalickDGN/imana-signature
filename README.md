# MAISON IMANA

Monorepo pnpm/Turborepo de la plateforme Maison IMANA : storefront Next.js,
portail d'administration, API Gateway NestJS, packages partagés et compatibilité
FastAPI/Odoo.

## Prérequis

- Node.js 22.5 ou supérieur
- pnpm 8.15.4 ou supérieur
- Un compte Stripe pour activer le paiement

## Installation

```bash
pnpm install --frozen-lockfile
copy .env.example .env
pnpm --filter @imana-signature/frontend-web dev
```

Les applications sont disponibles sur leurs ports de développement respectifs.
Le storefront historique Node reste lançable avec `npm start` depuis la racine.

## Frontend conforme au site validé

La référence client est https://imana-signature.web.app. Les quatre documents
`index.html`, `la-maison.html`, `magazine.html`, `catalogue.html` à la racine et
leurs ressources dans `assets/` constituent la référence visuelle historique.
Le frontend Next.js transpose cette référence dans les composants React/TypeScript
de `apps/frontend-web/src/components/storefront/`. Les routes `/`, `/about`,
`/blog` et `/collections` servent ces composants ; les anciennes URL `.html`
sont réécrites vers les mêmes pages React, en conservant les paramètres de recherche.

`pnpm --filter @imana-signature/frontend-web dev` et `build` synchronisent les
styles et médias de `assets/` vers `apps/frontend-web/public/`, sans les scripts
JavaScript historiques ni les documents HTML. Pour une copie manuelle :
`pnpm --filter @imana-signature/frontend-web sync:storefront`.
Modifier les pages et interactions dans `apps/frontend-web/src/`. Pour les médias
et styles partagés, modifier `assets/` à la racine, puis synchroniser ; ne pas
retoucher leurs copies dans `public/`. Les fichiers HTML racine restent la
référence historique et ne pilotent plus le rendu Next.js.

`pnpm run test:frontend` contrôle le frontend Next.js sur le port 3100 : routes
React et URL historiques, hydratation, styles et médias, navigation, diaporama,
filtres, persistance du panier et états vide/erreur du catalogue sur bureau et mobile.
Le catalogue, la session, les articles et la collecte analytics sont simulés dans cette suite ;
elle ne valide pas la connexion Odoo ni les paiements réels. Le catalogue de
production est chargé depuis `/api/storefront/products`.

Sous PowerShell avec les scripts désactivés, utiliser `pnpm.cmd` au lieu de `pnpm`.

Le serveur HTTP Node est obligatoire : un serveur statique Python ne fournit pas
les API de compte, newsletter et paiement.

## Configuration Stripe

Renseigner dans `.env` :

```dotenv
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
APP_ORIGIN=https://votre-domaine.example
HOST=0.0.0.0
NODE_ENV=production
```

Créer un webhook Stripe pointant vers :

```text
https://votre-domaine.example/api/stripe/webhook
```

Événement requis : `checkout.session.completed`.

Pour les essais locaux, utiliser les clés `sk_test_...` et la commande
`stripe listen --forward-to 127.0.0.1:8080/api/stripe/webhook`.

Les montants et produits envoyés par le navigateur ne sont jamais considérés
comme fiables : le serveur reconstruit chaque ligne depuis son catalogue.

## Données et sécurité

- Comptes et abonnés stockés dans `data/imana.sqlite`
- Mots de passe hachés avec bcrypt, facteur 12
- Sessions aléatoires stockées sous forme d’empreintes SHA-256
- Cookie `HttpOnly`, `SameSite=Strict` et `Secure` en production
- Validation Zod, limitation de débit, CSP et contrôle d’origine
- Confirmation des commandes uniquement par webhook Stripe signé

Sauvegarder régulièrement le dossier `data/`. Pour un déploiement multi-instance,
remplacer SQLite par une base partagée telle que PostgreSQL.

Le serveur écoute par défaut sur `127.0.0.1`. Définir `HOST=0.0.0.0` dans un
conteneur ou une VM, et conserver `APP_ORIGIN` sur l’URL publique HTTPS exacte.

## Images

Les images utilisées par la boutique sont locales, redimensionnées et converties
en WebP dans `assets/images/optimized/`.

Les quatre visuels produits `imana-product-1.webp` à `imana-product-4.webp`
proviennent d’une création originale sans marque tierce, déclinée pour conserver
une famille photographique cohérente.

Pour les régénérer depuis les sources :

```bash
pnpm run images
```

## Tests

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm run test:e2e
```

Les tests E2E (`tests/e2e/storefront-alignment.spec.js`) couvrent Chromium en
bureau et mobile sur le frontend Next.js : routes React et URL historiques,
hydratation, styles et médias, navigation, diaporama, filtres, persistance du
panier et états vide/erreur du catalogue. Le comportement du paiement non
configuré est couvert par `pnpm test` (`tests/unit/api.test.js`).

Installer Chromium pour Playwright sur une nouvelle machine avec :

```bash
npx playwright install chromium
```

## Structure

Le monorepo racine est la source de vérité unique :

- `apps/frontend-web/` : storefront Next.js
- `apps/admin-portal/` : administration Next.js
- `apps/api-gateway/` : API NestJS et intégration Odoo métier
- `packages/` : types, UI et utilitaires partagés
- `services/odoo-compat/` : API FastAPI/Odoo conservée pour compatibilité avec les endpoints historiques
- `services/` : services métier indépendants lorsqu'ils disposent d'une implémentation validée
- `infrastructure/`, `odoo/`, `docs/` : déploiement, addons et documentation
- `tests/` : tests JavaScript storefront/E2E et tests Python de compatibilité

Les services sans implémentation ou tests validés ne sont pas déclarés comme workspaces exécutables.

- `index.html` : accueil éditorial et entrées vers la boutique
- `catalogue.html` : catalogue filtrable et parcours d’achat
- `la-maison.html` : histoire, positionnement et engagements
- `magazine.html` : contenus éditoriaux et guides d’achat
- `server/` : serveur HTTP, API, SQLite, sécurité et Stripe
- `assets/css/styles-preview.css` : direction artistique et responsive communs
- `assets/css/light-theme.css` : déclinaison lumineuse et ergonomique
- `assets/js/script-preview.js` : point d’entrée visuel partagé
- `assets/js/script.js` : catalogue, panier, comptes et interactions
- `assets/js/services/` : API et stockage navigateur
- `assets/images/optimized/` : médias WebP locaux
- `assets/images/branding/imana-logo-light.webp` : logo horizontal officiel
- `scripts/` : pipeline d’optimisation des images
- `tests/unit/` et `tests/e2e/` : tests automatisés

## Administration

Le backend d’administration est exposé sous `/api/admin` et utilise les mêmes
sessions sécurisées que l’espace client, avec contrôle des rôles `admin` et
`manager`. Configurer `ADMIN_EMAIL` et `ADMIN_PASSWORD` au premier démarrage
pour créer le compte administrateur initial.

Les routes couvrent le catalogue, les utilisateurs, les membres, les commandes,
la facturation, les paiements, les livraisons, le stock, les campagnes, les
articles, les FAQ, les publications sociales, le dashboard, le SEO et l’audit.
Voir [`ADMIN_API.md`](ADMIN_API.md) pour le contrat détaillé.
