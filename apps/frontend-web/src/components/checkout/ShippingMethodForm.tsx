'use client';

import type { ShippingMethod } from '@imana-signature/shared-types';
import { useEffect, useState } from 'react';
import { useCartStore } from '@/lib/store/cart';

interface DeliveryZone {
  id: string;
  name: string;
  price_fcfa: string;
}

function isDeliveryZone(value: unknown): value is DeliveryZone {
  if (!value || typeof value !== 'object') return false;
  const zone = value as Record<string, unknown>;
  return typeof zone.id === 'string' && typeof zone.name === 'string' && zone.price_fcfa !== undefined;
}

interface ShippingMethodFormProps {
  onNextStep: () => void;
  onBack?: () => void;
}

export function ShippingMethodForm({ onNextStep, onBack }: ShippingMethodFormProps) {
  const [zones, setZones] = useState<ShippingMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<ShippingMethod | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const setShippingMethod = useCartStore((state) => state.setShippingMethod);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/delivery-zones', { cache: 'no-store' });
        if (!response.ok) throw new Error('unavailable');
        const payload: unknown = await response.json();
        if (!Array.isArray(payload)) throw new Error('invalid payload');
        const options = payload.filter(isDeliveryZone).map((zone) => ({
          code: zone.id,
          name: zone.name,
          price: Number(zone.price_fcfa),
        }));
        if (cancelled) return;
        setZones(options);
        setSelectedMethod(options[0] ?? null);
      } catch {
        if (!cancelled) setError('Les options de livraison sont momentanément indisponibles.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleContinue = () => {
    if (!selectedMethod) return;
    setShippingMethod(selectedMethod);
    onNextStep();
  };

  return (
    <div>
      <h2 className="font-disp text-3xl font-semibold text-marine">Methode de livraison</h2>
      <p className="mt-2 text-sm text-dk-2">Choisissez le délai adapté à votre commande.</p>
      {isLoading && <p className="mt-5 text-sm text-dk-2">Chargement des options…</p>}
      {error && <p role="alert" className="mt-5 text-sm text-red-800">{error}</p>}
      <div className="mt-7 grid gap-3">
      {zones.map((option) => (
        <button
          type="button"
          key={option.code}
          onClick={() => setSelectedMethod(option)}
          aria-pressed={selectedMethod?.code === option.code}
          className={`min-h-24 w-full rounded-s border bg-blanc p-5 text-left transition ${selectedMethod?.code === option.code ? 'border-champ-dark ring-2 ring-champ/25' : 'border-sable-dark hover:border-champ-dark'}`}
        >
          <div className="flex justify-between">
            <span className="font-semibold">{option.name}</span>
            <span>{option.price.toLocaleString('fr-FR')} FCFA</span>
          </div>
        </button>
      ))}
      </div>
      <div className="mt-7 flex gap-3">
      {onBack && <button type="button" onClick={onBack} className="min-h-12 border border-marine px-5 font-semibold text-marine">Retour</button>}
      <button
        type="button"
        onClick={handleContinue}
        disabled={!selectedMethod}
        className="min-h-12 flex-1 rounded-s bg-marine px-5 font-semibold text-ivoire hover:bg-marine-3 disabled:bg-dk-3"
      >
        Continuer vers le paiement
      </button>
      </div>
    </div>
  );
}
