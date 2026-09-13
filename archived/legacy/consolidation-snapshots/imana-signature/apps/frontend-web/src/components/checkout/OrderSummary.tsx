'use client';

import Image from 'next/image';
import { useCartStore } from '@/lib/store/cart';

export function OrderSummary() {
  const { items, shippingMethod } = useCartStore();
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const total = subtotal + (shippingMethod?.price || 0);

  return (
    <div>
      <h2 className="font-disp text-3xl font-semibold text-marine">Resume de la commande</h2>
      <div className="my-6 space-y-5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-4">
            <div className="flex items-center">
              <Image src={item.imageUrl || '/assets/img/imana/designers.webp'} alt={item.name} width={58} height={72} className="mr-4 h-[72px] w-[58px] object-cover" />
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-dk-2">Qte: {item.quantity}</p>
              </div>
            </div>
            <p>{(item.price * item.quantity).toLocaleString('fr-FR')} FCFA</p>
          </div>
        ))}
      </div>
      <div className="space-y-3 border-t border-sable-dark pt-5 text-sm">
        <div className="flex justify-between">
          <span>Sous-total</span>
          <span>{subtotal.toLocaleString('fr-FR')} FCFA</span>
        </div>
        <div className="flex justify-between">
          <span>Livraison</span>
          <span>{shippingMethod ? `${shippingMethod.price.toLocaleString('fr-FR')} FCFA` : "Calculee a l'etape suivante"}</span>
        </div>
        <div className="flex justify-between border-t border-sable-dark pt-4 text-lg font-bold">
          <span>Total</span>
          <span>{total.toLocaleString('fr-FR')} FCFA</span>
        </div>
      </div>
    </div>
  );
}
