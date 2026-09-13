import { requireAdminSession } from '../../lib/requireAdminSession';
import { AdminShell } from '../AdminShell';
import { MembersPanel } from './MembersPanel';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const { user, apiUrl, apiOnline } = await requireAdminSession();
  return (
    <AdminShell
      active="members"
      apiOnline={apiOnline}
      apiUrl={apiUrl}
      odooUrl={process.env.ODOO_PUBLIC_URL ?? 'http://localhost:8069'}
      updatedAt={new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}
      environment={process.env.ENVIRONMENT ?? process.env.NODE_ENV ?? 'development'}
      user={user}
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">Clients</p>
          <h1>Membres</h1>
          <p className="heading-copy">Clients Odoo en lecture seule.</p>
        </div>
      </div>
      <MembersPanel />
    </AdminShell>
  );
}
