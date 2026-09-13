'use client';

import Image from 'next/image';
import type { CartItem } from '@imana-signature/shared-types';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';

export function CartItemRow({ item }: { item: CartItem }) {
  const { increaseQuantity, decreaseQuantity, removeItem } = useCartStore();
  const visual =
    item.imageUrl ||
    (item.category?.toLocaleLowerCase('fr').includes('niche')
      ? '/assets/img/imana/niche.webp'
      : '/assets/img/imana/designers.webp');

  return (
    <article className="grid grid-cols-[88px_minmax(0,1fr)] gap-4 border-b border-sable-dark py-5 sm:grid-cols-[112px_minmax(0,1fr)_auto] sm:gap-6">
      <div className="relative aspect-[4/5] overflow-hidden bg-sable/40">
        <Image
          src={visual}
          alt={item.name}
          fill
          sizes="112px"
          className="object-cover"
        />
      </div>
      <div className="min-w-0 py-1">
        <p className="text-[11px] font-bold uppercase text-champ-dark">
          {item.category || 'Parfumerie'}
        </p>
        <h2 className="mt-1 font-disp text-2xl font-semibold leading-tight text-marine">
          {item.name}
        </h2>
        <p className="mt-2 text-sm text-dk-2">
          {item.price.toLocaleString('fr-FR')} FCFA l’unité
        </p>
        <div className="mt-5 flex items-center gap-2">
          <div
            className="flex h-11 items-center border border-sable-dark bg-blanc"
            aria-label={`Quantité pour ${item.name}`}
          >
            <button
              type="button"
              onClick={() => decreaseQuantity(item.id)}
              className="grid h-11 w-10 place-items-center text-marine hover:bg-sable/40"
              aria-label={`Diminuer la quantité de ${item.name}`}
            >
              <Minus size={15} />
            </button>
            <span className="min-w-9 text-center text-sm font-semibold">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => increaseQuantity(item.id)}
              className="grid h-11 w-10 place-items-center text-marine hover:bg-sable/40"
              aria-label={`Augmenter la quantité de ${item.name}`}
            >
              <Plus size={15} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => removeItem(item.id)}
            className="grid h-11 w-11 place-items-center text-dk-2 hover:text-red-800"
            aria-label={`Supprimer ${item.name} du panier`}
            title="Supprimer"
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>
      <p className="col-start-2 self-start pt-1 text-right font-semibold text-marine sm:col-start-3">
        {(item.price * item.quantity).toLocaleString('fr-FR')} FCFA
      </p>
    </article>
  );
}
