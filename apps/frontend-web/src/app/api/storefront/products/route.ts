import { NextResponse } from 'next/server';
import { parseProducts } from '@/lib/storefront/model';

const PAGE_SIZE = 1000;
const FETCH_TIMEOUT_MS = 30_000;
const CACHE_TTL_MS = 60_000;

let cache: { expiresAt: number; products: unknown[] } | null = null;

async function fetchAllProducts(origin: string): Promise<unknown[]> {
  const products: unknown[] = [];
  for (let offset = 0; offset <= 10000; offset += PAGE_SIZE) {
    const response = await fetch(`${origin}/api/products?limit=${PAGE_SIZE}&offset=${offset}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error('Products unavailable');
    const page: unknown = await response.json();
    if (!Array.isArray(page)) throw new Error('Invalid products response');
    products.push(...page);
    if (page.length < PAGE_SIZE) break;
  }
  return products;
}

export async function GET() {
  if (cache && cache.expiresAt > Date.now()) {
    return NextResponse.json(parseProducts(cache.products), { headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    const origin = process.env.API_GATEWAY_URL || 'http://localhost:3001';
    const products = await fetchAllProducts(origin);
    cache = { products, expiresAt: Date.now() + CACHE_TTL_MS };
    return NextResponse.json(parseProducts(products), { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    if (cache) {
      return NextResponse.json(parseProducts(cache.products), { headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({ error: 'Le catalogue est momentanément indisponible. Veuillez réessayer.' }, { status: 503 });
  }
}
