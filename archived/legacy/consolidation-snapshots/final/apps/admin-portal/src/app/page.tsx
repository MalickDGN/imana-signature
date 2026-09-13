import type { AdminProduct } from './AdminDashboard';
import { AdminDashboard } from './AdminDashboard';

export const dynamic = 'force-dynamic';

interface HealthPayload {
  status?: unknown;
}

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

      const productsResponse = await fetch(`${apiUrl}/api/products?limit=100`, {
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      const payload: unknown = productsResponse.ok
        ? await productsResponse.json()
        : [];
      const products = Array.isArray(payload)
        ? payload.filter(isAdminProduct)
        : [];

      return { apiOnline: true, apiUrl, products };
    } catch {
      // Try the next local endpoint before switching to degraded mode.
    }
  }

  return {
    apiOnline: false,
    apiUrl: configuredApiUrl ?? 'http://localhost:3001',
    products: [] as AdminProduct[],
  };
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
    />
  );
}
