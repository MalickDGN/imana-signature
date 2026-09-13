'use client';

import { useState } from 'react';
import { useAdminList } from '../../lib/useAdminList';

interface OdooOrder {
  id: number;
  name: string;
  date_order: string;
  amount_total: number;
  partner_id: [number, string] | false;
  state: string;
  invoice_status: string;
}

const money = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 });

export function OrdersPanel({ roles }: { roles: string[] }) {
  const [status, setStatus] = useState('');
  const { items, loading, error, reload } = useAdminList<OdooOrder>(
    `/api/admin/orders${status ? `?status=${status}` : ''}`,
  );
  const canWrite = roles.some((role) => ['ADMIN', 'MANAGER', 'COMMERCIAL'].includes(role));

  const act = async (id: number, action: 'confirm' | 'cancel') => {
    await fetch(`/api/admin/orders/${id}/${action}`, { method: 'POST' });
    await reload();
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Odoo</p>
          <h2>Commandes de vente</h2>
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Tous les statuts</option>
          <option value="draft">Brouillon</option>
          <option value="sent">Envoyée</option>
          <option value="sale">Confirmée</option>
          <option value="done">Terminée</option>
          <option value="cancel">Annulée</option>
        </select>
      </div>

      {loading && <div className="module-empty">Chargement…</div>}
      {error && <div className="module-alert is-error">{error}</div>}

      {!loading && !error && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Référence</th>
                <th>Date</th>
                <th>Client</th>
                <th>Total</th>
                <th>Statut</th>
                <th>Facturation</th>
                {canWrite && <th></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((order) => (
                <tr key={order.id}>
                  <td>{order.name}</td>
                  <td>{order.date_order ? new Date(order.date_order).toLocaleDateString('fr-FR') : '—'}</td>
                  <td>{Array.isArray(order.partner_id) ? order.partner_id[1] : '—'}</td>
                  <td>{money.format(order.amount_total)}</td>
                  <td>{order.state}</td>
                  <td>{order.invoice_status}</td>
                  {canWrite && (
                    <td style={{ display: 'flex', gap: '6px' }}>
                      {order.state !== 'sale' && order.state !== 'done' && (
                        <button type="button" className="secondary-action" onClick={() => void act(order.id, 'confirm')}>
                          Confirmer
                        </button>
                      )}
                      {order.state !== 'cancel' && (
                        <button type="button" className="danger-action" onClick={() => void act(order.id, 'cancel')}>
                          Annuler
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
