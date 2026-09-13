import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MaisonSections } from '@/components/storefront/MaisonSections';
export const metadata: Metadata = { title: "La Maison | IMANA Signature" };
export default function Page() { return <Suspense fallback={<p className="storefront-status" role="status">Chargement…</p>}><MaisonSections /></Suspense>; }
