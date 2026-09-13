export async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, { credentials: 'same-origin', ...options, headers: { 'Content-Type': 'application/json', ...options.headers } });
  const body: unknown = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const error = body && typeof body === 'object' ? body as Record<string, unknown> : {};
    throw new Error(typeof error.error === 'string' ? error.error : typeof error.message === 'string' ? error.message : 'Le service est momentanément indisponible. Réessayez.');
  }
  return body as T;
}
