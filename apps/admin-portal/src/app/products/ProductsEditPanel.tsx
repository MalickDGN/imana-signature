'use client';

import { useEffect, useState } from 'react';

interface AdminProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
}

const money = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 });

export function ProductsEditPanel({ apiUrl }: { apiUrl: string }) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`${apiUrl}/api/products?limit=200`, { cache: 'no-store' });
        if (!response.ok) throw new Error('load failed');
        setProducts((await response.json()) as AdminProduct[]);
      } catch {
        setError('Impossible de charger le catalogue.');
      } finally {
        setLoading(false);
      }
    })();
  }, [apiUrl]);

  const save = async (productId: string) => {
    const draft = drafts[productId];
    if (draft === undefined) return;
    const price = Number(draft);
    if (!Number.isFinite(price) || price < 0) return;
    setSavingId(productId);
    try {
      await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price }),
      });
      setProducts((current) =>
        current.map((product) => (product.id === productId ? { ...product, price } : product)),
      );
      setDrafts((current) => {
        const next = { ...current };
        delete next[productId];
        return next;
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Odoo</p>
          <h2>Prix du catalogue</h2>
        </div>
      </div>

      {loading && <div className="module-empty">Chargement…</div>}
      {error && <div className="module-alert is-error">{error}</div>}

      {!loading && !error && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Produit</th>
                <th>Catégorie</th>
                <th>Stock</th>
                <th>Prix</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const draft = drafts[product.id] ?? String(product.price);
                const dirty = drafts[product.id] !== undefined && drafts[product.id] !== String(product.price);
                return (
                  <tr key={product.id}>
                    <td>{product.name}</td>
                    <td>{product.category ?? 'Non classé'}</td>
                    <td>{product.stock}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        value={draft}
                        onChange={(event) =>
                          setDrafts((current) => ({ ...current, [product.id]: event.target.value }))
                        }
                        style={{ width: '110px' }}
                      />
                      <span style={{ marginLeft: '6px', color: 'var(--text-muted, #888)' }}>
                        {money.format(product.price)}
                      </span>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="secondary-action"
                        disabled={!dirty || savingId === product.id}
                        onClick={() => void save(product.id)}
                      >
                        {savingId === product.id ? 'Enregistrement…' : 'Enregistrer'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
