import { requireAdminSession } from '../../lib/requireAdminSession';
import { AdminShell } from '../AdminShell';
import { DeliveriesPanel } from './DeliveriesPanel';

export const dynamic = 'force-dynamic';

export default async function DeliveriesPage() {
  const { user, apiUrl, apiOnline } = await requireAdminSession();
  return (
    <AdminShell
      active="deliveries"
      apiOnline={apiOnline}
      apiUrl={apiUrl}
      odooUrl={process.env.ODOO_PUBLIC_URL ?? 'http://localhost:8069'}
      updatedAt={new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}
      environment={process.env.ENVIRONMENT ?? process.env.NODE_ENV ?? 'development'}
      user={user}
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">Logistique</p>
          <h1>Livraisons</h1>
          <p className="heading-copy">Bons de livraison Odoo en lecture seule.</p>
        </div>
      </div>
      <DeliveriesPanel />
    </AdminShell>
  );
}
