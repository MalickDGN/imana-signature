'use client';

import type { Product } from '@imana-signature/shared-types';
import { useState } from 'react';
import { useCartStore } from '@/lib/store/cart';

export function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const unavailable = typeof product.stock === 'number' && product.stock <= 0;

  const handleAddToCart = () => {
    addItem(product);
    setAdded(true);
  };

  return (
    <div className="min-w-0">
      <button
        type="button"
        onClick={handleAddToCart}
        disabled={unavailable}
        className="min-h-14 w-full rounded-s bg-marine px-6 text-base font-semibold text-ivoire transition-colors hover:bg-marine-3 disabled:cursor-not-allowed disabled:bg-dk-3"
      >
        {unavailable ? 'Produit indisponible' : 'Ajouter au panier'}
      </button>
      <p aria-live="polite" className="mt-2 min-h-5 text-xs text-emerald-800">
        {added ? `${product.name} a été ajouté au panier.` : ''}
      </p>
    </div>
  );
}
