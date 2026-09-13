'use client';

import type { CreateOrderResult } from '@imana-signature/shared-types';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';
import { useCartStore } from '@/lib/store/cart';

interface PaymentMethodOption {
  id: string;
  code: string;
  label: string;
}

function isPaymentMethodOption(value: unknown): value is PaymentMethodOption {
  if (!value || typeof value !== 'object') return false;
  const method = value as Record<string, unknown>;
  return typeof method.id === 'string' && typeof method.code === 'string' && typeof method.label === 'string';
}

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
  const [methods, setMethods] = useState<PaymentMethodOption[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const idempotencyKey = useRef<string | undefined>(undefined);
  const { shippingAddress, shippingMethod, clearCart, buildOrderPayload } = useCartStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/payment-methods', { cache: 'no-store' });
        if (!response.ok) throw new Error('unavailable');
        const payload: unknown = await response.json();
        if (!Array.isArray(payload)) throw new Error('invalid payload');
        const options = payload.filter(isPaymentMethodOption);
        if (cancelled) return;
        setMethods(options);
        setPaymentMethod(options[0]?.code ?? '');
      } catch {
        if (!cancelled) setError('Les moyens de paiement sont momentanément indisponibles.');
      } finally {
        if (!cancelled) setIsLoadingMethods(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePayment = async () => {
    if (!shippingAddress || !shippingMethod) {
      setError('Veuillez completer les etapes de livraison avant le paiement.');
      return;
    }
    if (!paymentMethod) {
      setError('Veuillez sélectionner un moyen de paiement.');
      return;
    }

    const orderPayload = buildOrderPayload({ method: paymentMethod });

    setIsLoading(true);
    setError(null);

    try {
      idempotencyKey.current ??= crypto.randomUUID();
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': idempotencyKey.current },
        body: JSON.stringify(orderPayload),
      });

      if (!response.ok) {
        throw new Error('La creation de la commande a echoue.');
      }

      const result: unknown = await response.json();
      if (!isCreateOrderResponse(result)) {
        throw new Error('Invalid order response.');
      }
      if (result.status === 'pending_payment' && result.paymentUrl) {
        const paymentUrl = new URL(result.paymentUrl);
        if (paymentUrl.protocol !== 'https:' || paymentUrl.hostname !== 'pay.wave.com') {
          throw new Error('Invalid payment URL.');
        }
        clearCart();
        window.location.assign(paymentUrl.toString());
        return;
      }
      startTransition(() => {
        clearCart();
        const params = new URLSearchParams({
          orderId: String(result.id),
          status: result.status,
        });
        router.push(`/order/success?${params.toString()}`);
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
      {isLoadingMethods && <p className="mt-5 text-sm text-dk-2">Chargement des moyens de paiement…</p>}
      <div className="mt-7 grid gap-3">
        {methods.map((method) => (
          <button
            key={method.id}
            type="button"
            onClick={() => setPaymentMethod(method.code)}
            aria-pressed={paymentMethod === method.code}
            className={`min-h-20 w-full rounded-s border bg-blanc p-5 text-left ${paymentMethod === method.code ? 'border-champ-dark ring-2 ring-champ/25' : 'border-sable-dark'}`}
          >
            {method.label}
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mt-5 text-sm text-red-800">{error}</p>}

      <div className="mt-7 flex gap-3">
      {onBack && <button type="button" onClick={onBack} className="min-h-12 border border-marine px-5 font-semibold text-marine">Retour</button>}
      <button
        type="button"
        onClick={handlePayment}
        disabled={isLoading || isPending || !paymentMethod}
        className="min-h-12 flex-1 rounded-s bg-marine px-5 font-semibold text-ivoire hover:bg-marine-3 disabled:bg-dk-3"
      >
        {isLoading || isPending ? 'Traitement en cours...' : 'Payer maintenant'}
      </button>
      </div>
    </div>
  );
}
