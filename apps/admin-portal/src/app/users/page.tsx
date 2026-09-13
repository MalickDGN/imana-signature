import { requireAdminSession } from '../../lib/requireAdminSession';
import { AdminShell } from '../AdminShell';
import { UsersPanel } from './UsersPanel';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const { user, apiUrl, apiOnline } = await requireAdminSession();
  return (
    <AdminShell
      active="users"
      apiOnline={apiOnline}
      apiUrl={apiUrl}
      odooUrl={process.env.ODOO_PUBLIC_URL ?? 'http://localhost:8069'}
      updatedAt={new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}
      environment={process.env.ENVIRONMENT ?? process.env.NODE_ENV ?? 'development'}
      user={user}
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">Administration</p>
          <h1>Utilisateurs</h1>
          <p className="heading-copy">Gérez les comptes du back-office et leurs rôles.</p>
        </div>
      </div>
      <UsersPanel />
    </AdminShell>
  );
}
