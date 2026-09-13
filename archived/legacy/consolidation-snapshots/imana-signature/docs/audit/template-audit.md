# Audit technique du template legacy

## Périmètre mesuré

| Fichier | Taille | Images | Scripts | Blocs style | Styles inline |
|---|---:|---:|---:|---:|---:|
| `imana-signature.html` | 91 925 o | 21 | 1 | 2 | 58 |
| `parfum-premium.html` | 122 363 o | 24 | 3 | 3 | 174 |
| `parfum-premium_1.html` | 141 776 o | 24 | 4 | 3 | 179 |
| `parfum-premium_2.html` | 141 776 o | 24 | 4 | 3 | 179 |

Les fichiers sont conservés comme références visuelles, pas comme code de
production. L'application active est le storefront Next.js.

## Architecture front-end

### Constats legacy

- Documents monolithiques mêlant structure, présentation et comportement.
- Forte densité de styles inline, empêchant réutilisation et gouvernance.
- Variantes dupliquées presque à l'identique.
- Aucun contrat de données ni composant métier testable.
- Dépendances et comportements chargés au niveau document.

### Remédiation mise en œuvre

- App Router Next.js et composants TypeScript.
- Store panier isolé et contrats partagés.
- API Gateway unique pour toutes les données Odoo.
- Design tokens Tailwind et CSS global minimal.
- Tests unitaires backend et intégration checkout.

## Responsive et UX

- La structure Next utilise des grilles adaptatives et des contraintes de
  largeur plutôt que des dimensions fixes.
- Navigation disponible sur mobile par défilement horizontal.
- Catalogue utilisable avec formulaire GET, même sans JavaScript client.
- Les états vide, indisponible et erreur sont distincts.
- Le tunnel conserve le panier lors d'une erreur.

La validation visuelle automatisée desktop/mobile reste à rejouer sur une
machine autorisant le navigateur de test ; la tentative locale a été bloquée
par une permission Windows hors du projet.

## Accessibilité

Présent :

- structure sémantique, titres et landmarks ;
- lien d'évitement ;
- focus visible ;
- labels explicites ;
- annonces `aria-live` ;
- réduction des animations ;
- boutons désactivés pour les produits indisponibles.

À compléter :

- audit manuel NVDA/VoiceOver ;
- contraste sur les médias définitifs ;
- test à 200 % de zoom ;
- audit axe automatisé sur toutes les routes.

## Performance

Présent :

- rendu serveur ;
- `next/image` ;
- cache catalogue cinq minutes ;
- pages statiques lorsque possible ;
- bundles initiaux storefront autour de 87-103 kB lors du build.

À mesurer sur l'infrastructure cible :

- LCP avec photographies finales ;
- INP sur appareils mobiles réels ;
- CLS lors du chargement Odoo ;
- cache CDN et compression Brotli ;
- budgets par route dans la CI.

## SEO

Présent :

- métadonnées globales et produit ;
- Open Graph ;
- `robots.txt` et sitemap ;
- JSON-LD Product ;
- URLs lisibles pour les pages publiques.

À compléter :

- slugs produits stables ;
- sitemap dynamique de tous les produits ;
- breadcrumbs Schema.org ;
- contenus éditoriaux et données Organization validés.

## Conclusion

Le template legacy n'est pas maintenable comme base applicative. Sa migration
vers Next.js est le bon choix et doit rester irréversible : toute évolution
fonctionnelle doit cibler les composants actifs, jamais les fichiers HTML de
référence.
