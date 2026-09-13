'use client';

import type { Product } from '@imana-signature/shared-types';
import { Heart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useWishlistStore } from '@/lib/store/wishlist';

export function WishlistButton({
  product,
  className = '',
}: {
  product: Product;
  className?: string;
}) {
  const [hydrated, setHydrated] = useState(false);
  const items = useWishlistStore((state) => state.items);
  const toggle = useWishlistStore((state) => state.toggle);
  const selected = hydrated && items.some((item) => item.id === product.id);

  useEffect(() => setHydrated(true), []);

  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={
        selected
          ? `Retirer ${product.name} des favoris`
          : `Ajouter ${product.name} aux favoris`
      }
      className={`grid h-11 w-11 place-items-center rounded-s border border-sable-dark bg-blanc/95 text-marine transition hover:border-champ-dark hover:text-champ-dark ${className}`}
      onClick={() => toggle(product)}
    >
      <Heart size={19} fill={selected ? 'currentColor' : 'none'} />
    </button>
  );
}
