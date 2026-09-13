import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MagazineSections } from '@/components/storefront/MagazineSections';
export const metadata: Metadata = { title: "Magazine | IMANA Signature" };
export default function Page() { return <Suspense fallback={<p className="storefront-status" role="status">Chargement…</p>}><MagazineSections /></Suspense>; }
