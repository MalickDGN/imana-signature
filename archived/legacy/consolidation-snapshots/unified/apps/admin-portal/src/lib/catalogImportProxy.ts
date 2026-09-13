const apiUrl =
  process.env.API_GATEWAY_URL ??
  process.env.API_GATEWAY_PUBLIC_URL ??
  'http://localhost:3101';

export async function proxyCatalogImport(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return proxyAdminImport('catalog-import', path, init);
}

export async function proxyAdminImport(
  resource: 'catalog-import' | 'partner-import',
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = process.env.ADMIN_IMPORT_TOKEN;
  if (!token) {
    return Response.json(
      { message: 'La clé serveur ADMIN_IMPORT_TOKEN n’est pas configurée.' },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(
      `${apiUrl}/api/admin/${resource}/${path}`,
      {
        ...init,
        headers: {
          ...init.headers,
          'x-admin-import-token': token,
        },
        cache: 'no-store',
      },
    );
    return new Response(response.body, {
      status: response.status,
      headers: {
        'content-type':
          response.headers.get('content-type') ?? 'application/json',
        ...(response.headers.get('content-disposition')
          ? {
              'content-disposition':
                response.headers.get('content-disposition')!,
            }
          : {}),
      },
    });
  } catch {
    return Response.json(
      { message: 'Le service d’import catalogue est indisponible.' },
      { status: 503 },
    );
  }
}

export async function proxyAdminModule(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = process.env.ADMIN_IMPORT_TOKEN;
  if (!token) {
    return Response.json(
      { message: 'La clé serveur ADMIN_IMPORT_TOKEN n’est pas configurée.' },
      { status: 503 },
    );
  }

  try {
    const response = await fetch(`${apiUrl}/api/admin/${path}`, {
      ...init,
      headers: {
        ...init.headers,
        'x-admin-import-token': token,
      },
      cache: 'no-store',
    });
    const headers = new Headers();
    headers.set(
      'content-type',
      response.headers.get('content-type') ?? 'application/json',
    );
    const disposition = response.headers.get('content-disposition');
    if (disposition) headers.set('content-disposition', disposition);
    return new Response(response.body, { status: response.status, headers });
  } catch {
    return Response.json(
      { message: 'Le service d’administration est indisponible.' },
      { status: 503 },
    );
  }
}
