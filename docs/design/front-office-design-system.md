# Design System Front Office

## Principes

1. **Le produit d'abord** : photographie lisible, prix et disponibilité proches.
2. **Éditorial sans théâtralité** : typographie expressive, commandes sobres.
3. **Confiance visible** : origine des données, stock et accompagnement.
4. **Progressive disclosure** : détails au bon moment, pas de surcharge.
5. **Accessibilité native** : HTML sémantique avant ARIA.

## Tokens

| Rôle | Token Tailwind | Valeur |
|---|---|---|
| Texte/action | `marine` | `#0D1B2E` |
| Surface sombre | `marine-2` | `#142338` |
| Fond principal | `ivoire` | `#F8F4EE` |
| Surface produit | `blanc` | `#FDFCFA` |
| Accent | `champ` | `#C8A97E` |
| Accent texte | `champ-dark` | `#A8874E` |
| Séparateur | `sable-dark` | `#D8C8A8` |
| Succès | `emerald-800` | sémantique |
| Erreur | `red-800` | sémantique |

Typographie :

- display : Cormorant Garamond/Georgia ;
- interface : Inter/system-ui ;
- pas de taille pilotée par la largeur du viewport ;
- lettre espacée uniquement pour les libellés uppercase.

Échelle d'espace : 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96 px.

Rayons :

- commandes : 4 px (`rounded-s`) ;
- panneaux fonctionnels : maximum 8 px ;
- formes circulaires réservées aux compteurs et étapes.

## Primitives partagées

Fichier : `packages/ui-kit/src/index.tsx`

| Composant | Rôle | Variantes/états |
|---|---|---|
| `Container` | largeur et gouttières | `className` |
| `Button` | commande | primary, secondary, quiet, danger, disabled |
| `Badge` | statut court | neutral, accent, success, danger |
| `SectionHeading` | hiérarchie éditoriale | normal, inverted, action |
| `Field` | champ accessible | hint, erreur, invalid |
| `EmptyState` | absence de données | icône et action optionnelles |
| `Skeleton` | chargement stable | dimensions par `className` |

## Composants métier

### ProductCard

- **Props** : `product`.
- **Événements** : navigation, wishlist, ajout panier.
- **États** : disponible, stock faible, épuisé, ajouté.
- **Responsive** : image 4:5, 1/2/3/4 colonnes selon contexte.
- **A11y** : CTA nommé, wishlist `aria-pressed`, annonce d'ajout.
- **Animation** : zoom 1,025 et CTA révélé, supprimés en reduced motion.

### Header

- **Responsabilités** : navigation, recherche, accès wishlist/panier.
- **États** : menu boutique, menu mobile, dialogue recherche.
- **A11y** : labels, `aria-expanded`, `aria-modal`, touche Escape.
- **Responsive** : mega menu desktop, navigation plein écran mobile.

### CatalogFilters

- **Événement** : soumission GET.
- **États** : filtres actifs exprimés dans l'URL.
- **Responsive** : panneau latéral desktop, `details` mobile.
- **A11y** : `fieldset`, `legend`, labels visibles.

### Checkout

- **États** : adresse, livraison, paiement, erreur, traitement.
- **A11y** : `aria-current=step`, erreurs reliées, soumission désactivée.
- **Responsive** : résumé sous le formulaire puis sticky sur desktop.

## Photographie

- ratio catalogue 4:5 ;
- image nette, produit inspectable, fond contrôlé ;
- fallback éditorial par univers uniquement en absence d'image Odoo ;
- WebP/AVIF pour les assets locaux ;
- route Odoo mise en cache 24 h.

## Mouvement

- état/hover : 150 à 250 ms ;
- média : maximum 500 ms ;
- aucun carrousel automatique ;
- `prefers-reduced-motion` neutralise les mouvements.

## Critères de recette

- 320 px sans scroll horizontal ;
- zoom 200 % sans perte de commande ;
- focus toujours visible ;
- zone tactile 44 × 44 px ;
- texte et statut jamais exprimés par la couleur seule ;
- contenu dynamique sans changement de layout évitable.
