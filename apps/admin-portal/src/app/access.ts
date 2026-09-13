export type AdminModule =
  | 'operations'
  | 'analytics'
  | 'etl'
  | 'cms'
  | 'orders'
  | 'transactions'
  | 'invoices'
  | 'deliveries'
  | 'stock'
  | 'members'
  | 'users'
  | 'audit'
  | 'paymentMethods'
  | 'deliveryZones'
  | 'products'
  | 'seo'
  | 'integrations'
  | 'social';

const MODULE_ROLES: Record<AdminModule, readonly string[]> = {
  operations: ['ADMIN', 'MANAGER', 'COMMERCIAL', 'LOGISTICS', 'ACCOUNTING', 'SUPPORT'],
  analytics: ['ADMIN', 'MANAGER', 'COMMERCIAL', 'LOGISTICS', 'ACCOUNTING', 'SUPPORT'],
  etl: ['ADMIN', 'ETL_VIEWER', 'ETL_OPERATOR', 'ETL_APPROVER'],
  cms: ['ADMIN', 'MANAGER', 'CMS_EDITOR', 'CMS_REVIEWER', 'CMS_PUBLISHER'],
  orders: ['ADMIN', 'MANAGER', 'COMMERCIAL', 'LOGISTICS'],
  transactions: ['ADMIN', 'MANAGER', 'ACCOUNTING'],
  invoices: ['ADMIN', 'MANAGER', 'ACCOUNTING'],
  deliveries: ['ADMIN', 'MANAGER', 'LOGISTICS'],
  stock: ['ADMIN', 'MANAGER', 'LOGISTICS'],
  members: ['ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPPORT'],
  users: ['ADMIN'],
  audit: ['ADMIN'],
  paymentMethods: ['ADMIN', 'MANAGER', 'ACCOUNTING'],
  deliveryZones: ['ADMIN', 'MANAGER', 'LOGISTICS'],
  products: ['ADMIN', 'MANAGER', 'COMMERCIAL'],
  seo: ['ADMIN', 'MANAGER', 'CMS_EDITOR', 'CMS_REVIEWER'],
  integrations: ['ADMIN', 'MANAGER'],
  social: ['ADMIN', 'MANAGER', 'CMS_PUBLISHER', 'CMS_EDITOR'],
};

export function canAccessModule(roles: readonly string[], module: AdminModule): boolean {
  return MODULE_ROLES[module].some((role) => roles.includes(role));
}
