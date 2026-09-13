'use client';

import type {
  CreateOrderResult,
  MobilePaymentProvider,
  PaymentMethod,
} from '@imana-signature/shared-types';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useCartStore } from '@/lib/store/cart';

const PAYMENT_METHODS = {
  COD: 'cod',
  MOBILE: 'mobile',
} as const;

function isCreateOrderResponse(value: unknown): value is CreateOrderResult {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const response = value as Record<string, unknown>;
  return (
    typeof response.id === 'number' &&
    (response.status === 'pending_payment' || response.status === 'confirmed')
  );
}

export function PaymentForm({ onBack }: { onBack?: () => void } = {}) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
  const [mobileProvider, setMobileProvider] = useState<MobilePaymentProvider>('wave');
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { shippingAddress, shippingMethod, clearCart, buildOrderPayload } = useCartStore();

  const handlePayment = async () => {
    if (!shippingAddress || !shippingMethod) {
      setError('Veuillez completer les etapes de livraison avant le paiement.');
      return;
    }

    const orderPayload = buildOrderPayload({
      method: paymentMethod,
      provider: paymentMethod === PAYMENT_METHODS.MOBILE ? mobileProvider : undefined,
    });

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        throw new Error('La creation de la commande a echoue.');
      }

      const result: unknown = await response.json();
      if (!isCreateOrderResponse(result)) {
        throw new Error('Invalid order response.');
      }
      startTransition(() => {
        clearCart();
        router.push(`/order/success?orderId=${result.id}`);
      });
    } catch (error) {
      console.error('Payment error:', error);
      setError('Une erreur est survenue lors du paiement. Veuillez reessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="font-disp text-3xl font-semibold text-marine">Paiement</h2>
      <p className="mt-2 text-sm text-dk-2">Sélectionnez votre mode de règlement.</p>
      <div className="mt-7 grid gap-3">
        <button
          type="button"
          onClick={() => setPaymentMethod(PAYMENT_METHODS.COD)}
          aria-pressed={paymentMethod === PAYMENT_METHODS.COD}
          className={`min-h-20 w-full rounded-s border bg-blanc p-5 text-left ${paymentMethod === PAYMENT_METHODS.COD ? 'border-champ-dark ring-2 ring-champ/25' : 'border-sable-dark'}`}
        >
          Paiement a la livraison
        </button>
        <button
          type="button"
          onClick={() => setPaymentMethod(PAYMENT_METHODS.MOBILE)}
          aria-pressed={paymentMethod === PAYMENT_METHODS.MOBILE}
          className={`min-h-20 w-full rounded-s border bg-blanc p-5 text-left ${paymentMethod === PAYMENT_METHODS.MOBILE ? 'border-champ-dark ring-2 ring-champ/25' : 'border-sable-dark'}`}
        >
          Mobile Money
        </button>
      </div>

      {paymentMethod === PAYMENT_METHODS.MOBILE && (
        <div className="mt-5 border-t border-sable-dark pt-5">
          <h3 className="mb-2 font-semibold">Choisissez votre operateur :</h3>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setMobileProvider('wave')}
              aria-pressed={mobileProvider === 'wave'}
              className={`min-h-11 rounded-s border px-4 ${mobileProvider === 'wave' ? 'border-marine bg-marine text-ivoire' : 'border-sable-dark bg-blanc'}`}
            >
              Wave
            </button>
            <button
              type="button"
              onClick={() => setMobileProvider('orange-money')}
              aria-pressed={mobileProvider === 'orange-money'}
              className={`min-h-11 rounded-s border px-4 ${mobileProvider === 'orange-money' ? 'border-marine bg-marine text-ivoire' : 'border-sable-dark bg-blanc'}`}
            >
              Orange Money
            </button>
          </div>
        </div>
      )}

      {error && <p role="alert" className="mt-5 text-sm text-red-800">{error}</p>}

      <div className="mt-7 flex gap-3">
      {onBack && <button type="button" onClick={onBack} className="min-h-12 border border-marine px-5 font-semibold text-marine">Retour</button>}
      <button
        type="button"
        onClick={handlePayment}
        disabled={isLoading || isPending}
        className="min-h-12 flex-1 rounded-s bg-marine px-5 font-semibold text-ivoire hover:bg-marine-3 disabled:bg-dk-3"
      >
        {isLoading || isPending ? 'Traitement en cours...' : 'Payer maintenant'}
      </button>
      </div>
    </div>
  );
}
