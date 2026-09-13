import type {
  Product,
  ProductCategory,
  ProductSort,
} from '@imana-signature/shared-types';

const API_GATEWAY_URL =
  process.env.API_GATEWAY_URL ?? 'http://localhost:3001';

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const product = value as Record<string, unknown>;
  return (
    typeof product.id === 'string' &&
    typeof product.name === 'string' &&
    typeof product.price === 'number'
  );
}

interface ProductFilters {
  search?: string;
  category?: string;
  sort?: ProductSort;
}

export async function getProducts(
  filters: ProductFilters = {},
): Promise<Product[]> {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  if (filters.category) params.set('category', filters.category);
  if (filters.sort) params.set('sort', filters.sort);
  const query = params.size > 0 ? `?${params.toString()}` : '';
  const response = await fetch(`${API_GATEWAY_URL}/api/products${query}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Products API returned ${response.status}.`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data) || !data.every(isProduct)) {
    throw new Error('Products API returned an invalid payload.');
  }

  return data;
}

export async function getProductCategories(): Promise<ProductCategory[]> {
  const response = await fetch(`${API_GATEWAY_URL}/api/products/categories`, {
    next: { revalidate: 300 },
  });
  if (!response.ok) {
    throw new Error(`Categories API returned ${response.status}.`);
  }

  const data: unknown = await response.json();
  if (
    !Array.isArray(data) ||
    !data.every(
      (category) =>
        category &&
        typeof category === 'object' &&
        typeof category.id === 'string' &&
        typeof category.name === 'string',
    )
  ) {
    throw new Error('Categories API returned an invalid payload.');
  }

  return data as ProductCategory[];
}

export async function getProduct(id: string): Promise<Product | null> {
  const response = await fetch(`${API_GATEWAY_URL}/api/products/${id}`, {
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(`Products API returned ${response.status}.`);
  }

  const data: unknown = await response.json();
  if (!isProduct(data)) {
    throw new Error('Products API returned an invalid payload.');
  }

  return data;
}
