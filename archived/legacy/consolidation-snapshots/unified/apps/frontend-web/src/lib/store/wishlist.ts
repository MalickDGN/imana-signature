'use client';

import type { Product } from '@imana-signature/shared-types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface WishlistState {
  items: Product[];
  toggle: (product: Product) => void;
  contains: (productId: string) => boolean;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (product) =>
        set((state) => ({
          items: state.items.some((item) => item.id === product.id)
            ? state.items.filter((item) => item.id !== product.id)
            : [...state.items, product],
        })),
      contains: (productId) =>
        get().items.some((item) => item.id === productId),
    }),
    {
      name: 'imana-wishlist-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
