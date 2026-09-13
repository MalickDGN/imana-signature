'use client';

import { useAdminList } from '../../lib/useAdminList';

interface OdooDelivery {
  id: number;
  name: string;
  partner_id: [number, string] | false;
  state: string;
  scheduled_date: string | false;
  origin: string | false;
}

export function DeliveriesPanel() {
  const { items, loading, error } = useAdminList<OdooDelivery>('/api/admin/deliveries');

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Odoo</p>
          <h2>Bons de livraison</h2>
        </div>
      </div>

      {loading && <div className="module-empty">Chargement…</div>}
      {error && <div className="module-alert is-error">{error}</div>}

      {!loading && !error && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Client</th>
                <th>Origine</th>
                <th>Date prévue</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {items.map((delivery) => (
                <tr key={delivery.id}>
                  <td>{delivery.name}</td>
                  <td>{Array.isArray(delivery.partner_id) ? delivery.partner_id[1] : '—'}</td>
                  <td>{delivery.origin || '—'}</td>
                  <td>{delivery.scheduled_date ? new Date(delivery.scheduled_date).toLocaleDateString('fr-FR') : '—'}</td>
                  <td>{delivery.state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
