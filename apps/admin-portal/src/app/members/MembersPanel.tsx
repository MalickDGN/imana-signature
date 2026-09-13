'use client';

import { useState } from 'react';
import { useAdminList } from '../../lib/useAdminList';

interface OdooPartner {
  id: number;
  name: string;
  email: string | false;
  phone: string | false;
  mobile: string | false;
  city: string | false;
  active: boolean;
}

export function MembersPanel() {
  const [search, setSearch] = useState('');
  const { items, loading, error } = useAdminList<OdooPartner>(
    `/api/admin/members${search ? `?search=${encodeURIComponent(search)}` : ''}`,
  );

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Odoo</p>
          <h2>Clients</h2>
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher un client…"
        />
      </div>

      {loading && <div className="module-empty">Chargement…</div>}
      {error && <div className="module-alert is-error">{error}</div>}

      {!loading && !error && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>E-mail</th>
                <th>Téléphone</th>
                <th>Ville</th>
              </tr>
            </thead>
            <tbody>
              {items.map((partner) => (
                <tr key={partner.id}>
                  <td>{partner.name}</td>
                  <td>{partner.email || '—'}</td>
                  <td>{partner.mobile || partner.phone || '—'}</td>
                  <td>{partner.city || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
