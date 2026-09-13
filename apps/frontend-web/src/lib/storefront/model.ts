import type { Product } from '@imana-signature/shared-types';

export interface StorefrontProduct extends Product {
  family: string;
  gender: string;
  brand: string;
  collection: string;
  badge: string;
  notes: string;
  format?: number;
  accessoryType: string;
  seasons: string[];
  occasions: string[];
}

export const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export const money = (value: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(value);
export const imageUrl = (value?: string) => {
  if (!value) return '/assets/images/optimized/hero.webp';
  if (/^assets\//.test(value)) return `/${value}`;
  if (/^\/(?!\/)|^https?:\/\//.test(value)) return value;
  return '/assets/images/optimized/hero.webp';
};

export function parseProducts(payload: unknown): StorefrontProduct[] {
  if (!Array.isArray(payload)) throw new Error('Le catalogue reçu est invalide.');
  return payload.map((entry: unknown) => {
    if (!entry || typeof entry !== 'object') throw new Error('Produit invalide.');
    const p = entry as Record<string, unknown>;
    if ((typeof p.id !== 'string' && typeof p.id !== 'number') || typeof p.name !== 'string' || typeof p.price !== 'number' || !Number.isFinite(p.price) || p.price < 0) throw new Error('Produit invalide.');
    const text = (key: string) => typeof p[key] === 'string' ? p[key] as string : '';
    const list = (key: string) => Array.isArray(p[key]) ? (p[key] as unknown[]).filter((v): v is string => typeof v === 'string') : [];
    return {
      id: String(p.id), name: p.name, price: p.price,
      description: text('description'), imageUrl: imageUrl(text('imageUrl') || text('image')),
      stock: typeof p.stock === 'number' && Number.isFinite(p.stock) ? Math.max(0, p.stock) : undefined,
      category: text('category'), categoryId: text('categoryId'), family: text('family') || text('category'),
      gender: text('gender'), brand: text('brand'), collection: text('collection'), badge: text('badge'),
      notes: text('notes') || text('description'), format: typeof p.format === 'number' ? p.format : undefined,
      accessoryType: text('accessoryType'), seasons: list('seasons'), occasions: list('occasions'),
    };
  });
}

export type Facet = 'gender' | 'family' | 'brand' | 'collection' | 'price' | 'season' | 'occasion';
export type Facets = Record<Facet, string[]>;
export const emptyFacets = (): Facets => ({ gender: [], family: [], brand: [], collection: [], price: [], season: [], occasion: [] });
export const labels: Record<string, string> = {
  homme: 'Homme', femme: 'Femme', enfant: 'Enfant', imana: 'IMANA Signature', dior: 'Dior', chanel: 'Chanel', 'tom-ford': 'Tom Ford', xerjoff: 'Xerjoff', initio: 'Initio', mfk: 'Maison Francis Kurkdjian',
  floral: 'Floral', frais: 'Frais', boise: 'Boisé', oriental: 'Oriental', heritage: 'Héritage', prestige: 'Prestige', evasion: 'Évasion', edition: 'Édition limitée',
  'under-50': 'Moins de 50 000 FCFA', '50-70': '50 000–70 000 FCFA', 'over-70': 'Plus de 70 000 FCFA', printemps: 'Printemps', ete: 'Été', automne: 'Automne', hiver: 'Hiver', quotidien: 'Quotidien', bureau: 'Bureau', soiree: 'Soirée', voyage: 'Voyage', speciale: 'Occasion spéciale',
};
export function matchesFilter(p: StorefrontProduct, filter: string): boolean {
  const accessory = normalize(p.category || '').includes('accessoir');
  switch (filter) {
    case 'all': return true;
    case 'accessoires': return accessory;
    case 'women': return !accessory && p.gender === 'femme';
    case 'men': return !accessory && p.gender === 'homme';
    case 'children': return !accessory && p.gender === 'enfant';
    case 'niche': return !accessory && ['prestige', 'edition limitee'].includes(normalize(p.collection));
    case 'coffrets': case 'voyage': case 'maison': return accessory && p.accessoryType === filter;
    case 'best': return p.badge === 'Best-seller';
    case 'floral': return p.category === 'floral';
    case 'fresh': return ['frais', 'boise'].includes(p.category || '');
    case 'intense': return p.category === 'oriental';
    default: return !accessory;
  }
}
export function filterProducts(products: StorefrontProduct[], filter: string, query: string, facets: Facets, sort: string) {
  const result = products.filter(p => matchesFilter(p, filter) && normalize(`${p.name} ${p.family} ${p.notes} ${p.brand}`).includes(normalize(query)) && (Object.entries(facets) as [Facet, string[]][]).every(([key, values]) => !values.length || values.some(value => {
    if (key === 'price') return value === 'under-50' ? p.price < 50000 : value === '50-70' ? p.price >= 50000 && p.price <= 70000 : p.price > 70000;
    if (key === 'collection') return normalize(p.collection).includes(value);
    if (key === 'family') return p.category === value;
    if (key === 'season') return p.seasons.includes(value);
    if (key === 'occasion') return p.occasions.includes(value);
    return p[key] === value;
  })));
  if (sort === 'price-asc') result.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') result.sort((a, b) => b.price - a.price);
  if (sort === 'name') result.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  return result;
}
