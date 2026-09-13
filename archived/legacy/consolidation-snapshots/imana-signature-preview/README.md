# IMANA SIGNATURE

Boutique de parfumerie en HTML, CSS et JavaScript natif, avec backend Node.js,
comptes clients, newsletter persistée et paiement Stripe Checkout.

## Prérequis

- Node.js 22.5 ou supérieur
- Un compte Stripe pour activer le paiement

## Installation

```bash
npm install
copy .env.example .env
npm start
```

Ouvrir ensuite `http://127.0.0.1:8080`.

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
npm run images
```

## Tests

```bash
npm test
npm run test:e2e
npm run test:all
```

Les tests E2E couvrent Chromium en bureau et mobile : catalogue, panier,
création de compte, restauration de session, déconnexion, newsletter et
comportement du paiement non configuré.

Installer Chromium pour Playwright sur une nouvelle machine avec :

```bash
npx playwright install chromium
```

## Structure

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
