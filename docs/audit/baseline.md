# Baseline technique — IMANA Signature

**Date :** 2026-09-13
**Établie par :** Agent CTO (session Claude Code)
**Portée :** EPIC-00 / FEAT-00.02 — état de santé initial du monorepo `maison-imana`

## 1. Installation

`pnpm install` — OK, 1553 packages résolus, 0 erreur.

## 2. Qualité statique

| Commande | Résultat |
|---|---|
| `pnpm lint` (turbo, 6 workspaces) | ✅ vert |
| `pnpm typecheck` (turbo, 6 workspaces) | ✅ vert |
| `pnpm build` (turbo, 6 workspaces, production) | ✅ vert |

Workspaces couverts : `frontend-web`, `admin-portal`, `api-gateway`, `shared-types`, `ui-kit`, `utils`. `mobile-app` n'a pas de script lint/typecheck/build actif (non déclaré comme workspace exécutable, cf. README).

## 3. Tests automatisés

| Suite | Résultat |
|---|---|
| `tests/unit/*.test.js` (Node test runner, legacy `server/`) | ✅ 10/10 |
| `apps/api-gateway` (vitest) | ✅ 51/51 |
| `apps/frontend-web` (vitest) | ✅ 5/5 |
| `apps/admin-portal` (vitest) | ✅ 3/3 |
| `tests/e2e/storefront-alignment.spec.js` (Playwright, chromium + mobile) | ✅ 26/26 |

**Total : 95 tests verts, 0 échec.**

Suite legacy `tests/e2e/storefront.spec.js` (testait le site HTML/JS statique) archivée dans `archived/frontend/legacy-tests/` — sa couverture structurelle est reprise par `storefront-alignment.spec.js` ; la garde Stripe/checkout qu'elle testait a été portée dans `tests/unit/api.test.js`.

## 4. Vulnérabilités de dépendances (`pnpm audit --prod`)

| État | Critique | Élevée | Modérée | Faible | Total |
|---|---|---|---|---|---|
| Avant correctifs (2026-09-13, 1ʳᵉ passe) | 2 | 32 | 15 | 5 | 54 |
| Après correctif Next.js/Multer | 0 | 24 | 14 | 4 | 42 |
| **Après nettoyage complet (même session)** | **0** | **1*** | **1*** | **0*** | **~11*** |

\* Hors périmètre déployé — voir ci-dessous.

Correctifs appliqués (bump ciblé + `pnpm.overrides` racine, tous vérifiés par `pnpm typecheck && pnpm lint && pnpm test && pnpm build` verts après chaque lot) :

| Paquet | Avant | Après | Consommateur en production |
|---|---|---|---|
| `next` | 15.5.21 | ≥15.5.25 | `frontend-web`, `admin-portal` — RCE critique (Windows + AVIF) |
| `multer` | 2.0.2 | ≥2.3.0 | `api-gateway` (upload CMS/catalog-import) — 3 CVE DoS |
| `postcss` | 8.4.31 / 8.5.16 | ≥8.5.18 | `next` (2 apps) + `sanitize-html` (api-gateway) — lecture fichier arbitraire, XSS |
| `lodash` | 4.17.21 | ≥4.18.0 | `@nestjs/config` (api-gateway) — pollution de prototype |
| `nanoid` | <3.3.18 | ≥3.3.18 | chaîne postcss/sanitize-html — boucle infinie |
| `uuid` | 8.3.2 | ≥11.1.1 | `exceljs` (api-gateway, exports Excel) — dépassement de tampon |
| `body-parser` | 1.20.4 | ≥1.20.6 | `@nestjs/platform-express` (api-gateway) — DoS |
| `browserslist` | ≤4.28.6 | ≥4.28.7 | `next` (2 apps) — croissance mémoire non bornée |
| `brace-expansion` | 1.x/2.x anciens | 1.x ≥1.1.18, 2.x ≥2.1.4 (override par plage majeure) | `exceljs > archiver` (api-gateway) — DoS |
| `file-type` | 20.4.1 | ≥21.3.2 | `@nestjs/common` (api-gateway) — boucle infinie, zip bomb |

**Accepté / reporté :**
- **`@nestjs/core` (modéré, injection)** — patch exige NestJS 11.x (actuellement 10.4.22) : migration majeure du framework touchant tous les contrôleurs/guards/modules. Trop risqué pour un correctif de dépendance ponctuel — à traiter comme une Feature dédiée (`feature/nestjs-11-upgrade`) avec sa propre suite de vérification.
- **~11 findings restants (`fast-xml-parser`, `image-size`, `ip`, `joi`, `js-yaml`, `semver`, `send`)** — confirmés (via les chemins de dépendance de l'audit) comme exclusivement issus de `apps/mobile-app` (`expo` / `@react-native-community/cli`). Ce workspace n'est ni buildé, ni testé, ni déployé (absent des scripts `turbo run lint/typecheck/test/build`) : aucune exposition runtime. Non traités pour éviter de forcer des montées de version majeures non testables sur toute la chaîne React Native — à revisiter si `mobile-app` est un jour activé.

## 5. Connectivité Odoo Online

- URL : `https://edu-mdgnsignature.odoo.com`, base `edu-mdgnsignature`, endpoint `/jsonrpc`.
- Identifiants validés via `scripts/check_odoo_connection.py` — `uid=5`.
- **Bug corrigé pendant l'audit** : `OdooService` (odoo-await) utilisait par défaut le port XML-RPC 8069 (valide pour un Odoo auto-hébergé, mais fermé sur Odoo Online SaaS qui n'expose que le port 443). Le port est désormais dérivé de l'URL (443 en HTTPS sans port explicite, sinon la valeur explicite ou 8069 par défaut). Voir `apps/api-gateway/src/integrations/odoo/odoo.service.ts`.
- Catalogue actuel : **665 produits actifs, 0 unité en stock sur l'ensemble du catalogue** (données de test Odoo Online — aucune commande ne peut aboutir tant qu'aucun stock n'est saisi dans Odoo).

## 6. Environnements locaux (dev)

| Service | Port | Rôle |
|---|---|---|
| `apps/frontend-web` (Next.js) | 3000 | Storefront, source de vérité UX |
| `apps/api-gateway` (NestJS) | 3001 | BFF — Odoo, Postgres, paiements |
| `apps/admin-portal` (Next.js) | 3002 | Portail admin |
| `server/app.js` (legacy Express) | 8080 | Auth compte client / newsletter (non migré, cf. §8) |
| PostgreSQL (Docker) | 5432 | `portal_users`, CMS, analytics, transactions, audit_logs, payment_methods, delivery_zones, social_publications |

`docker-compose.dev.yml` démarre un conteneur Odoo **local** — à ne pas utiliser pour le développement contre la base de test Online (utiliser le lancement natif `pnpm --filter <app> dev`, qui charge `.env`/`apps/api-gateway/.env` pointant vers Odoo Online).

## 7. Git / CI

- Remote : `https://github.com/MalickDGN/imana-signature.git`, `gh` authentifié.
- **Aucune protection de branche confirmée**, un seul commit existant (`604ff0c Initial IMANA Signature platform`) — tout le travail de cette session est non commité sur `main`. Le workflow `feature/* → PR → main` prescrit en §15 du prompt maître n'est pas encore en vigueur ; à mettre en place avant la prochaine Feature si le client valide la gouvernance Git souhaitée.
- `.github/workflows/ci.yml` existe (contenu non audité en détail dans cette passe).
- Pas de SonarCloud connecté.

## 8. Écart architectural connu (non bloquant)

Deux systèmes coexistent pour l'authentification client / newsletter :
- `apps/api-gateway` (nouveau, Postgres) — gère l'auth admin (`portal_users`) et les commandes (Odoo).
- `server/app.js` (legacy, SQLite) — gère encore `/api/auth/*` (comptes clients) et `/api/newsletter`, via les rewrites `next.config.js`.

Le site statique HTML/JS legacy (`index.html`, `la-maison.html`, etc.) a été décommissionné (archivé dans `archived/frontend/`) car entièrement remplacé par `apps/frontend-web`. Le serveur `server/app.js` reste nécessaire pour l'auth client et `/admin` (back-office SQLite legacy, non migré — cf. `docs/audit/admin-portal-audit.md` pour le détail des écarts de couverture).

## 9. Recommandation

Baseline saine pour démarrer les Features suivantes. Points à trancher avec le client avant EPIC-01+ :
1. Gouvernance Git (branch protection, revue obligatoire) — actuellement absente.
2. Migration ou conservation du compte client legacy (`server/app.js`) vers `res.partner` Odoo (EPIC-06).
3. Priorisation des EPICs restants (08 Mobile Money, 09 Workflow Odoo, 11 Documents/WhatsApp, 12 Sécurité/Observabilité, 13 QA/DevSecOps) — non commencés, nécessitent des credentials externes non disponibles dans cet environnement (Orange Money marchand, WhatsApp Business API, secret manager cloud).
