'use client';

import { useState } from 'react';
import { useAdminList } from '../../lib/useAdminList';

interface DeliveryZoneRow {
  id: string;
  name: string;
  price_fcfa: string;
  odoo_shipping_product_id: string | null;
  active: boolean;
  sort_order: number;
}

const money = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 });

export function DeliveryZonesPanel() {
  const { items, loading, error, reload } = useAdminList<DeliveryZoneRow>('/api/admin/delivery-zones');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const create = async (formData: FormData) => {
    setFormError('');
    const response = await fetch('/api/admin/delivery-zones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: String(formData.get('name') ?? ''),
        priceFcfa: Number(formData.get('priceFcfa') ?? 0),
        odooShippingProductId: String(formData.get('odooShippingProductId') ?? '') || undefined,
      }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      setFormError(payload.message ?? 'Création impossible.');
      return;
    }
    setCreating(false);
    await reload();
  };

  const toggleActive = async (row: DeliveryZoneRow) => {
    await fetch(`/api/admin/delivery-zones/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !row.active }),
    });
    await reload();
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Configuration</p>
          <h2>Zones de livraison</h2>
        </div>
        <button type="button" className="primary-action" onClick={() => setCreating((value) => !value)}>
          {creating ? 'Annuler' : 'Ajouter'}
        </button>
      </div>

      {creating && (
        <form className="editor-panel" action={(formData) => void create(formData)}>
          <label>
            Nom
            <input name="name" required />
          </label>
          <label>
            Prix (FCFA)
            <input name="priceFcfa" type="number" min={0} required />
          </label>
          <label>
            ID produit d’expédition Odoo
            <input name="odooShippingProductId" placeholder="ex: 1245" />
          </label>
          {formError && <p className="form-error">{formError}</p>}
          <button type="submit" className="primary-action">Enregistrer</button>
        </form>
      )}

      {loading && <div className="module-empty">Chargement…</div>}
      {error && <div className="module-alert is-error">{error}</div>}

      {!loading && !error && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Prix</th>
                <th>Produit Odoo</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>{row.name}</td>
                  <td>{money.format(Number(row.price_fcfa))}</td>
                  <td>{row.odoo_shipping_product_id || 'Non configuré'}</td>
                  <td>{row.active ? 'Actif' : 'Désactivé'}</td>
                  <td>
                    <button type="button" className="secondary-action" onClick={() => void toggleActive(row)}>
                      {row.active ? 'Désactiver' : 'Activer'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
