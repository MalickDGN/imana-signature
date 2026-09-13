# Revue UI et intégration du template `imana-signature.html`

## Verdict

Le template est une référence visuelle solide, mais pas une base de production :
1 359 lignes monolithiques mélangent HTML, CSS, données de démonstration et
JavaScript impératif. L'intégration correcte consiste à transposer son langage
visuel dans Next.js, pas à l'injecter tel quel.

## Forces du template

- Identité claire : marine, ivoire, champagne.
- Hiérarchie éditoriale adaptée au parfum premium.
- Hero immersif et première vue immédiatement identifiable.
- Alternance de sections sombres et claires.
- Catalogue, conseil, lifestyle et contact composent un parcours cohérent.
- Breakpoints à 1100, 980 et 640 px.
- États visuels riches pour panier, wishlist et actions rapides.

## Risques du template brut

- 58 styles inline et deux grands blocs CSS intégrés au document.
- 65 occurrences combinées de gestionnaires inline, ancres factices, boutons
  et attributs d'accessibilité à reprendre.
- Produits, prix, stock, panier et promotions fictifs.
- Images distantes dépendantes d'Unsplash.
- Loader imposé et animations sans `prefers-reduced-motion`.
- Navigation et modales gérées par manipulation directe du DOM.
- Plusieurs liens `#` sans destination réelle.
- Emojis employés comme icônes fonctionnelles.
- Aucune séparation entre contenu, état, présentation et intégration métier.

## Correspondance avec le frontend actif

| Élément template | Intégration Next | État |
|---|---|---|
| Palette et tokens | Tailwind marine/champagne/ivoire | Aligné |
| Logo et navigation sombre | `Header.tsx`, sticky et responsive | Aligné |
| Hero photographique | Image locale optimisée, texte et CTA réels | Aligné |
| Bande signature | Bande responsive sous le hero | Aligné |
| À propos et valeurs | Section accueil + route `/about` | Aligné |
| Catégories olfactives | Visuels locaux + catalogue Odoo | Aligné |
| Produits vedettes | Données Odoo, aucun prix fictif | Aligné |
| Lifestyle | Trois univers visuels locaux | Aligné |
| Diagnostic olfactif | Remplacé par conseil humain `/contact` | Partiel |
| FAQ | Composants natifs `details/summary` | Aligné |
| Contact | Route dédiée et création CRM Odoo | Aligné |
| Panier latéral | Compteur + page panier complète | Partiel |
| Wishlist | Non intégrée, planifiée V1 | Absent assumé |
| Coupons | Non simulés, dépend des règles Odoo | Absent assumé |
| Blog | Univers éditorial présent, moteur de contenu absent | Partiel |
| Footer manifeste | Footer Next enrichi et liens réels | Aligné |

## Choix d'intégration

- Les sept photographies retenues sont stockées dans
  `public/assets/img/imana` pour garantir la prévisualisation locale.
- Les produits et catégories statiques du template ne sont jamais utilisés
  comme vérité métier.
- Les animations ont été réduites et respectent la préférence utilisateur.
- Les CTA pointent vers des routes fonctionnelles.
- La page conserve un aperçu de la section suivante dans le premier viewport.
- Les composants utilisent des dimensions stables et des grilles adaptatives.

## Écarts restants

1. Wishlist et mini-panier latéral : V1.
2. Diagnostic automatique : nécessite règles de recommandation validées.
3. Blog : nécessite modèle éditorial et ownership contenu.
4. Promotions/coupons : nécessite configuration Odoo.
5. Photos définitives : shooting et droits de marque à valider.

Ces éléments ne doivent pas être simulés en production comme ils le sont dans
le template de démonstration.
