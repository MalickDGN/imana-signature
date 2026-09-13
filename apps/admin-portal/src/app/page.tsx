import type { AdminProduct } from './AdminDashboard';
import { AdminDashboard } from './AdminDashboard';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface HealthPayload {
  status?: unknown;
}

export interface CatalogMetrics { products: number; stock: number; lowStock: number; value: number }
interface AdminIdentity { id: string; name: string; email: string; roles: string[] }

async function loadDashboardData() {
  const configuredApiUrl =
    process.env.API_GATEWAY_URL ?? process.env.API_GATEWAY_PUBLIC_URL;
  const candidates = [
    configuredApiUrl,
    'http://localhost:3001',
    'http://localhost:3101',
  ].filter((value, index, values): value is string => Boolean(value) && values.indexOf(value) === index);

  for (const apiUrl of candidates) {
    try {
      const healthResponse = await fetch(`${apiUrl}/api/healthz`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(2500),
      });
      const health = (await healthResponse.json()) as HealthPayload;
      if (!healthResponse.ok || health.status !== 'ok') continue;

      const [productsResponse, metricsResponse] = await Promise.all([
        fetch(`${apiUrl}/api/products?limit=100`, { cache: 'no-store', signal: AbortSignal.timeout(5000) }),
        fetch(`${apiUrl}/api/products/metrics`, { cache: 'no-store', signal: AbortSignal.timeout(5000) }),
      ]);
      const payload: unknown = productsResponse.ok
        ? await productsResponse.json()
        : [];
      const products = Array.isArray(payload)
        ? payload.filter(isAdminProduct)
        : [];
      const metricsPayload: unknown = metricsResponse.ok ? await metricsResponse.json() : undefined;
      const metrics = isCatalogMetrics(metricsPayload) ? metricsPayload : calculateMetrics(products);

      return { apiOnline: true, apiUrl, products, metrics };
    } catch {
      // Try the next local endpoint before switching to degraded mode.
    }
  }

  return {
    apiOnline: false,
    apiUrl: configuredApiUrl ?? 'http://localhost:3001',
    products: [] as AdminProduct[],
    metrics: { products: 0, stock: 0, lowStock: 0, value: 0 },
  };
}

function isCatalogMetrics(value: unknown): value is CatalogMetrics {
  if (!value || typeof value !== 'object') return false;
  return ['products', 'stock', 'lowStock', 'value'].every((key) => Number.isFinite((value as Record<string, unknown>)[key]));
}

function calculateMetrics(products: AdminProduct[]): CatalogMetrics {
  return products.reduce((result, product) => ({ products: result.products + 1, stock: result.stock + product.stock, lowStock: result.lowStock + (product.stock <= 5 ? 1 : 0), value: result.value + product.stock * product.price }), { products: 0, stock: 0, lowStock: 0, value: 0 });
}

function isAdminProduct(value: unknown): value is AdminProduct {
  if (!value || typeof value !== 'object') return false;
  const product = value as Record<string, unknown>;
  return (
    typeof product.id === 'string' &&
    typeof product.name === 'string' &&
    typeof product.price === 'number' &&
    typeof product.stock === 'number'
  );
}

export default async function AdminHomePage() {
  const session = (await cookies()).get('imana_admin_session')?.value;
  const apiUrl = process.env.API_GATEWAY_URL ?? process.env.API_GATEWAY_PUBLIC_URL ?? 'http://localhost:3101';
  const importToken = process.env.ADMIN_IMPORT_TOKEN;
  if (!session || !importToken) redirect('/login');
  const identity = await fetch(`${apiUrl}/api/auth/me`, {
    headers: { 'x-admin-session': session, 'x-admin-import-token': importToken },
    cache: 'no-store',
  }).catch(() => null);
  if (!identity?.ok) redirect('/login');
  const identityPayload: unknown = await identity.json();
  if (!isAdminIdentity(identityPayload)) redirect('/login');
  const dashboard = await loadDashboardData();
  const updatedAt = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  return (
    <AdminDashboard
      {...dashboard}
      odooUrl={process.env.ODOO_PUBLIC_URL ?? 'http://localhost:8069'}
      updatedAt={updatedAt}
      environment={process.env.ENVIRONMENT ?? process.env.NODE_ENV ?? 'development'}
      user={identityPayload}
    />
  );
}

function isAdminIdentity(value: unknown): value is AdminIdentity {
  if (!value || typeof value !== 'object') return false;
  const user = value as Record<string, unknown>;
  return typeof user.id === 'string' && typeof user.name === 'string' && typeof user.email === 'string' && Array.isArray(user.roles) && user.roles.every((role) => typeof role === 'string');
}
