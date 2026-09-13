'use client';

import { useAdminList } from '../../lib/useAdminList';

interface OdooStockMove {
  id: number;
  product_id: [number, string] | false;
  product_qty: number;
  state: string;
  date: string;
  location_id: [number, string] | false;
  location_dest_id: [number, string] | false;
  reference: string | false;
}

export function StockMovementsPanel() {
  const { items, loading, error } = useAdminList<OdooStockMove>('/api/admin/stock-movements');

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Odoo</p>
          <h2>Derniers mouvements</h2>
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
                <th>Quantité</th>
                <th>De</th>
                <th>Vers</th>
                <th>Référence</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((move) => (
                <tr key={move.id}>
                  <td>{Array.isArray(move.product_id) ? move.product_id[1] : '—'}</td>
                  <td>{move.product_qty}</td>
                  <td>{Array.isArray(move.location_id) ? move.location_id[1] : '—'}</td>
                  <td>{Array.isArray(move.location_dest_id) ? move.location_dest_id[1] : '—'}</td>
                  <td>{move.reference || '—'}</td>
                  <td>{new Date(move.date).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
