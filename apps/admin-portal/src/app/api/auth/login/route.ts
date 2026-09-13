import { NextRequest, NextResponse } from 'next/server';

const apiUrl = process.env.API_GATEWAY_URL ?? process.env.API_GATEWAY_PUBLIC_URL ?? 'http://localhost:3101';

export async function POST(request: NextRequest) {
  const response = await fetch(`${apiUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: await request.text(),
    cache: 'no-store',
  }).catch(() => null);
  if (!response) return NextResponse.json({ message: 'Authentification indisponible.' }, { status: 503 });
  const payload = await response.json() as { token?: unknown; user?: unknown; message?: unknown };
  if (!response.ok || typeof payload.token !== 'string') {
    return NextResponse.json({ message: payload.message ?? 'Identifiants invalides.' }, { status: response.status });
  }
  const result = NextResponse.json({ user: payload.user });
  result.cookies.set('imana_admin_session', payload.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 12 * 60 * 60,
  });
  return result;
}
