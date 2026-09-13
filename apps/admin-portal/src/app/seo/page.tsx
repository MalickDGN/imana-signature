import { requireAdminSession } from '../../lib/requireAdminSession';
import { AdminShell } from '../AdminShell';
import { SeoPanel } from './SeoPanel';

export const dynamic = 'force-dynamic';

export default async function SeoPage() {
  const { user, apiUrl, apiOnline } = await requireAdminSession();
  return (
    <AdminShell
      active="seo"
      apiOnline={apiOnline}
      apiUrl={apiUrl}
      odooUrl={process.env.ODOO_PUBLIC_URL ?? 'http://localhost:8069'}
      updatedAt={new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date())}
      environment={process.env.ENVIRONMENT ?? process.env.NODE_ENV ?? 'development'}
      user={user}
    >
      <div className="page-heading">
        <div>
          <p className="eyebrow">Contenu</p>
          <h1>SEO</h1>
          <p className="heading-copy">Articles publiés et produits avec un problème de référencement.</p>
        </div>
      </div>
      <SeoPanel />
    </AdminShell>
  );
}
