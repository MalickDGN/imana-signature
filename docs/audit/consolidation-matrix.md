# Matrice de consolidation — IMANA Signature

**Date :** 2026-09-13
**Portée :** EPIC-00 / FEAT-00.03 — comparaison entre la référence UX validée (https://imana-signature.web.app, pages `index.html`/`la-maison.html`/`magazine.html`/`catalogue.html`) et l'état actuel de `apps/frontend-web` + `apps/admin-portal`.

Légende : ✅ conforme et dynamique · ⚠️ conforme mais lecture seule / partiel · ❌ absent · 🗄️ legacy archivé (non applicable)

## Storefront (`apps/frontend-web`)

| Fonctionnalité | Référence | État actuel | Détail |
|---|---|---|---|
| Home | index.html | ✅ | `Hero.tsx`, `HomeSections.tsx`, `Diagnostic.tsx`, `CampaignBanner.tsx` — parité structurelle validée par `storefront-alignment.spec.js` |
| La Maison (about) | la-maison.html | ✅ | `MaisonSections.tsx` |
| Magazine | magazine.html | ✅ | `MagazineSections.tsx` |
| Catalogue | catalogue.html | ✅ | `CatalogLayout.tsx`/`ProductGrid.tsx`, filtres/facettes/recherche/tri — données live via `/api/storefront/products` → api-gateway → Odoo (665 produits) |
| PDP (fiche produit) | — | ✅ | `apps/frontend-web/src/app/products/[id]` |
| Recherche | catalogue.html | ✅ | intégrée au catalogue (client-side sur le résultat Odoo) |
| Panier | script.js | ✅ | `useCartStore`, persistance localStorage, recalcul serveur au checkout |
| Checkout — adresse/livraison | script.js | ✅ | `ShippingAddressForm.tsx` |
| Checkout — méthode de livraison | script.js (figé 2 options) | ✅ **dynamisé cette session** | `ShippingMethodForm.tsx` lit `/api/delivery-zones` (table Postgres `delivery_zones`, gérable depuis `/delivery-zones` du portail admin) au lieu d'un tableau en dur |
| Checkout — paiement | script.js (COD/Wave figés) | ✅ **dynamisé cette session** | `PaymentForm.tsx` lit `/api/payment-methods` (table Postgres `payment_methods`) au lieu d'enums figés |
| Confirmation serveur du paiement | server/payments.js | ✅ | `orders.service.ts` : le serveur reconstruit produits/prix/stock, ne fait jamais confiance au navigateur ; webhook Wave signé + idempotent |
| Responsive | styles-preview.css | ✅ | testé desktop + mobile dans `storefront-alignment.spec.js` |
| Animations (hero, mega-menu) | hero-slider.js, mega-menu.js | ✅ | réimplémentées en React, testées |
| Authentification client | script.js + server/app.js | ⚠️ | fonctionnelle mais **legacy** — `server/app.js` (SQLite), pas encore migrée vers `res.partner` Odoo (EPIC-06 non commencé) |
| Newsletter | script.js | ⚠️ | idem — legacy `server/app.js` |
| SEO | balises statiques | ⚠️ | présent au niveau storefront (métadonnées Next.js) ; pas d'outil d'audit SEO dédié côté storefront (voir Admin `/seo` ci-dessous, portée CMS/produits uniquement) |
| Site HTML/JS statique historique | index.html, assets/js/*.js | 🗄️ | décommissionné, archivé dans `archived/frontend/` — entièrement remplacé par `apps/frontend-web` |

## Odoo — couverture des modèles métier (FEAT-03.02)

| Modèle Odoo | Lecture | Écriture | Portage |
|---|---|---|---|
| `product.product` / `product.template` | ✅ | ⚠️ prix + actif uniquement | `ProductsService`, `/products` admin |
| `product.category` | ✅ | ❌ | via `findCategories` |
| `res.partner` (clients) | ✅ | ✅ (création à la commande) | `findPartners`, `findOrCreatePartner`, `/members` admin (lecture) |
| `sale.order` / `sale.order.line` | ✅ | ✅ confirmer/annuler | `/orders` admin, checkout |
| `account.move` (factures) | ✅ | ❌ | `/invoices` admin, lecture seule |
| `stock.picking` (livraisons) | ✅ | ❌ | `/deliveries` admin, lecture seule (pas d'action de validation — risque jugé trop élevé sans test contre une config d'entrepôt réelle) |
| `stock.move` / `stock.quant` | ✅ (stock.move) | ❌ | `/stock` admin — Odoo reste l'unique source d'écriture du stock (cohérent avec §2.1 du prompt maître) |
| `product.pricelist` | ❌ | ❌ | non implémenté — EPIC-05 non commencé |
| `crm.lead` | ✅ écriture seule | ✅ | `ContactsModule` (formulaire de contact) |

## Admin Portal (`apps/admin-portal`)

Voir `docs/audit/admin-portal-audit.md` pour le détail de la revue initiale (bug de connexion admin corrigé) et cette session pour la complétion de couverture :

| Domaine | État |
|---|---|
| CMS (articles, FAQ, catégories, tags, médias) | ✅ CRUD complet |
| Campagnes marketing | ✅ CRUD complet (édition/suppression ajoutées cette session) |
| Commandes | ✅ liste + confirmer/annuler (nouveau) |
| Transactions | ✅ lecture (nouveau) |
| Factures | ⚠️ lecture seule (nouveau) |
| Livraisons | ⚠️ lecture seule (nouveau) |
| Mouvements de stock | ⚠️ lecture seule (nouveau) |
| Membres/clients | ⚠️ lecture seule (nouveau) |
| Moyens de paiement | ✅ CRUD, branché sur le checkout réel (nouveau) |
| Zones de livraison | ✅ CRUD, branché sur le checkout réel (nouveau) |
| Produits | ⚠️ édition prix uniquement (nouveau) — création via import Excel existant |
| Utilisateurs admin | ✅ CRUD (nouveau) — auparavant impossible de créer un 2ᵉ compte |
| Journal d'audit | ✅ (nouveau) — couvre les nouveaux modules, pas rétrofité sur CMS/Analytics existants |
| SEO | ⚠️ diagnostic articles/produits (nouveau) |
| Intégrations | ⚠️ statut live Odoo/Wave/Postgres (nouveau, remplace une liste codée en dur) |
| Publications sociales | ⚠️ CRUD + action publier (webhook `SOCIAL_PUBLISH_WEBHOOK_URL` non configuré dans cet environnement) |
| Import Excel/CSV (ETL fichiers) | ✅ existant (`CatalogImportPanel`, `PartnerImportPanel`) |
| ETL depuis une base Odoo source | ❌ | non implémenté (FEAT-10.07) |
| Assistant IA de migration | ❌ | non implémenté (FEAT-10.08) |

## Paiements (EPIC-08)

| Provider | État |
|---|---|
| Wave | ✅ opérationnel — checkout, webhook signé HMAC, idempotent, réconciliation `payment_transactions` |
| Orange Money | ❌ non implémenté côté `api-gateway` (rejeté explicitement comme non configuré) — logique partielle existe dans le `server/payments.js` legacy uniquement |
| Espèces à la livraison (COD) | ✅ |

## Documents & WhatsApp (EPIC-11)

❌ Non implémenté. Aucun service de documents (streaming/signed URLs), aucune notification WhatsApp. Nécessite des credentials externes (WhatsApp Business API) non fournis.

## Sécurité / Observabilité (EPIC-12)

| Élément | État |
|---|---|
| Secrets serveur uniquement | ✅ (`.env`, jamais exposés au frontend) |
| RBAC admin | ✅ rôles granulaires (`ADMIN_ROLES`, `ROLE_SETS`) |
| Audit trail | ⚠️ partiel (nouveaux modules admin uniquement, pas d'événements `ORDER_CREATED`/`PAYMENT_CONFIRMED`/etc. au sens FEAT-12.03) |
| Observabilité distribuée (request ID, traces, métriques) | ❌ non implémenté |
| Vulnérabilités dépendances | ✅ critiques corrigées cette session (voir `baseline.md`) |

## Verdict global (critères §19 du prompt maître)

Satisfaits : 1, 3, 4 (partiellement — auth client encore legacy), 5, 6, 7, 8 (partiel), 10, 12 (Wave), 24, 25 (partiel).
Non satisfaits / non commencés : 2 (consolidation legacy auth client), 8 (Orange Money), 11, 13, 15–21 (WhatsApp, ETL Odoo source, IA migration), 22–23 (audit trail complet, observabilité), 26–30 (gouvernance Git, releases, sécurité globale, doc technique complète).
