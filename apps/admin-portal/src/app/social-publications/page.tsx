import { requireAdminSession } from '../../lib/requireAdminSession';
import { AdminShell } from '../AdminShell';
import { SocialPublicationsPanel } from './SocialPublicationsPanel';

export const dynamic = 'force-dynamic';

export default async function SocialPublicationsPage() {
  const { user, apiUrl, apiOnline } = await requireAdminSession();
  return (
    <AdminShell
      active="social"
      apiOnline={apiOnline}
      apiUrl={apiUrl}
      odooUrl={process.env.ODOO_PUBLIC_URL ?? 'http://localhost:8069'}
      updatedAt={new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}
      environment={process.env.ENVIRONMENT ?? process.env.NODE_ENV ?? 'development'}
      user={user}
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">Marketing</p>
          <h1>Publications sociales</h1>
          <p className="heading-copy">Préparez et planifiez des publications pour les réseaux sociaux.</p>
        </div>
      </div>
      <SocialPublicationsPanel />
    </AdminShell>
  );
}
