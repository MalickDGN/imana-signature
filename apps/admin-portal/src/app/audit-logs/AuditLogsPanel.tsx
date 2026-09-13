'use client';

import { useAdminList } from '../../lib/useAdminList';

interface AuditLogRow {
  id: number;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export function AuditLogsPanel() {
  const { items, loading, error } = useAdminList<AuditLogRow>('/api/admin/audit-logs');

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Historique</p>
          <h2>Dernières actions</h2>
        </div>
      </div>

      {loading && <div className="module-empty">Chargement…</div>}
      {error && <div className="module-alert is-error">{error}</div>}

      {!loading && !error && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Auteur</th>
                <th>Action</th>
                <th>Entité</th>
              </tr>
            </thead>
            <tbody>
              {items.map((row) => (
                <tr key={row.id}>
                  <td>{new Date(row.created_at).toLocaleString('fr-FR')}</td>
                  <td>{row.actor_email ?? '—'}</td>
                  <td>{row.action}</td>
                  <td>{row.entity_type}{row.entity_id ? ` #${row.entity_id}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
