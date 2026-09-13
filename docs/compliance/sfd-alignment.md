# Alignement SFD - IMANA Signature

## Référentiel

Ce document trace les exigences de `docs/specifications/sfd-imama-signature.txt`
et de `ROADMAP_FINAL.md` vers l'implémentation.
Le SFD fourni est une mission d'audit et une cible produit, pas le CDC détaillé
qu'il mentionne. Les règles métier absentes du dépôt ne sont donc pas inventées.

## État exécutif

- Le socle MVP permet de consulter le catalogue Odoo, rechercher, filtrer par
  catégorie, gérer un panier persistant et créer une commande après contrôle du
  stock.
- Le BFF NestJS reste l'unique point d'accès à Odoo.
- Le checkout couvre livraison, paiement à la livraison et création d'une
  commande Mobile Money en attente.
- SEO technique de base, navigation clavier, réduction des animations,
  formulaires accessibles et pages institutionnelles sont présents.
- L'authentification client, un vrai fournisseur de paiement, les webhooks et
  l'historique de commandes nécessitent le CDC détaillé et les accès externes.

## Matrice de conformité

| Domaine | Exigence | État | Impact / preuve | Priorité / sortie |
|---|---|---:|---|---|
| Vitrine | Accueil premium | Partiel | Accueil responsive et marque visible, photographie produit dédiée absente | Haute : shooting ou assets validés |
| Vitrine | À propos | Conforme | Route `/about`, métadonnées dédiées | - |
| Vitrine | Contact | Conforme | Formulaire accessible vers `crm.lead` Odoo | - |
| Catalogue | Produits Odoo | Conforme | `GET /api/products` via BFF | - |
| Catalogue | Catégories | Conforme | `GET /api/products/categories`, route `/categories` | - |
| Catalogue | Recherche simple | Conforme | Recherche Odoo `ilike` | - |
| Catalogue | Filtres et tri | Partiel | Catégorie et prix/nom ; variantes, marque et notes absentes | V1.5 |
| Catalogue | Variantes | Absent | Aucun modèle d'attribut/variante exposé | Haute : mapping Odoo à préciser |
| Catalogue | Stock | Conforme MVP | Stock affiché et revalidé avant commande | Ajouter réservation/idempotence |
| Produit | Fiche produit | Conforme MVP | Métadonnées, JSON-LD, disponibilité et panier | Enrichir médias/variantes |
| Produit | Produits associés | Absent | Pas de mapping Odoo cross-sell | V1.5 |
| Panier | Panier persistant | Conforme | Zustand persist/localStorage | - |
| Panier | Mini-panier | Partiel | Compteur présent, panneau rapide absent | V1 |
| Panier | Coupon/promotion | Absent | Règles Odoo non exposées | V1 |
| Checkout | Adresse/livraison | Conforme MVP | Validation client et serveur, produit livraison Odoo | - |
| Checkout | Contrôle prix | Conforme | Seuls ID/quantités sont acceptés ; prix calculés par Odoo | - |
| Checkout | Contrôle stock | Conforme MVP | Validation temps réel avant création | Ajouter verrou/réservation |
| Paiement | Paiement à la livraison | Conforme MVP | Commande confirmée dans Odoo | Workflow livraison à préciser |
| Paiement | Wave/Orange Money | Partiel | Statut `pending_payment`, aucun appel fournisseur/webhook | Critique : contrats et clés |
| Paiement | Carte/Stripe/PayPal | Bloqué | Aucun compte fournisseur ni règles de remboursement | V1 après arbitrage |
| Client | Authentification | Bloqué | Modèle d'identité et politique de compte non définis | Critique MVP |
| Client | Tableau de bord/historique | Bloqué | Dépend de l'identité client et des droits Odoo | Critique MVP |
| Client | Factures/retours/adresses | Absent | Contrats métier manquants | V1 |
| Client | Wishlist | Absent | Planifiée V1 par la roadmap | V1 |
| Marketing | Avis/blog/newsletter | Absent | Planifiés V1 | V1 |
| Marketing | Analytics/GTM/Meta | Bloqué | IDs, consentement et politique cookies absents | V1 |
| Relation | CRM | Conforme MVP | Formulaire contact vers Odoo CRM | - |
| Relation | WhatsApp/chat/FAQ | Absent | Fournisseurs et contenus absents | V1.5 |
| Admin | Accès Odoo et santé API | Conforme MVP minimal | Portail admin opératoire minimal | - |
| Admin | Dashboard commandes | Partiel | Pilotage renvoyé vers Odoo | Haute |
| SEO | Métadonnées/Open Graph | Conforme base | Globales et produit dynamiques | Audit contenu à prévoir |
| SEO | Sitemap/robots | Conforme base | Routes Next natives | Ajouter produits au sitemap |
| SEO | Données structurées | Conforme base | Schema.org Product | Ajouter Organization/Breadcrumb |
| WCAG | Clavier/focus/skip link | Conforme base | Focus visible, lien d'évitement | Audit manuel requis |
| WCAG | Formulaires | Conforme base | Labels, erreurs et `aria-live` | Audit lecteur d'écran requis |
| Performance | Images/SSR/cache | Conforme base | `next/image`, SSR, revalidation 5 min | Mesurer CWV en production |
| Sécurité | Validation API | Conforme base | whitelist, DTO, propriétés interdites | Ajouter rate limit et auth |
| Sécurité | Secrets | Conforme base | `.env` ignoré, exemple sans secret réel | Secret manager en production |
| Qualité | Tests automatisés | Conforme base | Unitaires commandes/Odoo, intégration checkout | Ajouter Playwright E2E |
| DevOps | CI build/test/typecheck | Conforme | GitHub Actions | Ajouter SAST et déploiement |
| Mobile | Application Expo | Absent | Package manifeste uniquement | V2 |

## Blocages de conformité totale

1. Le CDC détaillé annoncé dans le SFD n'est pas présent.
2. Aucun contrat fournisseur ni identifiant Wave, Orange Money, Stripe ou
   PayPal n'est fourni.
3. Le modèle d'identité client (Odoo Portal, IdP externe, exigences MFA,
   récupération de compte) n'est pas arbitré.
4. Les textes légaux définitifs, la politique de conservation et les données
   d'entreprise sont absents.
5. Les maquettes Figma, photographies produit et charte de marque validée ne
   sont pas disponibles dans le dépôt.

Ces éléments sont des entrées projet obligatoires, pas des détails que le code
peut déterminer seul.
