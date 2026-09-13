# Roadmap finale IMANA Signature

## Objectif

Transformer la plateforme actuelle en une solution e-commerce premium, connectée à Odoo comme source de vérité, avec une expérience UI/UX strictement alignée sur le design défini et une mise en production industrielle.

## Règle de gouvernance

Chaque priorité doit être validée selon 5 critères :
- cohérence visuelle du design
- expérience utilisateur claire et premium
- responsive sur mobile, tablette et desktop
- accessibilité et lisibilité
- conformité à la charte IMANA Signature

Aucune priorité ne doit être considérée comme terminée si le design n’est pas validé.

---

## Priorité 1 — Source de vérité Odoo + catalogue premium

### Objectif
Rendre Odoo la source unique pour les produits, catégories, prix, stock, variantes et disponibilité.

### Sous-tâches
- [x] Cartographier les modèles Odoo requis
- [x] Valider les champs produit, prix, stock, image et catégorie
- [x] Connecter le catalogue backend à Odoo
- [x] Remplacer les données locales ou statiques
- [x] Vérifier les filtres, cards et pages produit
- [x] Mettre en place les états “disponible / épuisé / promo”
- [x] Garantir l’alignement visuel sur le design premium existant

### Critères de validation
- Les produits affichés reflètent les données Odoo réelles
- Le catalogue respecte le design défini
- La disponibilité est calculée avant achat
- Le rendu mobile et desktop est cohérent

---

## Priorité 2 — Panier, checkout et paiement

### Objectif
Rendre le parcours d’achat fluide, premium, sécuritaire et cohérent avec l’UI/UX définie.

### Sous-tâches
- [x] Finaliser le flux panier
- [x] Valider le checkout client et livraison
- [x] Sécuriser le paiement côté serveur
- [x] Vérifier idempotence de la commande
- [x] Confirmer la commande seulement après validation serveur
- [x] Ajouter les états de chargement, erreur et succès
- [x] Vérifier les messages UX et la hiérarchie visuelle

### Critères de validation
- Le parcours est fluide et sans ambiguïté
- Les erreurs sont visibles et compréhensibles
- Le paiement ne dépend pas des données du navigateur
- Le design reste premium à chaque étape

---

## Priorité 3 — Client, commande et statut Odoo

### Objectif
Créer cliente, adresse, commande et statut de commande dans Odoo sans dégrader l’expérience utilisateur.

### Sous-tâches
- [x] Normaliser les données client
- [x] Créer ou associer le partenaire Odoo
- [x] Créer l’ordre et ses lignes depuis le backend
- [x] Gérer l’état de commande (brouillon / validé / livré)
- [x] Aligner les formulaires client et livraison sur le design UX
- [x] Vérifier les messages de confirmation et tracking

### Critères de validation
- Les flux client et commande sont clairs et sécurisés
- Les écrans restent conformes au design défini
- Les états de commande sont visibles et compréhensibles

---

## Priorité 4 — Production, sécurité et hardening

### Objectif
Rendre la plateforme fiable, auditable et prêt à la mise en production sans casser l’experience visuelle.

### Sous-tâches
- [x] Séparer les environnements dev / staging / prod
- [x] Sécuriser les secrets et accès Odoo
- [x] Mettre en place logs et monitoring
- [x] Ajouter retry et circuit breaker
- [x] Vérifier audit trail commandes et paiements
- [x] Contrôler la sécurité HTTP / headers / CSP / rate limiting
- [x] Tester les parcours critiques en responsive et accessibilité

### Critères de validation
- La plateforme reste stable en production
- L’expérience visuelle reste cohérente en environnement réel
- Les alertes et diagnostics sont exploitables

---

## Priorité 5 — QA / UAT / validation UI/UX

### Objectif
Valider la plateforme comme produit premium avant le go-live.

### Sous-tâches
- [x] Tester le parcours catalogue
- [x] Tester le parcours panier / checkout
- [x] Tester le parcours client / compte
- [x] Tester la commande et la confirmation
- [x] Tester les erreurs, retours et cas limites
- [x] Tester mobile, tablet et desktop
- [x] Valider accessibilité et contraste

### Critères de validation
- Le produit est conforme au design déjà défini
- Le parcours utilisateur est fluide, logique et premium
- Les tâches de QA produit et QA design sont validées

---

## Ordre d’exécution recommandé

1. Odoo comme source de vérité
2. Catalogue aligné design
3. Panier / checkout / paiement
4. Commandes / status / client
5. Production / sécurité / observabilité
6. QA / UAT / validation finale

---

## État cible

La plateforme est considérée comme prête au go-live uniquement lorsque :
- Odoo est réellement la source de vérité
- les flux de commande et paiement sont sécurisés
- l’UI/UX est conforme au design défini
- les parcours critiques sont validés en production-like
- la qualité visuelle et l’expérience client sont garanties

### État actuel de validation
- [x] Catalogue et design premium validés
- [x] Panier et checkout sécurisés
- [x] Client et commande validés côté backend
- [x] Production hardening validé
- [x] QA UAT technique validée localement
- [ ] Validation finale Odoo live en attente de crédentials réels et d’une base Odoo Online v19 valide
