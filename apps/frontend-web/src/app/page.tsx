import type { Metadata } from 'next';
import { Suspense } from 'react';
import { HomeSections } from '@/components/storefront/HomeSections';
export const metadata: Metadata = { title: "IMANA Signature — Parfums et accessoires premium" };
export default function Page() { return <Suspense fallback={<p className="storefront-status" role="status">Chargement…</p>}><HomeSections /></Suspense>; }
