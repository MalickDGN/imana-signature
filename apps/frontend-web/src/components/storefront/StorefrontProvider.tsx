'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/lib/store/cart';
import { useWishlistStore } from '@/lib/store/wishlist';
import { parseProducts, type StorefrontProduct } from '@/lib/storefront/model';
import { requestJson } from '@/lib/storefront/api';

export type Panel = 'cart' | 'wishlist' | 'account' | 'community' | null;
interface StorefrontContext {
  products: StorefrontProduct[]; loading: boolean; error: string; reload: () => void;
  panel: Panel; openPanel: (panel: Panel) => void; notify: (message: string) => void;
  add: (product: StorefrontProduct) => void; hydrated: boolean;
}
const Context = createContext<StorefrontContext | null>(null);
export function StorefrontProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<StorefrontProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [panel, setPanel] = useState<Panel>(null);
  const [message, setMessage] = useState('');
  const [hydrated, setHydrated] = useState(false);
  const pathname = usePathname();
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const pending = useRef<AbortController>();
  const notify = useCallback((value: string) => { setMessage(value); clearTimeout(timer.current); timer.current = setTimeout(() => setMessage(''), 4000); }, []);
  const reload = useCallback(async () => {
    pending.current?.abort();
    const controller = new AbortController(); pending.current = controller;
    setLoading(true); setError('');
    try {
      const values = parseProducts(await requestJson<unknown>('/api/storefront/products', { signal: controller.signal }));
      if (!controller.signal.aborted) setProducts(values);
    } catch (e) {
      if (!controller.signal.aborted) { setProducts([]); setError(e instanceof Error ? e.message : 'Catalogue indisponible.'); }
    } finally { if (!controller.signal.aborted) setLoading(false); }
  }, []);
  useEffect(() => { setHydrated(true); void reload(); window.addEventListener('focus', reload); return () => { pending.current?.abort(); window.removeEventListener('focus', reload); clearTimeout(timer.current); }; }, [reload]);
  useEffect(() => setPanel(null), [pathname]);
  useEffect(() => {
    if (!products.length) return;
    // Adopt historical carts once, resolving IDs against the API catalogue.
    try {
      if (localStorage.getItem('imana-typescript-migrated')) return;
      const oldCart: unknown = JSON.parse(localStorage.getItem('imana-signature-cart') || '[]');
      if (!useCartStore.getState().items.length && Array.isArray(oldCart)) {
        const items = oldCart.flatMap(entry => {
          const product = products.find(p => p.id === String(entry?.id));
          const quantity = Math.min(99, Math.max(1, Math.floor(Number(entry?.quantity) || 1)));
          return product ? [{ ...product, quantity }] : [];
        });
        useCartStore.setState({ items });
      }
      const favorites: unknown = JSON.parse(localStorage.getItem('imana-signature-wishlist') || '[]');
      if (!useWishlistStore.getState().items.length && Array.isArray(favorites)) useWishlistStore.setState({ items: products.filter(p => favorites.some(id => String(id) === p.id)) });
      localStorage.setItem('imana-typescript-migrated', '1');
    } catch { /* Storage may be unavailable; browsing still works. */ }
  }, [products]);
  function add(product: StorefrontProduct) {
    const cart = useCartStore.getState();
    const count = cart.items.find(p => p.id === product.id)?.quantity || 0;
    if (product.stock !== undefined && count >= product.stock) return notify('La quantité disponible a été atteinte.');
    cart.addItem(product); notify(`${product.name} ajouté au panier.`);
  }
  return <Context.Provider value={{ products, loading, error, reload, panel, openPanel: setPanel, notify, add, hydrated }}>
    {children}<div className={`toast-global${message ? ' show' : ''}`} role="status">{message}</div>
  </Context.Provider>;
}
export function useStorefront() { const value = useContext(Context); if (!value) throw new Error('StorefrontProvider is required'); return value; }
