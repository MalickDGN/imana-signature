'use client';

import { useState } from 'react';
import { useAdminList } from '../../lib/useAdminList';

interface PaymentMethodRow {
  id: string;
  code: string;
  label: string;
  provider: string;
  collect_at: 'order' | 'delivery';
  active: boolean;
  sort_order: number;
}

export function PaymentMethodsPanel() {
  const { items, loading, error, reload } = useAdminList<PaymentMethodRow>('/api/admin/payment-methods');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const create = async (formData: FormData) => {
    setFormError('');
    const response = await fetch('/api/admin/payment-methods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: String(formData.get('code') ?? ''),
        label: String(formData.get('label') ?? ''),
        provider: String(formData.get('provider') ?? ''),
        collectAt: String(formData.get('collectAt') ?? 'order'),
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

  const toggleActive = async (row: PaymentMethodRow) => {
    await fetch(`/api/admin/payment-methods/${row.id}`, {
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
          <h2>Moyens de paiement</h2>
        </div>
        <button type="button" className="primary-action" onClick={() => setCreating((value) => !value)}>
          {creating ? 'Annuler' : 'Ajouter'}
        </button>
      </div>

      {creating && (
        <form className="editor-panel" action={(formData) => void create(formData)}>
          <label>
            Code (utilisé par le checkout)
            <input name="code" required pattern="[a-z0-9_-]+" placeholder="ex: bank-transfer" />
          </label>
          <label>
            Libellé
            <input name="label" required />
          </label>
          <label>
            Fournisseur
            <input name="provider" required placeholder="ex: bank_transfer" />
          </label>
          <label>
            Encaissement
            <select name="collectAt" defaultValue="order">
              <option value="order">À la commande</option>
              <option value="delivery">À la livraison</option>
            </select>
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
                <th>Code</th>
                <th>Libellé</th>
                <th>Fournisseur</th>
                <th>Encaissement</th>
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>{row.code}</td>
                  <td>{row.label}</td>
                  <td>{row.provider}</td>
                  <td>{row.collect_at === 'order' ? 'Commande' : 'Livraison'}</td>
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
