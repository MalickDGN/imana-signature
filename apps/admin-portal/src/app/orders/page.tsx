import { requireAdminSession } from '../../lib/requireAdminSession';
import { AdminShell } from '../AdminShell';
import { OrdersPanel } from './OrdersPanel';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const { user, apiUrl, apiOnline } = await requireAdminSession();
  return (
    <AdminShell
      active="orders"
      apiOnline={apiOnline}
      apiUrl={apiUrl}
      odooUrl={process.env.ODOO_PUBLIC_URL ?? 'http://localhost:8069'}
      updatedAt={new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}
      environment={process.env.ENVIRONMENT ?? process.env.NODE_ENV ?? 'development'}
      user={user}
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">Commerce</p>
          <h1>Commandes</h1>
          <p className="heading-copy">Commandes Odoo en direct — confirmation et annulation.</p>
        </div>
      </div>
      <OrdersPanel roles={user.roles} />
    </AdminShell>
  );
}
