'use client';

import type { ShippingAddress } from '@imana-signature/shared-types';
import { FormEvent, useState } from 'react';
import { useCartStore } from '@/lib/store/cart';

interface ShippingAddressFormProps {
  onNextStep: () => void;
}

export function ShippingAddressForm({ onNextStep }: ShippingAddressFormProps) {
  const setShippingAddress = useCartStore((state) => state.setShippingAddress);
  const savedAddress = useCartStore((state) => state.shippingAddress);
  const [errors, setErrors] = useState<Partial<ShippingAddress>>({});

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const addressData = Object.fromEntries(formData.entries()) as unknown as ShippingAddress;

    const newErrors: Partial<ShippingAddress> = {};
    if (!addressData.name?.trim()) newErrors.name = 'Nom requis.';
    if (!addressData.email || !/\S+@\S+\.\S+/.test(addressData.email)) {
      newErrors.email = 'Email invalide.';
    }
    if (!addressData.phone?.trim()) newErrors.phone = 'Telephone requis.';
    if (!addressData.address) newErrors.address = 'Adresse requise.';
    if (!addressData.city) newErrors.city = 'Ville requise.';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setShippingAddress(addressData);
      onNextStep();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="font-disp text-3xl font-semibold text-marine">Adresse de livraison</h2>
      <p className="mt-2 text-sm leading-6 text-dk-2">
        Indiquez les coordonnées de la personne qui recevra la commande.
      </p>
      <div className="mt-7 grid gap-5 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label htmlFor="name" className="block text-sm font-semibold text-marine">Nom complet</label>
        <input defaultValue={savedAddress?.name} type="text" id="name" name="name" required aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} className="mt-2 min-h-12 w-full rounded-s border border-sable-dark bg-blanc px-3 outline-none focus:border-champ-dark" />
        {errors.name && <p id="name-error" role="alert" className="mt-1 text-xs text-red-800">{errors.name}</p>}
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-marine">Email</label>
        <input defaultValue={savedAddress?.email} type="email" id="email" name="email" required aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} className="mt-2 min-h-12 w-full rounded-s border border-sable-dark bg-blanc px-3 outline-none focus:border-champ-dark" />
        {errors.email && <p id="email-error" role="alert" className="mt-1 text-xs text-red-800">{errors.email}</p>}
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-marine">Telephone</label>
        <input defaultValue={savedAddress?.phone} type="tel" id="phone" name="phone" required aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'phone-error' : undefined} className="mt-2 min-h-12 w-full rounded-s border border-sable-dark bg-blanc px-3 outline-none focus:border-champ-dark" />
        {errors.phone && <p id="phone-error" role="alert" className="mt-1 text-xs text-red-800">{errors.phone}</p>}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="address" className="block text-sm font-semibold text-marine">Adresse</label>
        <input defaultValue={savedAddress?.address} type="text" id="address" name="address" required aria-invalid={Boolean(errors.address)} aria-describedby={errors.address ? 'address-error' : undefined} className="mt-2 min-h-12 w-full rounded-s border border-sable-dark bg-blanc px-3 outline-none focus:border-champ-dark" />
        {errors.address && <p id="address-error" role="alert" className="mt-1 text-xs text-red-800">{errors.address}</p>}
      </div>
      <div>
        <label htmlFor="city" className="block text-sm font-semibold text-marine">Ville</label>
        <input defaultValue={savedAddress?.city} type="text" id="city" name="city" required aria-invalid={Boolean(errors.city)} aria-describedby={errors.city ? 'city-error' : undefined} className="mt-2 min-h-12 w-full rounded-s border border-sable-dark bg-blanc px-3 outline-none focus:border-champ-dark" />
        {errors.city && <p id="city-error" role="alert" className="mt-1 text-xs text-red-800">{errors.city}</p>}
      </div>
      </div>
      <button type="submit" className="mt-7 min-h-12 w-full rounded-s bg-marine px-5 font-semibold text-ivoire hover:bg-marine-3">
        Continuer vers la livraison
      </button>
    </form>
  );
}
