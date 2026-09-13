import { requireAdminSession } from '../../lib/requireAdminSession';
import { AdminShell } from '../AdminShell';
import { ProductsEditPanel } from './ProductsEditPanel';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const { user, apiUrl, apiOnline } = await requireAdminSession();
  return (
    <AdminShell
      active="products"
      apiOnline={apiOnline}
      apiUrl={apiUrl}
      odooUrl={process.env.ODOO_PUBLIC_URL ?? 'http://localhost:8069'}
      updatedAt={new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}
      environment={process.env.ENVIRONMENT ?? process.env.NODE_ENV ?? 'development'}
      user={user}
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">Catalogue</p>
          <h1>Produits</h1>
          <p className="heading-copy">
            Prix et disponibilité, écrits directement dans Odoo. La création de produits passe par l’import Excel.
          </p>
        </div>
      </div>
      <ProductsEditPanel apiUrl={apiUrl} />
    </AdminShell>
  );
}
