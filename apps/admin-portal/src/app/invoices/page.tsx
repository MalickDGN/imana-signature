import { requireAdminSession } from '../../lib/requireAdminSession';
import { AdminShell } from '../AdminShell';
import { InvoicesPanel } from './InvoicesPanel';

export const dynamic = 'force-dynamic';

export default async function InvoicesPage() {
  const { user, apiUrl, apiOnline } = await requireAdminSession();
  return (
    <AdminShell
      active="invoices"
      apiOnline={apiOnline}
      apiUrl={apiUrl}
      odooUrl={process.env.ODOO_PUBLIC_URL ?? 'http://localhost:8069'}
      updatedAt={new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}
      environment={process.env.ENVIRONMENT ?? process.env.NODE_ENV ?? 'development'}
      user={user}
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">Comptabilité</p>
          <h1>Factures</h1>
          <p className="heading-copy">Factures client Odoo en lecture seule.</p>
        </div>
      </div>
      <InvoicesPanel />
    </AdminShell>
  );
}
