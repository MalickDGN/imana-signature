# QA / UAT — Go-live IMANA Signature

## Objet

Valider le produit comme solution e-commerce premium, alignée sur le design défini, sécurisée et fiable avant la mise en production réelle.

## Critères de validation

### 1. Catalogue et source de vérité
- Le catalogue est chargé depuis l’API backend
- Les produits affichent le bon design premium
- Les statuts de stock et disponibilité sont cohérents
- Les cards et éléments produit restent conformes à la charte visuelle

### 2. Panier et checkout
- Le panier accepte uniquement des quantités positives
- Le checkout valide les données client et livraison
- Les erreurs sont explicites et non ambiguës
- Le total calculé est correct
- Le parcours reste premium sur mobile et desktop

### 3. Client et commande
- Les clients sont créés ou réutilisés proprement
- Les commandes portent l’état correct
- Le statut de commande est consultable
- L’expérience et les messages sont cohérents avec l’UI/UX

### 4. Production / hardening
- Endpoint de santé disponible
- Headers HTTP de sécurité présents
- Le backend reste stable sans Odoo configuré
- Les erreurs ne cassent pas l’application

## Smoke tests à exécuter

### Local validation
```powershell
cd c:\www\maison-imana
C:/Users/lenovo/AppData/Local/Programs/Python/Python313/python.exe -m pytest -q
```

### Vérifications manuelles
- GET /api/catalog
- GET /api/search?q=parfum
- POST /api/cart/items
- POST /api/checkout
- GET /api/orders/{id}/status
- GET /api/health

## Blocages connus

Le point non validé côté production réelle reste la connexion Odoo live avec les identifiants et la base de données exacts de l’instance Odoo Online v19.

Sans cette validation, le backend est opérationnel et sûr en fallback, mais la synchronisation réelle Odoo n’est pas encore confirmée.

## Validation finale requise

Go-live validé uniquement si :
- Odoo est bien la source de vérité
- les flux critique sont stables en production-like
- l’UX reste conforme au design
- les parcours client, panier et commande sont validés
- les alertes et les diagnostics sont exploitables
