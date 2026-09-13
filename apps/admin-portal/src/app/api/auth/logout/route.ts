import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const apiUrl = process.env.API_GATEWAY_URL ?? process.env.API_GATEWAY_PUBLIC_URL ?? 'http://localhost:3101';

export async function POST() {
  const store = await cookies();
  const session = store.get('imana_admin_session')?.value;
  if (session) {
    await fetch(`${apiUrl}/api/auth/logout`, {
      method: 'POST', headers: { 'x-admin-session': session }, cache: 'no-store',
    }).catch(() => undefined);
  }
  const response = NextResponse.json({ closed: true });
  response.cookies.delete('imana_admin_session');
  return response;
}
