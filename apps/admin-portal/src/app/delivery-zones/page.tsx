import { requireAdminSession } from '../../lib/requireAdminSession';
import { AdminShell } from '../AdminShell';
import { DeliveryZonesPanel } from './DeliveryZonesPanel';

export const dynamic = 'force-dynamic';

export default async function DeliveryZonesPage() {
  const { user, apiUrl, apiOnline } = await requireAdminSession();
  return (
    <AdminShell
      active="deliveryZones"
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
          <h1>Zones de livraison</h1>
          <p className="heading-copy">
            Chaque zone doit référencer un produit d’expédition Odoo actif pour être facturable.
          </p>
        </div>
      </div>
      <DeliveryZonesPanel />
    </AdminShell>
  );
}
