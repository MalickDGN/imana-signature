'use client';

import { useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  Bell,
  Boxes,
  ChevronRight,
  CircleDollarSign,
  ExternalLink,
  Gauge,
  FileText,
  LayoutDashboard,
  Menu,
  PackageSearch,
  Sheet,
  RefreshCw,
  Search,
  Server,
  Settings,
  ShoppingBag,
  TriangleAlert,
  UserRoundCog,
  Warehouse,
  X,
} from 'lucide-react';
import { CatalogImportPanel } from './CatalogImportPanel';
import { PartnerImportPanel } from './PartnerImportPanel';
import { AnalyticsPanel } from './AnalyticsPanel';
import { CmsPanel } from './CmsPanel';

export interface AdminProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  category?: string;
}

interface AdminDashboardProps {
  apiOnline: boolean;
  apiUrl: string;
  odooUrl: string;
  products: AdminProduct[];
  updatedAt: string;
}

type ChartMode = 'stock' | 'value';

const money = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'XOF',
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat('fr-FR');

export function AdminDashboard({
  apiOnline,
  apiUrl,
  odooUrl,
  products,
  updatedAt,
}: AdminDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [chartMode, setChartMode] = useState<ChartMode>('stock');
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const stats = useMemo(() => {
    const stock = products.reduce((total, product) => total + product.stock, 0);
    const lowStock = products.filter((product) => product.stock <= 5).length;
    const value = products.reduce(
      (total, product) => total + product.price * product.stock,
      0,
    );
    return { stock, lowStock, value };
  }, [products]);

  const chartProducts = useMemo(() => {
    const getValue = (product: AdminProduct) =>
      chartMode === 'stock' ? product.stock : product.stock * product.price;
    return [...products].sort((a, b) => getValue(b) - getValue(a)).slice(0, 7);
  }, [chartMode, products]);

  const maxChartValue = Math.max(
    1,
    ...chartProducts.map((product) =>
      chartMode === 'stock' ? product.stock : product.stock * product.price,
    ),
  );

  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('fr');
    if (!normalizedQuery) return products.slice(0, 6);
    return products
      .filter((product) =>
        `${product.name} ${product.category ?? ''}`
          .toLocaleLowerCase('fr')
          .includes(normalizedQuery),
      )
      .slice(0, 8);
  }, [products, query]);

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="admin-shell">
      <button
        className={`sidebar-scrim ${sidebarOpen ? 'is-visible' : ''}`}
        type="button"
        aria-label="Fermer la navigation"
        onClick={closeSidebar}
      />

      <aside className={`sidebar ${sidebarOpen ? 'is-open' : ''}`}>
        <div className="brand">
          <span className="brand-mark">IS</span>
          <span>
            <strong>IMANA</strong>
            <small>Signature</small>
          </span>
          <button
            className="icon-button sidebar-close"
            type="button"
            aria-label="Fermer le menu"
            onClick={closeSidebar}
          >
            <X size={19} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Navigation principale">
          <p className="nav-label">Pilotage</p>
          <a className="nav-link is-active" href="#dashboard" onClick={closeSidebar}>
            <LayoutDashboard size={19} />
            Tableau de bord
          </a>
          <a className="nav-link" href="#catalogue" onClick={closeSidebar}>
            <ShoppingBag size={19} />
            Catalogue
            <span className="nav-count">{products.length}</span>
          </a>
          <a className="nav-link" href="#stock" onClick={closeSidebar}>
            <Warehouse size={19} />
            Stock
            {stats.lowStock > 0 && (
              <span className="nav-alert">{stats.lowStock}</span>
            )}
          </a>
          <a className="nav-link" href="#catalog-import" onClick={closeSidebar}>
            <Sheet size={19} />
            Import Excel
          </a>
          <a className="nav-link" href="#partner-import" onClick={closeSidebar}>
            <UserRoundCog size={19} />
            Import partenaires
          </a>
          <a className="nav-link" href="#analytics" onClick={closeSidebar}>
            <BarChart3 size={19} />
            SEO & Marketing
          </a>
          <a className="nav-link" href="#cms" onClick={closeSidebar}>
            <FileText size={19} />
            CMS
          </a>

          <p className="nav-label">Services</p>
          <a className="nav-link" href={odooUrl} target="_blank" rel="noreferrer">
            <Boxes size={19} />
            Odoo ERP
            <ExternalLink className="nav-end" size={15} />
          </a>
          <a
            className="nav-link"
            href={`${apiUrl}/api/healthz`}
            target="_blank"
            rel="noreferrer"
          >
            <Server size={19} />
            API Gateway
            <ExternalLink className="nav-end" size={15} />
          </a>
          <a className="nav-link" href="#settings" onClick={closeSidebar}>
            <Settings size={19} />
            Paramètres
          </a>
        </nav>

        <div className="sidebar-status">
          <span className={`status-dot ${apiOnline ? 'is-online' : ''}`} />
          <div>
            <strong>{apiOnline ? 'Système opérationnel' : 'Service dégradé'}</strong>
            <small>Contrôle {updatedAt}</small>
          </div>
        </div>
      </aside>

      <div className="admin-main">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            type="button"
            aria-label="Ouvrir le menu"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={21} />
          </button>

          <label className="global-search">
            <Search size={18} />
            <span className="sr-only">Rechercher dans le catalogue</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un produit..."
            />
          </label>

          <div className="topbar-actions">
            <span className="environment-pill">Local</span>
            <div className="notification-wrap">
              <button
                className="icon-button"
                type="button"
                aria-label="Afficher les notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}
              >
                <Bell size={19} />
                {stats.lowStock > 0 && <span className="notification-badge" />}
              </button>
              {notificationsOpen && (
                <div className="notification-panel">
                  <strong>Alertes opérationnelles</strong>
                  <p>
                    {stats.lowStock > 0
                      ? `${stats.lowStock} produit(s) ont un stock inférieur ou égal à 5.`
                      : 'Aucune alerte de stock.'}
                  </p>
                  <a href="#catalogue" onClick={() => setNotificationsOpen(false)}>
                    Voir le catalogue <ChevronRight size={15} />
                  </a>
                </div>
              )}
            </div>
            <div className="profile">
              <span>IA</span>
              <div>
                <strong>Imana Admin</strong>
                <small>Administrateur</small>
              </div>
            </div>
          </div>
        </header>

        <main id="dashboard" className="dashboard-content">
          <div className="page-heading">
            <div>
              <p className="eyebrow">Vue d’ensemble</p>
              <h1>Bonjour, équipe IMANA</h1>
              <p className="heading-copy">
                Suivi du catalogue, des stocks et des services connectés.
              </p>
            </div>
            <div className="heading-actions">
              <span className="last-sync">
                <RefreshCw size={15} />
                Actualisé à {updatedAt}
              </span>
              <a className="primary-action" href={odooUrl} target="_blank" rel="noreferrer">
                Ouvrir Odoo
                <ExternalLink size={16} />
              </a>
            </div>
          </div>

          <section className="metrics-grid" aria-label="Indicateurs catalogue">
            <MetricCard
              icon={<ShoppingBag size={21} />}
              label="Produits actifs"
              value={number.format(products.length)}
              detail="Synchronisés depuis Odoo"
              tone="blue"
            />
            <MetricCard
              icon={<Warehouse size={21} />}
              label="Unités en stock"
              value={number.format(stats.stock)}
              detail="Stock disponible cumulé"
              tone="cyan"
            />
            <MetricCard
              icon={<TriangleAlert size={21} />}
              label="Stocks faibles"
              value={number.format(stats.lowStock)}
              detail="Seuil inférieur ou égal à 5"
              tone={stats.lowStock > 0 ? 'amber' : 'green'}
            />
            <MetricCard
              icon={<CircleDollarSign size={21} />}
              label="Valeur catalogue"
              value={money.format(stats.value)}
              detail="Prix public × stock"
              tone="violet"
            />
          </section>

          <CatalogImportPanel />
          <PartnerImportPanel />
          <AnalyticsPanel />
          <CmsPanel />

          <section className="overview-grid" id="stock">
            <div className="panel chart-panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Analyse catalogue</p>
                  <h2>Répartition des produits</h2>
                </div>
                <div className="segmented-control" aria-label="Mesure du graphique">
                  <button
                    type="button"
                    className={chartMode === 'stock' ? 'is-selected' : ''}
                    onClick={() => setChartMode('stock')}
                  >
                    Stock
                  </button>
                  <button
                    type="button"
                    className={chartMode === 'value' ? 'is-selected' : ''}
                    onClick={() => setChartMode('value')}
                  >
                    Valeur
                  </button>
                </div>
              </div>

              {chartProducts.length > 0 ? (
                <div className="bar-chart">
                  {chartProducts.map((product) => {
                    const value =
                      chartMode === 'stock'
                        ? product.stock
                        : product.stock * product.price;
                    return (
                      <div className="bar-row" key={product.id}>
                        <span className="bar-label" title={product.name}>
                          {product.name}
                        </span>
                        <div className="bar-track">
                          <span
                            className="bar-value"
                            style={{ width: `${Math.max(4, (value / maxChartValue) * 100)}%` }}
                          />
                        </div>
                        <strong>
                          {chartMode === 'stock' ? number.format(value) : money.format(value)}
                        </strong>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState />
              )}
            </div>

            <aside className="panel service-panel" aria-labelledby="services-title">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Infrastructure</p>
                  <h2 id="services-title">État des services</h2>
                </div>
                <Gauge size={22} />
              </div>
              <ServiceRow
                label="API Gateway"
                detail="/api/healthz"
                online={apiOnline}
              />
              <ServiceRow
                label="Odoo ERP"
                detail="Catalogue et stock"
                online={apiOnline && products.length > 0}
              />
              <ServiceRow
                label="Portail admin"
                detail="Interface Next.js"
                online
              />
              <a
                className="secondary-action"
                href={`${apiUrl}/api/healthz`}
                target="_blank"
                rel="noreferrer"
              >
                Consulter le diagnostic
                <ExternalLink size={15} />
              </a>
            </aside>
          </section>

          <section className="panel catalogue-panel" id="catalogue">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Catalogue Odoo</p>
                <h2>Produits et disponibilité</h2>
              </div>
              <span className="result-count">{visibleProducts.length} affiché(s)</span>
            </div>

            {visibleProducts.length > 0 ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>Produit</th>
                      <th>Catégorie</th>
                      <th>Prix</th>
                      <th>Stock</th>
                      <th>État</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProducts.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <span className="product-cell">
                            <span className="product-icon">
                              <PackageSearch size={18} />
                            </span>
                            <span>
                              <strong>{product.name}</strong>
                              <small>Réf. {product.id}</small>
                            </span>
                          </span>
                        </td>
                        <td>{product.category ?? 'Non classé'}</td>
                        <td>{money.format(product.price)}</td>
                        <td>{number.format(product.stock)}</td>
                        <td>
                          <StockBadge stock={product.stock} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState search={Boolean(query)} />
            )}
          </section>

          <section className="quick-actions" id="settings">
            <div>
              <span className="quick-icon">
                <Boxes size={21} />
              </span>
              <div>
                <strong>Gérer le catalogue</strong>
                <small>Produits, prix, catégories et inventaire</small>
              </div>
              <a href={odooUrl} target="_blank" rel="noreferrer" aria-label="Ouvrir Odoo">
                <ChevronRight size={19} />
              </a>
            </div>
            <div>
              <span className="quick-icon">
                <Activity size={21} />
              </span>
              <div>
                <strong>Vérifier l’API</strong>
                <small>État du gateway et connectivité Odoo</small>
              </div>
              <a
                href={`${apiUrl}/api/healthz`}
                target="_blank"
                rel="noreferrer"
                aria-label="Vérifier l’API"
              >
                <ChevronRight size={19} />
              </a>
            </div>
          </section>

          <footer className="admin-footer">
            <span>© 2026 IMANA Signature</span>
            <span>Administration connectée à Odoo</span>
          </footer>
        </main>
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  tone: string;
}) {
  return (
    <article className="metric-card">
      <span className={`metric-icon tone-${tone}`}>{icon}</span>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
    </article>
  );
}

function ServiceRow({
  label,
  detail,
  online,
}: {
  label: string;
  detail: string;
  online: boolean;
}) {
  return (
    <div className="service-row">
      <span className={`service-icon ${online ? 'is-online' : ''}`}>
        <Server size={18} />
      </span>
      <div>
        <strong>{label}</strong>
        <small>{detail}</small>
      </div>
      <span className={`service-state ${online ? 'is-online' : ''}`}>
        {online ? 'En ligne' : 'Indisponible'}
      </span>
    </div>
  );
}

function StockBadge({ stock }: { stock: number }) {
  const state = stock <= 0 ? 'out' : stock <= 5 ? 'low' : 'ok';
  const label = state === 'out' ? 'Rupture' : state === 'low' ? 'Stock faible' : 'Disponible';
  return <span className={`stock-badge is-${state}`}>{label}</span>;
}

function EmptyState({ search = false }: { search?: boolean }) {
  return (
    <div className="empty-state">
      <PackageSearch size={28} />
      <strong>{search ? 'Aucun produit trouvé' : 'Catalogue indisponible'}</strong>
      <p>
        {search
          ? 'Modifiez les termes de recherche.'
          : 'Vérifiez la connexion API et Odoo.'}
      </p>
    </div>
  );
}
