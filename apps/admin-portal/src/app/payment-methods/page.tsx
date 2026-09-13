import { requireAdminSession } from '../../lib/requireAdminSession';
import { AdminShell } from '../AdminShell';
import { PaymentMethodsPanel } from './PaymentMethodsPanel';

export const dynamic = 'force-dynamic';

export default async function PaymentMethodsPage() {
  const { user, apiUrl, apiOnline } = await requireAdminSession();
  return (
    <AdminShell
      active="paymentMethods"
      apiOnline={apiOnline}
      apiUrl={apiUrl}
      odooUrl={process.env.ODOO_PUBLIC_URL ?? 'http://localhost:8069'}
      updatedAt={new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}
      environment={process.env.ENVIRONMENT ?? process.env.NODE_ENV ?? 'development'}
      user={user}
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">Checkout</p>
          <h1>Moyens de paiement</h1>
          <p className="heading-copy">
            Ces options sont lues en direct par le tunnel d’achat — les désactiver les retire immédiatement du checkout.
          </p>
        </div>
      </div>
      <PaymentMethodsPanel />
    </AdminShell>
  );
}
