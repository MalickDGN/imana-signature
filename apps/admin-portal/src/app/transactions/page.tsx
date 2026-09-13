import { requireAdminSession } from '../../lib/requireAdminSession';
import { AdminShell } from '../AdminShell';
import { TransactionsPanel } from './TransactionsPanel';

export const dynamic = 'force-dynamic';

export default async function TransactionsPage() {
  const { user, apiUrl, apiOnline } = await requireAdminSession();
  return (
    <AdminShell
      active="transactions"
      apiOnline={apiOnline}
      apiUrl={apiUrl}
      odooUrl={process.env.ODOO_PUBLIC_URL ?? 'http://localhost:8069'}
      updatedAt={new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}
      environment={process.env.ENVIRONMENT ?? process.env.NODE_ENV ?? 'development'}
      user={user}
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">Paiements</p>
          <h1>Transactions</h1>
          <p className="heading-copy">Règlements Wave et espèces enregistrés pour les commandes.</p>
        </div>
      </div>
      <TransactionsPanel />
    </AdminShell>
  );
}
