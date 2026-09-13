export const ADMIN_ROLES = [
  'ADMIN',
  'MANAGER',
  'COMMERCIAL',
  'LOGISTICS',
  'ACCOUNTING',
  'SUPPORT',
  'CMS_EDITOR',
  'CMS_REVIEWER',
  'CMS_PUBLISHER',
  'ETL_VIEWER',
  'ETL_OPERATOR',
  'ETL_APPROVER',
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ROLE_SETS = {
  opsRead: [
    'ADMIN',
    'MANAGER',
    'COMMERCIAL',
    'LOGISTICS',
    'ACCOUNTING',
    'SUPPORT',
  ] as AdminRole[],
  cmsRead: [
    'ADMIN',
    'MANAGER',
    'CMS_EDITOR',
    'CMS_REVIEWER',
    'CMS_PUBLISHER',
  ] as AdminRole[],
  cmsWrite: [
    'ADMIN',
    'CMS_EDITOR',
    'CMS_REVIEWER',
    'CMS_PUBLISHER',
  ] as AdminRole[],
  cmsPublish: ['ADMIN', 'CMS_PUBLISHER'] as AdminRole[],
  etlRead: [
    'ADMIN',
    'ETL_VIEWER',
    'ETL_OPERATOR',
    'ETL_APPROVER',
  ] as AdminRole[],
  etlOperate: ['ADMIN', 'ETL_OPERATOR', 'ETL_APPROVER'] as AdminRole[],
  etlApprove: ['ADMIN', 'ETL_APPROVER'] as AdminRole[],
  usersRead: ['ADMIN'] as AdminRole[],
  usersWrite: ['ADMIN'] as AdminRole[],
  auditRead: ['ADMIN'] as AdminRole[],
  ordersRead: ['ADMIN', 'MANAGER', 'COMMERCIAL', 'LOGISTICS'] as AdminRole[],
  ordersWrite: ['ADMIN', 'MANAGER', 'COMMERCIAL'] as AdminRole[],
  transactionsRead: ['ADMIN', 'MANAGER', 'ACCOUNTING'] as AdminRole[],
  invoicesRead: ['ADMIN', 'MANAGER', 'ACCOUNTING'] as AdminRole[],
  deliveriesRead: ['ADMIN', 'MANAGER', 'LOGISTICS'] as AdminRole[],
  deliveriesWrite: ['ADMIN', 'MANAGER', 'LOGISTICS'] as AdminRole[],
  stockRead: ['ADMIN', 'MANAGER', 'LOGISTICS'] as AdminRole[],
  membersRead: ['ADMIN', 'MANAGER', 'COMMERCIAL', 'SUPPORT'] as AdminRole[],
  paymentMethodsRead: ['ADMIN', 'MANAGER', 'ACCOUNTING'] as AdminRole[],
  paymentMethodsWrite: ['ADMIN', 'MANAGER'] as AdminRole[],
  deliveryZonesRead: ['ADMIN', 'MANAGER', 'LOGISTICS'] as AdminRole[],
  deliveryZonesWrite: ['ADMIN', 'MANAGER', 'LOGISTICS'] as AdminRole[],
  productsWrite: ['ADMIN', 'MANAGER', 'COMMERCIAL'] as AdminRole[],
  seoRead: ['ADMIN', 'MANAGER', 'CMS_EDITOR', 'CMS_REVIEWER'] as AdminRole[],
  integrationsRead: ['ADMIN', 'MANAGER'] as AdminRole[],
  socialRead: ['ADMIN', 'MANAGER', 'CMS_PUBLISHER', 'CMS_EDITOR'] as AdminRole[],
  socialWrite: ['ADMIN', 'MANAGER', 'CMS_PUBLISHER'] as AdminRole[],
};

export function hasAnyRole(
  userRoles: readonly string[],
  allowed: readonly AdminRole[],
): boolean {
  return allowed.some((role) => userRoles.includes(role));
}
