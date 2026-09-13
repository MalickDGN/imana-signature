'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@imana-signature/shared-types';
import { ArrowUpRight, ShoppingBag } from 'lucide-react';
import { Badge } from '@imana-signature/ui-kit';
import { useState } from 'react';
import { useCartStore } from '@/lib/store/cart';
import { WishlistButton } from './WishlistButton';

export function ProductCard({ product }: { product: Product }) {
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const unavailable = typeof product.stock === 'number' && product.stock <= 0;
  const visual = product.imageUrl || getFallbackVisual(product.category);

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[4/5] overflow-hidden bg-sable/40">
        <Link
          href={`/products/${product.id}`}
          className="absolute inset-0"
          aria-label={`Découvrir ${product.name}`}
        >
        <Image
            src={visual}
          alt={product.name}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover object-center transition duration-500 group-hover:scale-[1.025]"
        />
        </Link>
        <div className="absolute left-3 top-3 flex gap-2">
          {unavailable ? (
            <Badge tone="danger">Épuisé</Badge>
          ) : product.stock !== undefined && product.stock <= 5 ? (
            <Badge tone="accent">Dernières pièces</Badge>
          ) : (
            <Badge tone="neutral">Sélection IMANA</Badge>
          )}
        </div>
        <WishlistButton product={product} className="absolute right-3 top-3" />
        <button
          type="button"
          disabled={unavailable}
          onClick={() => {
            addItem(product);
            setAdded(true);
          }}
          className="absolute inset-x-3 bottom-3 flex min-h-11 items-center justify-center gap-2 rounded-s bg-marine px-4 text-sm font-semibold text-ivoire opacity-100 shadow-lg transition duration-200 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 focus:translate-y-0 focus:opacity-100 disabled:cursor-not-allowed disabled:bg-dk-3"
        >
          <ShoppingBag size={17} />
          {added ? 'Ajouté au panier' : unavailable ? 'Indisponible' : 'Ajouter rapidement'}
        </button>
      </div>
      <div className="pt-4">
        <p className="text-[11px] font-bold uppercase text-champ-dark">
          {product.category || 'Parfumerie'}
        </p>
        <Link
          href={`/products/${product.id}`}
          className="mt-1 flex items-start justify-between gap-3"
        >
          <h3 className="font-disp text-2xl font-semibold leading-tight text-marine">
            {product.name}
          </h3>
          <ArrowUpRight
            size={17}
            className="mt-1 shrink-0 text-champ-dark opacity-0 transition group-hover:opacity-100"
          />
        </Link>
        <p className="mt-2 text-sm font-semibold text-marine">
          {product.price.toLocaleString('fr-FR')} FCFA
        </p>
      </div>
      <span className="sr-only" aria-live="polite">
        {added ? `${product.name} a été ajouté au panier.` : ''}
      </span>
    </article>
  );
}

function getFallbackVisual(category?: string) {
  const normalized = category?.toLocaleLowerCase('fr') ?? '';
  return normalized.includes('niche')
    ? '/assets/img/imana/niche.webp'
    : '/assets/img/imana/designers.webp';
}
