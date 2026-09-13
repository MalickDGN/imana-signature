'use client';

import { useEffect, useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/lib/store/cart';

export function CartIcon() {
  const [isClient, setIsClient] = useState(false);
  const items = useCartStore((state) => state.items);
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <span className="relative inline-grid h-11 w-11 place-items-center" aria-label="Panier">
      <ShoppingBag size={20} aria-hidden="true" />
      {isClient && totalItems > 0 && (
        <span className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-champ px-1 text-[10px] font-bold text-marine">
          {totalItems}
        </span>
      )}
    </span>
  );
}
