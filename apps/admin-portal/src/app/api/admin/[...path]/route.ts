import { NextRequest } from 'next/server';
import { proxyAdminModule } from '../../../../lib/catalogImportProxy';

type RouteContext = { params: Promise<{ path: string[] }> };

async function forward(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const query = request.nextUrl.search;
  const contentType = request.headers.get('content-type');
  const hasBody = !['GET', 'HEAD'].includes(request.method);
  return proxyAdminModule(`${path.join('/')}${query}`, {
    method: request.method,
    headers: contentType ? { 'content-type': contentType } : undefined,
    body: hasBody ? await request.arrayBuffer() : undefined,
  });
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const DELETE = forward;
