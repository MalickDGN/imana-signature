# IMANA Signature - Plateforme E-Commerce & Lifestyle

[![CI/CD](https://github.com/imana-signature/imana-signature/actions/workflows/ci.yml/badge.svg)](https://github.com/imana-signature/imana-signature/actions/workflows/ci.yml)
[![SonarCloud Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=imana-signature&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=imana-signature)

Ce monorepo contient l'ensemble des applications et services constituant la plateforme digitale de IMANA Signature, une maison de parfums et lifestyle premium.

## 🚀 Architecture

La plateforme repose sur une architecture microservices et headless, orchestrée via un monorepo géré par `pnpm` et `Turborepo`.

- **`apps/`**: Contient les applications front-end et le point d'entrée de l'API.
  - `frontend-web`: Storefront e-commerce Next.js.
  - `admin-portal`: Back-office de gestion (probablement en Next.js ou Vite/React).
  - `api-gateway`: BFF (Backend-For-Frontend) en NestJS, servant de façade à Odoo et aux autres services.
- **`services/`**: Contient les microservices métiers (Paiement, Notifications, etc.).
- **`packages/`**: Contient le code partagé (UI Kit, types, utilitaires).
- **`odoo/`**: Contient les addons Odoo customisés.
- **`infrastructure/`**: Contient la configuration d'infrastructure (Docker, K8s, Terraform).

## 🛠️ Démarrage Rapide

1.  **Prérequis**: `pnpm`, `Docker`
    - Sur Windows, assurez-vous que `make` est installé (ex: `choco install make`) ou exécutez les commandes `pnpm` équivalentes ci-dessous.

2.  **Installer les dépendances** (`pnpm install`):
    ```bash
    make install
    ```
3.  **Configurer l'environnement**: Copiez le fichier `.env.example` en `.env` et remplissez les variables (notamment `POSTGRES_PASSWORD`).
    ```bash
    cp .env.dev .env
    ```
4.  **Lancer l'environnement de développement Docker** (avec hot-reloading):
    Cette commande redémarre proprement l'environnement sans supprimer le cache des dépendances.
    ```bash
    make dev-safe
    ```
    Sous Windows, renseignez `PNPM_STORE_PATH` dans `.env` avec la valeur retournée par
    `pnpm.cmd store path`. Le premier lancement initialise les volumes Node partagés ;
    les lancements suivants réutilisent ce cache.
    - Le site vitrine sera disponible sur `http://localhost:3005` (ou `$FRONTEND_PORT`).
    - Le portail admin sera sur `http://localhost:3006` (ou `$ADMIN_PORT`).
    - L'API Gateway sera sur `http://localhost:4000` (ou `$API_GATEWAY_PORT`).

5.  **Pour arrêter l'environnement** :
    ```bash
    make down
    ```
## 📚 Documentation

La documentation complète du projet (architecture, API, etc.) est disponible dans le dossier `/docs`.

Documents d'alignement principaux :

- `docs/compliance/sfd-alignment.md`
- `docs/audit/template-audit.md`
- `docs/architecture/odoo-integration.md`
- `docs/design/design-system.md`
- `docs/ux/experience-blueprint.md`
- `docs/qa/test-plan.md`

## ✅ Scripts et Qualité

- **`pnpm lint`**: Lance le linter sur tout le projet.
- **`pnpm test`**: Exécute tous les tests.
- **`turbo run typecheck`**: Vérifie les types TypeScript.
