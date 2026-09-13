'use client';

import { useCallback, useEffect, useState } from 'react';

export function useAdminList<T>(path: string) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) throw new Error('load failed');
      const payload: unknown = await response.json();
      setItems(Array.isArray(payload) ? (payload as T[]) : []);
    } catch {
      setError('Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void load();
  }, [load]);

  return { items, loading, error, reload: load };
}
