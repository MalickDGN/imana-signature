'use client';

import Link from 'next/link';
import { ArrowRight, LockKeyhole, ShoppingBag } from 'lucide-react';
import { EmptyState } from '@imana-signature/ui-kit';
import { useEffect, useState } from 'react';
import { CartItemRow } from '@/components/CartItemRow';
import { useCartStore } from '@/lib/store/cart';

export default function CartPage() {
  const [hydrated, setHydrated] = useState(false);
  const items = useCartStore((state) => state.items);
  const subtotal = items.reduce(
    (total, item) => total + item.price * item.quantity,
    0,
  );

  useEffect(() => setHydrated(true), []);

  if (!hydrated) {
    return <div className="min-h-[65vh] bg-ivoire" />;
  }

  if (!items.length) {
    return (
      <div className="min-h-[70vh] bg-ivoire py-14">
        <EmptyState
          icon={<ShoppingBag size={22} />}
          title="Votre panier est vide"
          description="Parcourez nos univers et composez une sélection qui vous ressemble."
          action={
            <Link
              href="/collections"
              className="inline-flex min-h-11 items-center bg-marine px-6 text-sm font-semibold text-ivoire"
            >
              Découvrir les parfums
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-[75vh] bg-ivoire py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <p className="text-xs font-bold uppercase text-champ-dark">Votre sélection</p>
        <h1 className="mt-2 font-disp text-5xl font-semibold text-marine">
          Panier
        </h1>
        <div className="mt-9 grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
          <section aria-label="Articles du panier" className="border-t border-sable-dark">
            {items.map((item) => (
              <CartItemRow key={item.id} item={item} />
            ))}
            <Link
              href="/collections"
              className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-champ-dark"
            >
              ← Continuer mes découvertes
            </Link>
          </section>

          <aside className="border border-sable-dark bg-blanc p-6 sm:p-7">
            <h2 className="font-disp text-3xl font-semibold text-marine">
              Résumé
            </h2>
            <dl className="mt-6 grid gap-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-dk-2">Sous-total</dt>
                <dd className="font-semibold">{subtotal.toLocaleString('fr-FR')} FCFA</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-dk-2">Livraison</dt>
                <dd>Calculée au checkout</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-sable-dark pt-4 text-lg">
                <dt className="font-semibold">Total estimé</dt>
                <dd className="font-semibold">{subtotal.toLocaleString('fr-FR')} FCFA</dd>
              </div>
            </dl>
            <Link
              href="/checkout"
              className="mt-7 flex min-h-12 w-full items-center justify-center gap-2 bg-marine px-5 text-sm font-semibold text-ivoire hover:bg-marine-3"
            >
              Finaliser la commande <ArrowRight size={17} />
            </Link>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-dk-2">
              <LockKeyhole size={14} /> Données transmises de manière sécurisée
            </p>
            <div className="mt-6 border-t border-sable-dark pt-5 text-xs leading-6 text-dk-2">
              Le stock et les prix sont contrôlés dans Odoo avant la création
              définitive de votre commande.
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
