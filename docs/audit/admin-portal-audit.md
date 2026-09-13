# Audit complet — `admin-portal` Maison IMANA

Date : 9 septembre 2026  
Périmètre : `apps/admin-portal`, modules administratifs de `apps/api-gateway`, contrats partagés et intégration Odoo.  
Référence UX : [Rizz — Ecommerce Dashboard](https://mannatthemes.com/rizz/default/ecommerce-index.html).

## Verdict

Le portail est bien une application Next.js 15, React 18 et TypeScript strict. Son interface reprend correctement les grands motifs de Rizz (sidebar, topbar, KPI, graphiques, tableaux, états responsive) et les adapte à l’identité IMANA. Le code actif ne contient ni jQuery, ni manipulation DOM impérative, ni page HTML legacy dans `admin-portal`.

Le produit reste toutefois un portail opérationnel partiel. Le catalogue, les imports XLSX/CSV, le CMS et le pilotage opérationnel sont fonctionnels. Les promotions et notifications ne disposent pas encore de modules métier complets. L’ETL reste spécialisé et synchrone : il ne constitue pas encore un moteur de transformation générique distribué.

La faille la plus grave observée était le décalage entre une authentification/RBAC déjà codée dans l’API et un portail qui ne l’utilisait pas. Cette anomalie a été corrigée pendant l’audit.

## Matrice des constats

| ID | Sévérité | Domaine | Fichier / composant | Constat et impact | Action | Statut |
|---|---|---|---|---|---|---|
| ADM-001 | Critique | Sécurité | `page.tsx`, proxy admin, contrôleurs API | Le portail ne demandait aucune connexion et son proxy injectait le secret partagé pour tout visiteur. Toute personne pouvant joindre le portail pouvait appeler les fonctions CMS/ETL. | Cookie HTTP-only, contrôle `/auth/me`, transmission de session et RBAC API. | Corrigé |
| ADM-002 | Critique | ETL | `catalog-import.service.ts`, `partner-import.service.ts` | Les lots résidaient uniquement dans une `Map` mémoire. | Persistance PostgreSQL du payload privé, résultats, expiration et journal d’événements; rechargement à la demande. | Corrigé |
| ADM-003 | Critique | ETL | contrôleurs/services d’import | L’exécution pouvait écrire directement après validation. | État `dry_run`, comparaison en lecture seule des SKU/références Odoo et refus d’exécution avant simulation. | Corrigé |
| ADM-004 | Élevée | ETL | parseurs et interfaces import | Le format source était limité à `.xlsx`. | Ajout CSV UTF-8 sécurisé, détection virgule/point-virgule/tabulation, champs cités et neutralisation des formules. Le `.xls` legacy et le mapping libre restent hors périmètre. | Corrigé pour XLSX/CSV |
| ADM-005 | Élevée | ETL | services d’import | La stratégie était forcée en UPSERT. | Sélection `CREATE_ONLY`/`UPDATE_ONLY`/`UPSERT`, rapprochement par SKU ou référence externe, contrôle lors du dry run et interdiction d’écriture en cas de conflit. Le mapping libre et le versionnement formel des modèles restent des extensions. | Corrigé pour les stratégies |
| ADM-006 | Élevée | Import Security | contrôleurs/parseurs | Taille contrôlée mais contenu insuffisamment identifié. | Contrôle extension, MIME et signature ZIP `PK`; payload ETL privé en PostgreSQL. Scan antivirus externe encore à raccorder. | Corrigé dans l’application |
| ADM-007 | Élevée | CMS | `CmsPanel.tsx`, DTO/service CMS | Auteur, canonical, OG, galerie et workflow étaient incomplets. | Champs et statuts reliés du formulaire à PostgreSQL puis au frontend et à ses métadonnées. | Corrigé |
| ADM-008 | Élevée | CMS | prévisualisation article | La preview se limitait à un iframe local. | Jeton aléatoire 256 bits, stockage SHA-256, expiration 15 minutes, route frontend `noindex`. | Corrigé |
| ADM-009 | Élevée | Dashboard | opérations | CA, commandes, panier moyen, paiements et clients étaient absents. | Agrégat serveur Odoo/portail et panneau avec loading/error/empty/retry. | Corrigé |
| ADM-010 | Élevée | Paiements | opérations | Aucun registre des paiements. | Persistance des créations et confirmations Wave, référence externe et vue admin. Orange reste explicitement non configuré. | Corrigé pour Wave |
| ADM-011 | Élevée | Odoo | opérations | État Odoo déduit indirectement et absence de suivi ETL. | Endpoint protégé regroupant données Odoo, paiements, jobs ETL et état de configuration. | Corrigé |
| ADM-012 | Moyenne | Architecture | composants `src/app/*.tsx` | `AdminDashboard` (566 lignes) et les panneaux CMS/import (381–459 lignes) regroupent présentation, orchestration HTTP et état de formulaire. | Découper par `features/` avec client API, hooks et composants. | Ouvert |
| ADM-013 | Moyenne | TypeScript | `admin-portal/tsconfig.json` | `strict` est hérité, mais `allowJs: true` autorisait une régression JavaScript inutile. | `allowJs` passé à `false`. | Corrigé |
| ADM-014 | Moyenne | Catalogue | `page.tsx` | Le dashboard calculait ses KPI sur les 100 produits de l’aperçu. | Endpoint d’agrégats sur tous les produits Odoo actifs et vendables; l’aperçu reste limité sans tronquer les KPI. | Corrigé |
| ADM-015 | Moyenne | UX | navigation | Tous les modules et liens étaient visibles indépendamment des permissions. | Navigation et panneaux CMS, ETL, opérations et analytics filtrés par les rôles de la session. Les sous-routes et l’état actif par URL restent une évolution d’architecture. | Corrigé pour la visibilité RBAC |
| ADM-016 | Moyenne | UX | styles | Aucun mode clair/sombre utilisable ni préférence persistée. | Tokens sombres, sélection accessible, persistance locale, préférence système initiale et script anti-flash avant hydratation. | Corrigé |
| ADM-017 | Moyenne | Tests | `admin-portal` | Le portail ne disposait d’aucun exécuteur de tests propre. | Vitest configuré dans l’application et matrice de visibilité RBAC couverte. Les parcours navigateur login/CMS/ETL restent à étendre avec Playwright. | Socle corrigé |
| ADM-018 | Moyenne | Auth | `admin-auth.controller.ts` | Login sans limitation de débit ni verrouillage progressif. | Limiteur par compte/adresse client après cinq échecs, blocage initial de 15 minutes puis délai progressif, remise à zéro après succès et journalisation sous empreinte. | Corrigé dans l’application |
| ADM-019 | Moyenne | Audit Trail | CMS/ETL | Les événements ETL et leur acteur n’étaient pas conservés. | `etl_job_events` journalise validation, dry run, exécution, échec et retry avec l’identifiant et l’adresse du compte authentifié; les 50 dernières actions sont visibles dans le pilotage opérationnel. | Corrigé pour le cycle ETL |
| ADM-020 | Faible | Données | Dashboard | Les libellés “Local” et “Imana Admin” étaient statiques. | L’environnement provient de la configuration; le nom, les initiales et le rôle proviennent de la session authentifiée validée par l’API. | Corrigé |

## Conformité technique

- **React/TypeScript : conforme.** Les pages actives sont `.tsx`, utilisent composants et hooks, et la racine impose `strict: true`.
- **Séparation navigateur/Odoo : conforme.** Aucun credential ni RPC Odoo n’est exécuté dans le navigateur. Les écritures passent par NestJS et `OdooService`.
- **Design Rizz : partiellement conforme.** La structure visuelle est crédible et responsive. Les données fictives du template Rizz ne sont pas recopiées, mais plusieurs modules et interactions de la cible n’existent pas.
- **Données dynamiques : partiellement conforme.** Produits, analytics et CMS utilisent des API. Le profil, l’environnement et plusieurs états système sont statiques ou déduits indirectement.
- **Maintenabilité : insuffisante à moyenne.** TypeScript aide, mais la concentration des responsabilités et l’absence de tests frontend augmentent le risque.

## CMS Magazine

Le CMS sait lister et modifier articles, catégories, tags, FAQ et médias. Les contenus HTML sont assainis côté API; la preview locale est confinée dans un iframe sandboxé. La publication alimente bien l’API publique utilisée par `frontend-web`.

Les champs auteur, galerie, image sociale, canonical et indexation sont désormais reliés de bout en bout. Les statuts de revue et d’archivage ainsi que la preview frontend tokenisée sont disponibles. Restent comme améliorations : remplacer le textarea HTML par un éditeur structuré, conserver des révisions et déclencher une invalidation explicite lors d’une publication.

Choix recommandé : TipTap avec document JSON versionné et rendu HTML assaini. Garder le HTML rendu comme projection de publication, pas comme unique source éditoriale.

## ETL et qualité des données

Les imports catalogue et partenaires offrent upload drag-and-drop, sources XLSX ou CSV UTF-8, limite de 10 Mo, validation de colonnes/valeurs, aperçu des erreurs, confirmation avant écriture, import partiel et rapport XLSX. Les variantes et relations simples sont traitées via une couche Odoo contrôlée.

Les lots, payloads privés, résultats et événements sont maintenant persistés et rechargeables. Le dry run Odoo est obligatoire avant l’approbation et applique la stratégie choisie : création seule, mise à jour seule ou upsert. Une relance ciblée ne rejoue que les lignes en échec et conserve les résultats déjà acquis. Le moteur reste spécialisé sur les modèles Maison IMANA : `.xls` legacy, mapping libre, transformations déclaratives, queue distribuée, templates versionnés et compensations constituent la phase d’industrialisation suivante.

## Architecture cible recommandée

```text
admin-portal/features/{dashboard,catalog,orders,payments,magazine,etl,integrations}
  components/     présentation
  hooks/          orchestration et état UI
  services/       client HTTP typé
  schemas/        validation des formulaires/réponses
  types/          contrats du domaine
  tests/          scénarios du domaine

API Gateway
  AdminAccessGuard + RequireRoles
  services métier
  stockage CMS/ETL/audit
  queue de jobs
  OdooService
```

## Plan de traitement

1. **Sécurité immédiate — réalisé :** activer l’auth, cookie sécurisé, session et RBAC sur CMS/ETL/analytics; interdire le JavaScript dans l’application active.
2. **Fiabilisation ETL — socle réalisé :** persistance, journal, dry run, approbation, CSV et reprise ciblée; queue distribuée à raccorder pour les très gros volumes.
3. **CMS éditorial — réalisé pour les champs bloquants :** workflow, SEO, galerie et preview tokenisée; TipTap reste une amélioration d’édition.
4. **Pilotage métier — réalisé :** agrégat Odoo, commandes récentes, paiements Wave, clients, revenus et intégrations.
5. **Architecture frontend :** routes et features par domaine, recherche globale, thème, permissions visibles et états communs.
6. **Qualité :** tests admin unitaires/E2E, tests de permissions, fichiers hostiles, volumétrie et reprise après incident.

## Classement de nettoyage

| Classe | Éléments |
|---|---|
| KEEP | App Router Next.js, design tokens CSS, `OdooService`, parseurs et tests d’import, sanitation CMS, services analytics |
| REFACTOR | `AdminDashboard.tsx`, `CmsPanel.tsx`, panneaux d’import, proxy partagé, chargement dashboard |
| MERGE | Logique quasi identique des imports catalogue/partenaires; autorisations manuelles redondantes avec le guard |
| ARCHIVE | Aucun élément actif à archiver sans analyse complémentaire des prototypes situés hors `admin-portal` |
| DELETE_CANDIDATE | Fichiers générés `vitest.config.js/.mjs/.map/.d.ts` si leur génération est confirmée; `allowJs: true` |

## Validation exécutée

- TypeScript strict `admin-portal` : réussi.
- TypeScript build et tests `api-gateway` : réussi.
- Tests API : 42/42 réussis.
- Build de production `admin-portal` : réussi, routes `/`, `/login`, proxies admin/auth/import générées.
- Inspection statique : absence de jQuery et de scripts DOM directs dans le code actif du portail.

## Limites de l’audit

La conformité des données réelles, des rôles en base, d’Odoo, des paiements et du comportement multi-instance n’a pas pu être vérifiée sans environnement intégré et comptes de test. La comparaison Rizz porte sur la page publique de référence consultée le 9 septembre 2026 et sur le code/CSS local; elle ne constitue pas une validation pixel par pixel sur tous les navigateurs.
