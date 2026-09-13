'use client';

import Link from 'next/link';
import { Heart } from 'lucide-react';
import { EmptyState } from '@imana-signature/ui-kit';
import { useEffect, useState } from 'react';
import { ProductCard } from '@/components/ProductCard';
import { useWishlistStore } from '@/lib/store/wishlist';

export default function WishlistPage() {
  const [hydrated, setHydrated] = useState(false);
  const items = useWishlistStore((state) => state.items);

  useEffect(() => setHydrated(true), []);

  if (!hydrated) {
    return <div className="mx-auto min-h-[55vh] max-w-7xl px-6 py-16" />;
  }

  return (
    <div className="min-h-[70vh] bg-ivoire py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase text-champ-dark">Votre sélection</p>
        <h1 className="mt-2 font-disp text-5xl font-semibold text-marine">
          Liste d’envies
        </h1>
        {items.length ? (
          <div className="mt-10 grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Heart size={22} />}
            title="Votre sélection est encore vide"
            description="Conservez ici les parfums qui vous attirent pour les retrouver facilement."
            action={
              <Link
                href="/collections"
                className="inline-flex min-h-11 items-center rounded-s bg-marine px-6 text-sm font-semibold text-ivoire"
              >
                Explorer les parfums
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
