import type {
  Product,
  ProductCategory,
  ProductSort,
} from '@imana-signature/shared-types';
import { Container, EmptyState } from '@imana-signature/ui-kit';
import { SearchX, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { ProductCard } from '@/components/ProductCard';
import { getProductCategories, getProducts } from '@/lib/api/products';

export const dynamic = 'force-dynamic';

interface CollectionsPageProps {
  searchParams: {
    search?: string;
    category?: string;
    sort?: ProductSort;
    availability?: string;
    minPrice?: string;
    maxPrice?: string;
  };
}

export default async function CollectionsPage({
  searchParams,
}: CollectionsPageProps) {
  let products: Product[] = [];
  let categories: ProductCategory[] = [];
  let unavailable = false;

  try {
    [products, categories] = await Promise.all([
      getProducts({
        search: searchParams.search,
        category: searchParams.category,
        sort: searchParams.sort,
      }),
      getProductCategories(),
    ]);
    products = applyLocalFilters(products, searchParams);
  } catch (error) {
    unavailable = true;
    console.error('Unable to load catalog:', error);
  }

  return (
    <div className="min-h-screen bg-ivoire pb-20">
      <div className="border-b border-sable-dark bg-blanc">
        <Container className="py-12 sm:py-16">
          <p className="text-xs font-bold uppercase text-champ-dark">
            Boutique en ligne
          </p>
          <div className="mt-2 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="font-disp text-5xl font-semibold leading-none text-marine sm:text-6xl">
                Trouvez votre signature
              </h1>
              <p className="mt-4 max-w-2xl leading-7 text-dk-2">
                Explorez une sélection de fragrances de créateurs et de niche,
                synchronisée avec notre stock réel.
              </p>
            </div>
            <Link
              href="/contact"
              className="inline-flex min-h-11 w-fit items-center border-b border-champ-dark text-sm font-semibold text-champ-dark"
            >
              Besoin d’un conseil personnalisé ?
            </Link>
          </div>
        </Container>
      </div>

      <Container className="pt-8">
        <div className="flex gap-3 overflow-x-auto pb-5">
          <CategoryChip
            href="/collections"
            label="Tous"
            selected={!searchParams.category}
          />
          {categories.map((category) => (
            <CategoryChip
              key={category.id}
              href={`/collections?category=${category.id}`}
              label={category.name}
              selected={searchParams.category === category.id}
            />
          ))}
        </div>

        <details className="mb-6 border-y border-sable-dark py-3 lg:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 font-semibold text-marine">
            <SlidersHorizontal size={18} /> Filtrer et trier
          </summary>
          <CatalogFilters
            categories={categories}
            searchParams={searchParams}
            className="pt-4"
          />
        </details>

        <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="hidden lg:block">
            <div className="sticky top-28 border-t border-sable-dark pt-5">
              <CatalogFilters
                categories={categories}
                searchParams={searchParams}
              />
            </div>
          </aside>

          <section aria-labelledby="catalog-results">
            <div className="mb-6 flex items-center justify-between border-b border-sable-dark pb-4">
              <h2 id="catalog-results" className="font-disp text-2xl text-marine">
                {searchParams.search
                  ? `Résultats pour « ${searchParams.search} »`
                  : 'Toutes les fragrances'}
              </h2>
              {!unavailable && (
                <p className="text-sm text-dk-2">
                  {products.length} produit{products.length > 1 ? 's' : ''}
                </p>
              )}
            </div>

            {unavailable ? (
              <EmptyState
                title="La boutique se reconnecte"
                description="Le catalogue est momentanément indisponible. Vos favoris et votre panier restent conservés."
                action={
                  <Link
                    href="/collections"
                    className="inline-flex min-h-11 items-center bg-marine px-6 text-sm font-semibold text-ivoire"
                  >
                    Réessayer
                  </Link>
                }
              />
            ) : products.length ? (
              <div className="grid gap-x-5 gap-y-11 sm:grid-cols-2 xl:grid-cols-3">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<SearchX size={22} />}
                title="Aucune fragrance trouvée"
                description="Élargissez la fourchette de prix ou retirez un filtre pour découvrir davantage de créations."
                action={
                  <Link
                    href="/collections"
                    className="inline-flex min-h-11 items-center border border-marine px-6 text-sm font-semibold text-marine"
                  >
                    Effacer les filtres
                  </Link>
                }
              />
            )}
          </section>
        </div>
      </Container>
    </div>
  );
}

function CatalogFilters({
  categories,
  searchParams,
  className = '',
}: {
  categories: ProductCategory[];
  searchParams: CollectionsPageProps['searchParams'];
  className?: string;
}) {
  return (
    <form action="/collections" role="search" className={`grid gap-6 ${className}`}>
      <label className="grid gap-2 text-sm font-semibold text-marine">
        Rechercher
        <input
          name="search"
          type="search"
          defaultValue={searchParams.search}
          placeholder="Nom du parfum"
          className="min-h-11 w-full border border-sable-dark bg-blanc px-3 font-normal outline-none focus:border-champ-dark"
        />
      </label>
      <label className="grid gap-2 text-sm font-semibold text-marine">
        Catégorie
        <select
          name="category"
          defaultValue={searchParams.category ?? ''}
          className="min-h-11 w-full border border-sable-dark bg-blanc px-3 font-normal"
        >
          <option value="">Toutes</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>
      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold text-marine">Disponibilité</legend>
        <label className="flex min-h-8 items-center gap-3 text-sm text-dk-2">
          <input
            type="radio"
            name="availability"
            value=""
            defaultChecked={!searchParams.availability}
          />
          Tous les produits
        </label>
        <label className="flex min-h-8 items-center gap-3 text-sm text-dk-2">
          <input
            type="radio"
            name="availability"
            value="in-stock"
            defaultChecked={searchParams.availability === 'in-stock'}
          />
          Disponibles maintenant
        </label>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold text-marine">Prix en FCFA</legend>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <label className="grid gap-1 text-xs text-dk-2">
            Minimum
            <input
              name="minPrice"
              type="number"
              min="0"
              step="1000"
              defaultValue={searchParams.minPrice}
              className="min-h-11 min-w-0 border border-sable-dark bg-blanc px-2 text-marine"
            />
          </label>
          <label className="grid gap-1 text-xs text-dk-2">
            Maximum
            <input
              name="maxPrice"
              type="number"
              min="0"
              step="1000"
              defaultValue={searchParams.maxPrice}
              className="min-h-11 min-w-0 border border-sable-dark bg-blanc px-2 text-marine"
            />
          </label>
        </div>
      </fieldset>
      <label className="grid gap-2 text-sm font-semibold text-marine">
        Trier par
        <select
          name="sort"
          defaultValue={searchParams.sort ?? 'name_asc'}
          className="min-h-11 w-full border border-sable-dark bg-blanc px-3 font-normal"
        >
          <option value="name_asc">Nom</option>
          <option value="price_asc">Prix croissant</option>
          <option value="price_desc">Prix décroissant</option>
        </select>
      </label>
      <button
        type="submit"
        className="min-h-11 bg-marine px-5 text-sm font-semibold text-ivoire hover:bg-marine-3"
      >
        Afficher les résultats
      </button>
      <Link
        href="/collections"
        className="text-center text-sm font-semibold text-champ-dark underline-offset-4 hover:underline"
      >
        Réinitialiser
      </Link>
    </form>
  );
}

function CategoryChip({
  href,
  label,
  selected,
}: {
  href: string;
  label: string;
  selected: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={selected ? 'page' : undefined}
      className={`inline-flex min-h-10 shrink-0 items-center border px-4 text-sm font-semibold ${
        selected
          ? 'border-marine bg-marine text-ivoire'
          : 'border-sable-dark bg-blanc text-marine hover:border-champ-dark'
      }`}
    >
      {label}
    </Link>
  );
}

function applyLocalFilters(
  products: Product[],
  filters: CollectionsPageProps['searchParams'],
) {
  const min = Number(filters.minPrice);
  const max = Number(filters.maxPrice);
  return products.filter((product) => {
    if (filters.availability === 'in-stock' && (product.stock ?? 0) <= 0) {
      return false;
    }
    if (filters.minPrice && Number.isFinite(min) && product.price < min) {
      return false;
    }
    if (filters.maxPrice && Number.isFinite(max) && product.price > max) {
      return false;
    }
    return true;
  });
}
