import { requireAdminSession } from '../../lib/requireAdminSession';
import { AdminShell } from '../AdminShell';
import { AuditLogsPanel } from './AuditLogsPanel';

export const dynamic = 'force-dynamic';

export default async function AuditLogsPage() {
  const { user, apiUrl, apiOnline } = await requireAdminSession();
  return (
    <AdminShell
      active="audit"
      apiOnline={apiOnline}
      apiUrl={apiUrl}
      odooUrl={process.env.ODOO_PUBLIC_URL ?? 'http://localhost:8069'}
      updatedAt={new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}
      environment={process.env.ENVIRONMENT ?? process.env.NODE_ENV ?? 'development'}
      user={user}
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">Conformité</p>
          <h1>Journal d’audit</h1>
          <p className="heading-copy">Actions sensibles effectuées par les comptes administrateurs.</p>
        </div>
      </div>
      <AuditLogsPanel />
    </AdminShell>
  );
}
