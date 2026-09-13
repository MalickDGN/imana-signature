import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export interface AdminIdentity {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

function isAdminIdentity(value: unknown): value is AdminIdentity {
  if (!value || typeof value !== 'object') return false;
  const user = value as Record<string, unknown>;
  return (
    typeof user.id === 'string' &&
    typeof user.name === 'string' &&
    typeof user.email === 'string' &&
    Array.isArray(user.roles) &&
    user.roles.every((role) => typeof role === 'string')
  );
}

/** Server Component auth gate — replicates the check in app/page.tsx. Redirects to /login on failure. */
export async function requireAdminSession(): Promise<{
  user: AdminIdentity;
  apiUrl: string;
  apiOnline: boolean;
}> {
  const session = (await cookies()).get('imana_admin_session')?.value;
  const apiUrl = process.env.API_GATEWAY_URL ?? process.env.API_GATEWAY_PUBLIC_URL ?? 'http://localhost:3101';
  const importToken = process.env.ADMIN_IMPORT_TOKEN;
  if (!session || !importToken) redirect('/login');

  const identity = await fetch(`${apiUrl}/api/auth/me`, {
    headers: { 'x-admin-session': session, 'x-admin-import-token': importToken },
    cache: 'no-store',
  }).catch(() => null);
  if (!identity?.ok) redirect('/login');

  const identityPayload: unknown = await identity.json();
  if (!isAdminIdentity(identityPayload)) redirect('/login');

  const health = await fetch(`${apiUrl}/api/healthz`, {
    cache: 'no-store',
    signal: AbortSignal.timeout(2500),
  }).catch(() => null);
  const apiOnline = Boolean(health?.ok);

  return { user: identityPayload, apiUrl, apiOnline };
}
