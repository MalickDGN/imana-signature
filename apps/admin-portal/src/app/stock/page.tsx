import { requireAdminSession } from '../../lib/requireAdminSession';
import { AdminShell } from '../AdminShell';
import { StockMovementsPanel } from './StockMovementsPanel';

export const dynamic = 'force-dynamic';

export default async function StockPage() {
  const { user, apiUrl, apiOnline } = await requireAdminSession();
  return (
    <AdminShell
      active="stock"
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
          <h1>Mouvements de stock</h1>
          <p className="heading-copy">Historique Odoo — le stock reste géré exclusivement dans Odoo.</p>
        </div>
      </div>
      <StockMovementsPanel />
    </AdminShell>
  );
}
