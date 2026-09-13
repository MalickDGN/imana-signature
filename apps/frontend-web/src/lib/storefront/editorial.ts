export interface Universe {id:string; title:string; description:string; image:{src:string;alt:string}; href:string; itemCount?:number; badge?:string; rotationDirection:string; priority:number; isActive:boolean}
export const universes: Universe[] = [
  {
    "id": "parfums-femme",
    "title": "Parfums Femme",
    "description": "Éclats floraux et signatures sensuelles",
    "image": {
      "src": "/assets/images/optimized/prestige.webp",
      "alt": "Univers des parfums féminins IMANA"
    },
    "href": "/collections?univers=parfums",
    "itemCount": 7,
    "priority": 1,
    "rotationDirection": "left",
    "isActive": true
  },
  {
    "id": "parfums-homme",
    "title": "Parfums Homme",
    "description": "Boisés modernes et sillages affirmés",
    "image": {
      "src": "/assets/images/optimized/heritage.webp",
      "alt": "Univers des parfums masculins IMANA"
    },
    "href": "/collections?univers=parfums&filter=fresh",
    "itemCount": 6,
    "priority": 2,
    "rotationDirection": "right",
    "isActive": true
  },
  {
    "id": "parfums-niche",
    "title": "Parfums de niche",
    "description": "Compositions rares et partis pris singuliers",
    "image": {
      "src": "/assets/images/optimized/product-dark.webp",
      "alt": "Matières premières d'une parfumerie de niche"
    },
    "href": "/collections?univers=parfums&filter=intense",
    "badge": "Exclusivité",
    "priority": 3,
    "rotationDirection": "left",
    "isActive": true
  },
  {
    "id": "coffrets",
    "title": "Coffrets cadeaux",
    "description": "L'art d'offrir, composé avec attention",
    "image": {
      "src": "/assets/images/optimized/imana-product-4.webp",
      "alt": "Coffret cadeau de parfumerie IMANA"
    },
    "href": "/collections?univers=accessoires&filter=coffrets",
    "itemCount": 2,
    "priority": 4,
    "rotationDirection": "right",
    "isActive": true
  },
  {
    "id": "accessoires",
    "title": "Accessoires",
    "description": "Objets parfumés et essentiels nomades",
    "image": {
      "src": "/assets/images/optimized/evasion.webp",
      "alt": "Accessoires et essentiels lifestyle IMANA"
    },
    "href": "/collections?univers=accessoires",
    "itemCount": 4,
    "priority": 5,
    "rotationDirection": "left",
    "isActive": true
  }
];
export const campaigns = [
  {
    "id": "editions-limitees",
    "title": "La rareté, le temps d'une édition.",
    "description": "Des créations exclusives proposées en quantité limitée, jusqu'à épuisement de la sélection.",
    "image": {
      "src": "/assets/images/optimized/campaign-limited-edition.webp",
      "alt": "Édition limitée d'un parfum IMANA"
    },
    "href": "/collections?univers=parfums&filter=collection",
    "badge": "Édition limitée",
    "eyebrow": "Disponible temporairement",
    "ctaLabel": "Découvrir l'édition",
    "startDate": "2026-01-01",
    "endDate": "2026-12-31",
    "priority": 1,
    "isActive": true
  },
  {
    "id": "offres-privees",
    "title": "Des attentions réservées à nos membres.",
    "description": "Accédez à des avantages exclusifs et à des sélections privées imaginées pour nos clients.",
    "image": {
      "src": "/assets/images/optimized/campaign-private-offer.webp",
      "alt": "Sélection d'offres privées IMANA"
    },
    "href": "/collections?univers=parfums&filter=best",
    "badge": "Offre privée",
    "eyebrow": "Espace membres",
    "ctaLabel": "Accéder à l'offre",
    "startDate": "2026-07-01",
    "endDate": "2026-10-31",
    "priority": 2,
    "isActive": true
  }
];
export const approvedArticles = [
  {
    "id": "approved-0",
    "title": "Comment choisir une fragrance signature ?",
    "excerpt": "Un guide éditorial pour accompagner chaque visiteur dans son achat.",
    "categoryName": "guide parfum",
    "coverUrl": "/assets/images/optimized/journal-featured.webp",
    "slug": ""
  },
  {
    "id": "approved-1",
    "title": "Les notes boisées à porter en soirée",
    "excerpt": "Des conseils courts et actionnables pour guider l’exploration.",
    "categoryName": "tendances",
    "coverUrl": "/assets/images/optimized/journal-lasting.webp",
    "slug": ""
  },
  {
    "id": "approved-2",
    "title": "Associer parfum et accessoires",
    "excerpt": "Créer une signature cohérente grâce aux détails.",
    "categoryName": "style",
    "coverUrl": "/assets/images/optimized/heritage.webp",
    "slug": ""
  }
];
