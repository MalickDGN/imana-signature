import { requireAdminSession } from '../../lib/requireAdminSession';
import { AdminShell } from '../AdminShell';
import { IntegrationsPanel } from './IntegrationsPanel';

export const dynamic = 'force-dynamic';

export default async function IntegrationsPage() {
  const { user, apiUrl, apiOnline } = await requireAdminSession();
  return (
    <AdminShell
      active="integrations"
      apiOnline={apiOnline}
      apiUrl={apiUrl}
      odooUrl={process.env.ODOO_PUBLIC_URL ?? 'http://localhost:8069'}
      updatedAt={new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}
      environment={process.env.ENVIRONMENT ?? process.env.NODE_ENV ?? 'development'}
      user={user}
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">Infrastructure</p>
          <h1>Intégrations</h1>
          <p className="heading-copy">État de connectivité en direct des services externes.</p>
        </div>
      </div>
      <IntegrationsPanel />
    </AdminShell>
  );
}
