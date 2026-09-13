# Design System IMANA Signature

## Direction

Expression premium sobre : marine profond, ivoire lumineux et accent champagne.
La hiérarchie repose sur l'espace, la photographie produit et une typographie
éditoriale mesurée, sans surcharge décorative.

## Tokens

| Usage | Token | Valeur |
|---|---|---|
| Fond principal | `ivoire` | `#F8F4EE` |
| Surface | `blanc` | `#FDFCFA` |
| Texte/action | `marine` | `#0D1B2E` |
| Accent | `champ-dark` | `#A8874E` |
| Bordure | `sable-dark` | `#D8C8A8` |
| Succès | sémantique | vert contrasté |
| Erreur | sémantique | rouge contrasté |

- Titres : Cormorant Garamond ou Georgia.
- Texte et commandes : Inter/Montserrat/system-ui.
- Rayon maximum des composants fonctionnels : 8 px.
- Zone tactile minimale : 44 x 44 px.
- Focus : contour champagne de 2 px avec décalage de 3 px.

## Composants

- Bouton primaire : fond marine, texte ivoire, état désactivé explicite.
- Bouton secondaire : bordure marine, fond transparent.
- Champ : label visible, bordure sable, erreur textuelle et `aria-live`.
- Carte produit : image stable, nom, catégorie, prix et disponibilité.
- Navigation : liens visibles au clavier et défilement horizontal mobile.
- Message système : texte sémantique, jamais fondé sur la couleur seule.

## Photographie

- Produit net, cadrage frontal ou trois-quarts, fond contrôlé.
- Aucune image sombre ou floue empêchant d'inspecter le flacon.
- Formats WebP/AVIF, dimensions sources adaptées aux breakpoints.
- Un texte alternatif décrit le produit, pas son ambiance.

## Mouvement

- Transitions courtes (150-250 ms) sur état et opacité.
- Aucun mouvement indispensable à la compréhension.
- Respect systématique de `prefers-reduced-motion`.

## Critères d'acceptation

- Contraste WCAG AA.
- Zoom texte à 200 % sans perte d'information.
- Navigation complète au clavier.
- Aucun contenu masqué à 320 px ni à 200 % de zoom.
