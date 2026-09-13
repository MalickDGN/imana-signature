'use client';

import { useAdminList } from '../../lib/useAdminList';

interface IntegrationStatus {
  name: string;
  status: 'operational' | 'degraded' | 'not_configured';
  configured: boolean;
  detail?: string;
}

const STATUS_LABEL: Record<IntegrationStatus['status'], string> = {
  operational: 'Opérationnel',
  degraded: 'Dégradé',
  not_configured: 'Non configuré',
};

export function IntegrationsPanel() {
  const { items, loading, error, reload } = useAdminList<IntegrationStatus>('/api/admin/integrations');

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Diagnostic</p>
          <h2>Services connectés</h2>
        </div>
        <button type="button" className="secondary-action" onClick={() => void reload()}>Actualiser</button>
      </div>

      {loading && <div className="module-empty">Chargement…</div>}
      {error && <div className="module-alert is-error">{error}</div>}

      {!loading && !error && (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Service</th>
                <th>Statut</th>
                <th>Configuré</th>
                <th>Détail</th>
              </tr>
            </thead>
            <tbody>
              {items.map((integration) => (
                <tr key={integration.name}>
                  <td>{integration.name}</td>
                  <td>
                    <span className={`stock-badge is-${integration.status === 'operational' ? 'ok' : integration.status === 'degraded' ? 'low' : 'out'}`}>
                      {STATUS_LABEL[integration.status]}
                    </span>
                  </td>
                  <td>{integration.configured ? 'Oui' : 'Non'}</td>
                  <td>{integration.detail ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
