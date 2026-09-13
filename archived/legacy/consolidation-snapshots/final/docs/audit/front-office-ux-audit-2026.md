# Audit UX/UI et benchmark Front Office

Date : 2 juillet 2026  
Périmètre : `apps/frontend-web`, templates legacy et exigences SFD/mission UX.

## Synthèse exécutive

Le socle Next.js est techniquement sain : rendu serveur, données Odoo via BFF,
panier persistant, checkout testé, CMS et SEO technique. Avant la refonte, le
langage visuel premium n'était toutefois appliqué qu'à la Home. Le catalogue,
la fiche produit, le panier et le checkout restaient génériques et ne formaient
pas une expérience cohérente.

La refonte 2026 aligne le coeur du parcours :

- navigation responsive, menu Boutique, recherche, wishlist et réassurance ;
- catalogue filtrable avec URL partageable et états explicites ;
- cartes produit, images Odoo, ajout rapide et favoris persistants ;
- fiche produit éditoriale, disponibilité réelle et recommandations ;
- panier et checkout cohérents avec le Design System ;
- page Maison enrichie et Home recentrée sur la proposition de valeur.

## Audit heuristique

| Critère | Avant | Risque | Réponse 2026 |
|---|---|---|---|
| Proposition de valeur | Slogan esthétique, offre peu explicite | Compréhension lente | Marque en H1, promesse et CTA différenciés |
| Navigation | Liens horizontaux défilants | Découvrabilité mobile faible | Menu mobile plein écran et menu Boutique |
| Recherche | Lien vers le catalogue | Intention non captée | Dialogue de recherche accessible |
| Catalogue | 3 filtres en bande | Peu adapté aux grands catalogues | Panneau de filtres, prix, stock, catégories |
| Carte produit | UI générique | Faible désirabilité | Média stable, badge, wishlist, ajout rapide |
| Fiche produit | Image + texte + CTA | Confiance et découverte faibles | Breadcrumb, stock, garanties, conseil, associés |
| Panier | Liste générique | Hiérarchie faible | Quantités accessibles, total fixe, réassurance |
| Checkout | Étapes en badges | Progression et retour peu clairs | Stepper sémantique, retour, formulaires cohérents |
| À propos | Deux paragraphes | ADN de marque absent | Histoire, vision, mission et valeurs |
| Wishlist | Absente | Perte d'intention | Store local persistant et route dédiée |
| Compte client | Absent | Fidélisation limitée | Bloqué par le modèle d'identité à arbitrer |
| Avis/notes | Absents | Preuve sociale limitée | À activer après modèle et modération Odoo |

## Accessibilité

### Conforme dans le prototype

- landmarks, titres ordonnés, fil d'Ariane et lien d'évitement ;
- commandes de 44 px minimum et focus visible ;
- menus avec `aria-expanded`, dialogue de recherche et fermeture `Escape` ;
- boutons wishlist avec `aria-pressed` ;
- quantité panier avec libellés contextualisés ;
- erreurs de formulaires reliées avec `aria-describedby` ;
- progression checkout avec `aria-current="step"` ;
- réduction de mouvement via `prefers-reduced-motion`.

### Recette manuelle requise

- NVDA + Firefox et VoiceOver + Safari ;
- zoom 200 % sur catalogue, panier et checkout ;
- contrastes sur les photographies définitives ;
- parcours complet au clavier et audit axe automatisé.

## Performance et Core Web Vitals

- Hero et média principal utilisent `next/image` avec `priority`.
- Les autres images ont des dimensions stables et des `sizes` responsifs.
- Les données catalogue restent rendues côté serveur.
- Wishlist, panier et navigation interactive sont isolés en composants client.
- Les images Odoo sont servies par une route dédiée avec cache 24 h.
- Le JavaScript métier n'est pas chargé dans les pages éditoriales statiques.

Budgets recommandés :

| Mesure | Cible |
|---|---:|
| LCP mobile p75 | < 2,5 s |
| INP p75 | < 200 ms |
| CLS p75 | < 0,1 |
| JS initial par route | < 130 kB gzip |
| Image hero mobile | < 220 kB |

## Benchmark

### Maison Soluna

Source : <https://maisonsoluna.com/>

Forces adaptables :

- narration par identité et par histoire plutôt que par simple taxonomie ;
- univers olfactifs comme portes d'entrée ;
- preuve locale et ancrage à Dakar ;
- récit des matières, du savoir-faire et de la concentration.

Adaptation IMANA :

- promesse « chaque version de vous » ;
- accès « Trouver ma signature » ;
- pages de collection éditoriales à créer lorsque les attributs Odoo seront
  disponibles.

### Scento

Source : <https://www.scento.com/fr>

Forces adaptables :

- proposition de valeur immédiatement compréhensible ;
- bénéfices d'authenticité, livraison et découverte visibles au premier écran ;
- navigation par envie et collection ;
- réassurance et FAQ proches des points de conversion ;
- mécanique d'adhésion lisible en trois étapes.

Adaptation IMANA :

- bande de réassurance sous le hero ;
- filtres disponibilité/prix et CTA de conseil ;
- futur programme VIP présenté uniquement après définition des règles Odoo.

### Beauty Success

Sources : <https://beautysuccess.co/groupe> et
<https://www.beautysuccess.fr/nos-points-de-vente/paris/824/>

Forces adaptables :

- articulation catalogue, service, conseil et réseau physique ;
- services concrets : carte cadeau, e-réservation, diagnostic, échantillons ;
- profondeur de marque et pages locales ;
- fidélisation par accompagnement, pas seulement par promotion.

Adaptation IMANA :

- conseil humain présent dans le menu, la Home et la fiche produit ;
- future page boutiques et services quand les informations opérationnelles
  seront validées ;
- programme fidélité dépendant du modèle Odoo.

## Gap Analysis

| Fonctionnalité | Couverture | Impact | Priorité | Recommandation |
|---|---|---:|---:|---|
| Home premium | Conforme | Fort | - | Mesurer LCP sur mobile réel |
| Mega menu | Conforme MVP | Fort | - | Alimenter les univers depuis Odoo |
| Recherche | Conforme simple | Fort | Haute | Ajouter autosuggest API |
| Filtres multicritères | Partiel | Fort | Haute | Exposer marque, famille, humeur, occasion |
| Wishlist | Conforme locale | Moyen | Haute | Synchroniser après authentification |
| Fiche immersive | Partiel | Fort | Haute | Ajouter galerie, attributs, notes et vidéos |
| Avis clients | Absent | Fort | Haute | Modèle, modération et preuve d'achat |
| Coupons | Absent | Fort | Haute | Règles de prix Odoo, jamais côté client |
| Compte client | Bloqué | Fort | Critique | Arbitrer Odoo Portal ou IdP |
| Historique commandes | Bloqué | Fort | Critique | Dépend de l'identité |
| Paiement fournisseur | Partiel | Fort | Critique | Contrats Wave/Orange + webhooks |
| Fidélité/VIP | Absent | Moyen | Haute | Définir niveaux, points et source Odoo |
| Comparateur | Absent | Faible | Faible | Tester l'utilité avant développement |
| Recommandations | Partiel | Moyen | Moyenne | Moteur par attributs et comportement |
| Blog/FAQ | Conforme | Moyen | - | Enrichir le calendrier éditorial |
| Tracking | Conforme first-party | Fort | - | Ajouter consentement avant pixels tiers |

## Priorités

1. **Critique** : identité client, paiement réel, idempotence et webhooks.
2. **Haute** : attributs parfum Odoo, avis, coupons, autosuggest, fidélité.
3. **Moyenne** : recommandations avancées, suivi de commande, cartes cadeaux.
4. **Faible** : comparateur, 360° systématique, gamification.

## Décisions

- Les templates HTML restent des références, jamais une source de production.
- Aucune note olfactive, remise, avis ou promesse logistique n'est inventée.
- Le prototype Next.js constitue la maquette Hi-Fi interactive.
- Les capacités bloquées sont documentées plutôt que simulées.
