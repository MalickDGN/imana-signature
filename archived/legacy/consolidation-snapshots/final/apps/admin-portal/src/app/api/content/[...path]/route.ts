import { NextRequest } from 'next/server';

const apiUrl =
  process.env.API_GATEWAY_URL ??
  process.env.API_GATEWAY_PUBLIC_URL ??
  'http://localhost:3101';

export async function GET(
  request: NextRequest,
  context: { params: { path: string[] } },
) {
  try {
    const response = await fetch(
      `${apiUrl}/api/content/${context.params.path.join('/')}${request.nextUrl.search}`,
      { cache: 'no-store' },
    );
    return new Response(response.body, {
      status: response.status,
      headers: {
        'content-type':
          response.headers.get('content-type') ?? 'application/octet-stream',
        'cache-control':
          response.headers.get('cache-control') ?? 'public, max-age=3600',
      },
    });
  } catch {
    return Response.json({ message: 'Média indisponible.' }, { status: 503 });
  }
}
