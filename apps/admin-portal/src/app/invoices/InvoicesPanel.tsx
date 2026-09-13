'use client';

import { useAdminList } from '../../lib/useAdminList';

interface OdooInvoice {
  id: number;
  name: string;
  invoice_date: string | false;
  amount_total: number;
  state: string;
  payment_state: string;
  partner_id: [number, string] | false;
}

const money = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 });

export function InvoicesPanel() {
  const { items, loading, error } = useAdminList<OdooInvoice>('/api/admin/invoices');

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Odoo</p>
          <h2>Factures client</h2>
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
                <th>Date</th>
                <th>Client</th>
                <th>Total</th>
                <th>Statut</th>
                <th>Paiement</th>
              </tr>
            </thead>
            <tbody>
              {items.map((invoice) => (
                <tr key={invoice.id}>
                  <td>{invoice.name}</td>
                  <td>{invoice.invoice_date ? new Date(invoice.invoice_date).toLocaleDateString('fr-FR') : '—'}</td>
                  <td>{Array.isArray(invoice.partner_id) ? invoice.partner_id[1] : '—'}</td>
                  <td>{money.format(invoice.amount_total)}</td>
                  <td>{invoice.state}</td>
                  <td>{invoice.payment_state}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
