'use client';

import { useAdminList } from '../../lib/useAdminList';

interface TransactionRow {
  id: string;
  order_id: number;
  provider: string;
  amount_fcfa: string;
  status: string;
  customer_phone: string | null;
  created_at: string;
}

const money = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 });

export function TransactionsPanel() {
  const { items, loading, error } = useAdminList<TransactionRow>('/api/admin/transactions');

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Suivi</p>
          <h2>Transactions récentes</h2>
        </div>
      </div>

      {loading && <div className="module-empty">Chargement…</div>}
      {error && <div className="module-alert is-error">{error}</div>}

      {!loading && !error && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Commande</th>
                <th>Fournisseur</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Téléphone</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>#{row.order_id}</td>
                  <td>{row.provider}</td>
                  <td>{money.format(Number(row.amount_fcfa))}</td>
                  <td>{row.status}</td>
                  <td>{row.customer_phone ?? '—'}</td>
                  <td>{new Date(row.created_at).toLocaleString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
