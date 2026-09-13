'use client';

import type { ShippingMethod } from '@imana-signature/shared-types';
import { useState } from 'react';
import { useCartStore } from '@/lib/store/cart';

interface ShippingOption extends ShippingMethod {
  details: string;
}

const shippingOptions: ShippingOption[] = [
  { code: 'standard', name: 'Livraison Standard', price: 3000, details: '3-5 jours ouvres' },
  { code: 'express', name: 'Livraison Express', price: 7000, details: '1-2 jours ouvres' },
];

interface ShippingMethodFormProps {
  onNextStep: () => void;
  onBack?: () => void;
}

export function ShippingMethodForm({ onNextStep, onBack }: ShippingMethodFormProps) {
  const [selectedMethod, setSelectedMethod] = useState(shippingOptions[0]);
  const setShippingMethod = useCartStore((state) => state.setShippingMethod);

  const handleContinue = () => {
    const { code, name, price } = selectedMethod;
    setShippingMethod({ code, name, price });
    onNextStep();
  };

  return (
    <div>
      <h2 className="font-disp text-3xl font-semibold text-marine">Methode de livraison</h2>
      <p className="mt-2 text-sm text-dk-2">Choisissez le délai adapté à votre commande.</p>
      <div className="mt-7 grid gap-3">
      {shippingOptions.map((option) => (
        <button
          type="button"
          key={option.name}
          onClick={() => setSelectedMethod(option)}
          aria-pressed={selectedMethod.name === option.name}
          className={`min-h-24 w-full rounded-s border bg-blanc p-5 text-left transition ${selectedMethod.name === option.name ? 'border-champ-dark ring-2 ring-champ/25' : 'border-sable-dark hover:border-champ-dark'}`}
        >
          <div className="flex justify-between">
            <span className="font-semibold">{option.name}</span>
            <span>{option.price.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <p className="mt-2 text-sm text-dk-2">{option.details}</p>
        </button>
      ))}
      </div>
      <div className="mt-7 flex gap-3">
      {onBack && <button type="button" onClick={onBack} className="min-h-12 border border-marine px-5 font-semibold text-marine">Retour</button>}
      <button type="button" onClick={handleContinue} className="min-h-12 flex-1 rounded-s bg-marine px-5 font-semibold text-ivoire hover:bg-marine-3">
        Continuer vers le paiement
      </button>
      </div>
    </div>
  );
}
