import type { Metadata } from 'next';
import { Suspense } from 'react';
import { CatalogLayout } from '@/components/storefront/CatalogLayout';
export const metadata: Metadata = { title: "Boutique | IMANA Signature" };
export default function Page() { return <Suspense fallback={<p className="storefront-status" role="status">Chargement…</p>}><CatalogLayout /></Suspense>; }
