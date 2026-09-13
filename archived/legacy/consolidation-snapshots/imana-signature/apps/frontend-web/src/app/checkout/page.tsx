'use client';

import Link from 'next/link';
import { LockKeyhole, ShoppingBag } from 'lucide-react';
import { EmptyState } from '@imana-signature/ui-kit';
import { useEffect, useState } from 'react';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { PaymentForm } from '@/components/checkout/PaymentForm';
import { ShippingAddressForm } from '@/components/checkout/ShippingAddressForm';
import { ShippingMethodForm } from '@/components/checkout/ShippingMethodForm';
import { useCartStore } from '@/lib/store/cart';

type CheckoutStep = 'address' | 'shipping' | 'payment';

const steps: Array<{ id: CheckoutStep; label: string }> = [
  { id: 'address', label: 'Coordonnées' },
  { id: 'shipping', label: 'Livraison' },
  { id: 'payment', label: 'Paiement' },
];

export default function CheckoutPage() {
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<CheckoutStep>('address');
  const items = useCartStore((state) => state.items);

  useEffect(() => setHydrated(true), []);

  if (!hydrated) return <div className="min-h-[70vh] bg-ivoire" />;

  if (!items.length) {
    return (
      <div className="min-h-[70vh] bg-ivoire py-14">
        <EmptyState
          icon={<ShoppingBag size={22} />}
          title="Votre panier est vide"
          description="Ajoutez au moins une fragrance avant de finaliser votre commande."
          action={
            <Link
              href="/collections"
              className="inline-flex min-h-11 items-center bg-marine px-6 text-sm font-semibold text-ivoire"
            >
              Retour à la boutique
            </Link>
          }
        />
      </div>
    );
  }

  const currentIndex = steps.findIndex((item) => item.id === step);

  return (
    <div className="min-h-screen bg-ivoire py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 border-b border-sable-dark pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase text-champ-dark">
              Commande sécurisée
            </p>
            <h1 className="mt-2 font-disp text-5xl font-semibold text-marine">
              Finaliser ma commande
            </h1>
          </div>
          <p className="flex items-center gap-2 text-xs text-dk-2">
            <LockKeyhole size={14} /> Stock et prix revérifiés avant validation
          </p>
        </div>

        <ol className="grid grid-cols-3 border-b border-sable-dark" aria-label="Étapes du checkout">
          {steps.map((item, index) => (
            <li
              key={item.id}
              aria-current={item.id === step ? 'step' : undefined}
              className={`flex min-h-16 items-center gap-2 border-b-2 text-xs font-bold uppercase sm:text-sm ${
                item.id === step
                  ? 'border-champ-dark text-marine'
                  : index < currentIndex
                    ? 'border-marine text-marine'
                    : 'border-transparent text-dk-3'
              }`}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-current text-xs">
                {index + 1}
              </span>
              <span className="hidden sm:inline">{item.label}</span>
            </li>
          ))}
        </ol>

        <div className="grid items-start gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16">
          <section className="max-w-2xl" aria-live="polite">
            {step === 'address' && (
              <ShippingAddressForm onNextStep={() => setStep('shipping')} />
            )}
            {step === 'shipping' && (
              <ShippingMethodForm
                onNextStep={() => setStep('payment')}
                onBack={() => setStep('address')}
              />
            )}
            {step === 'payment' && (
              <PaymentForm onBack={() => setStep('shipping')} />
            )}
          </section>
          <aside className="sticky top-28 border border-sable-dark bg-blanc p-6 sm:p-7">
            <OrderSummary />
          </aside>
        </div>
      </div>
    </div>
  );
}
