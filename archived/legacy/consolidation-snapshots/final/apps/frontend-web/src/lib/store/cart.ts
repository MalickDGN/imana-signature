'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  CartItem,
  CreateOrderInput,
  PaymentDetails,
  Product,
  ShippingAddress,
  ShippingMethod,
} from '@imana-signature/shared-types';

interface CartState {
  items: CartItem[];
  shippingAddress: ShippingAddress | null;
  shippingMethod: ShippingMethod | null;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  increaseQuantity: (productId: string) => void;
  decreaseQuantity: (productId: string) => void;
  clearCart: () => void;
  setShippingAddress: (address: ShippingAddress) => void;
  setShippingMethod: (method: ShippingMethod) => void;
  buildOrderPayload: (payment: PaymentDetails) => {
    items: CreateOrderInput['items'];
    shippingAddress: ShippingAddress | null;
    shippingMethod: ShippingMethod | null;
    payment: PaymentDetails;
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      shippingAddress: null,
      shippingMethod: null,
      addItem: (product) =>
        set((state) => {
          const existingItem = state.items.find((item) => item.id === product.id);

          if (existingItem) {
            return {
              items: state.items.map((item) =>
                item.id === product.id
                  ? { ...item, quantity: item.quantity + 1 }
                  : item
              ),
            };
          }

          return { items: [...state.items, { ...product, quantity: 1 }] };
        }),
      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        })),
      increaseQuantity: (productId) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === productId
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        })),
      decreaseQuantity: (productId) =>
        set((state) => ({
          items: state.items
            .map((item) =>
              item.id === productId
                ? { ...item, quantity: item.quantity - 1 }
                : item
            )
            .filter((item) => item.quantity > 0),
        })),
      clearCart: () =>
        set({ items: [], shippingAddress: null, shippingMethod: null }),
      setShippingAddress: (address) => set({ shippingAddress: address }),
      setShippingMethod: (method) => set({ shippingMethod: method }),
      buildOrderPayload: (payment) => {
        const { items, shippingAddress, shippingMethod } = get();

        return {
          items: items.map(({ id, quantity }) => ({ id, quantity })),
          shippingAddress,
          shippingMethod,
          payment,
        };
      },
    }),
    {
      name: 'imana-cart-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        items: state.items,
        shippingAddress: state.shippingAddress,
        shippingMethod: state.shippingMethod,
      }),
    }
  )
);
