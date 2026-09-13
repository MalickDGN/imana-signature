'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Boxes,
  ClipboardList,
  ExternalLink,
  FileText,
  History,
  LayoutDashboard,
  Megaphone,
  Menu,
  Package,
  Receipt,
  Server,
  Settings,
  Sheet,
  ShoppingBag,
  Truck,
  UserRoundCog,
  Users,
  Wallet,
  Warehouse,
  X,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { canAccessModule, type AdminModule } from './access';

export interface AdminShellUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

interface AdminShellProps {
  active: AdminModule;
  apiOnline: boolean;
  apiUrl: string;
  odooUrl: string;
  updatedAt: string;
  environment: string;
  user: AdminShellUser;
  children: React.ReactNode;
}

const NAV_ITEMS: Array<{ module: AdminModule; href: string; label: string; icon: LucideIcon }> = [
  { module: 'operations', href: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { module: 'orders', href: '/orders', label: 'Commandes', icon: ShoppingBag },
  { module: 'transactions', href: '/transactions', label: 'Transactions', icon: Wallet },
  { module: 'invoices', href: '/invoices', label: 'Factures', icon: Receipt },
  { module: 'deliveries', href: '/deliveries', label: 'Livraisons', icon: Truck },
  { module: 'stock', href: '/stock', label: 'Mouvements de stock', icon: Warehouse },
  { module: 'products', href: '/products', label: 'Produits', icon: Package },
  { module: 'members', href: '/members', label: 'Membres', icon: Users },
  { module: 'analytics', href: '/analytics', label: 'SEO & Marketing', icon: BarChart3 },
  { module: 'seo', href: '/seo', label: 'SEO', icon: FileText },
  { module: 'social', href: '/social-publications', label: 'Publications sociales', icon: Megaphone },
  { module: 'cms', href: '/cms', label: 'CMS', icon: FileText },
  { module: 'etl', href: '/catalog-import', label: 'Import Excel', icon: Sheet },
  { module: 'paymentMethods', href: '/payment-methods', label: 'Moyens de paiement', icon: Wallet },
  { module: 'deliveryZones', href: '/delivery-zones', label: 'Zones de livraison', icon: Truck },
  { module: 'users', href: '/users', label: 'Utilisateurs', icon: UserRoundCog },
  { module: 'audit', href: '/audit-logs', label: 'Journal d’audit', icon: History },
  { module: 'integrations', href: '/integrations', label: 'Intégrations', icon: ClipboardList },
];

export function AdminShell({
  active,
  apiOnline,
  apiUrl,
  odooUrl,
  updatedAt,
  environment,
  user,
  children,
}: AdminShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const closeSidebar = () => setSidebarOpen(false);
  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.assign('/login');
  };
  const initials = user.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toLocaleUpperCase('fr') || 'AD';
  const roleLabel = user.roles.includes('ADMIN') ? 'Administrateur' : user.roles.join(', ') || 'Utilisateur';
  const environmentLabel = environment === 'production' ? 'Production' : environment === 'development' ? 'Développement' : environment;

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
          {NAV_ITEMS.filter((item) => canAccessModule(user.roles, item.module)).map((item) => (
            <Link
              key={item.href}
              className={`nav-link ${active === item.module ? 'is-active' : ''}`}
              href={item.href}
              onClick={closeSidebar}
            >
              <item.icon size={19} />
              {item.label}
            </Link>
          ))}

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
          <a className="nav-link" href="#settings">
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

          <div className="topbar-actions" style={{ marginLeft: 'auto' }}>
            <span className="environment-pill">{environmentLabel}</span>
            <ThemeToggle />
            <div className="profile">
              <span>{initials}</span>
              <div>
                <strong>{user.name}</strong>
                <small>{roleLabel}</small>
              </div>
            </div>
            <button className="icon-button" type="button" onClick={() => void logout()} aria-label="Se déconnecter"><X size={18} /></button>
          </div>
        </header>

        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
