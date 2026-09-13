import { proxyAdminImport } from '../../../../lib/catalogImportProxy';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const formData = await request.formData();
  return proxyAdminImport('partner-import', 'validate', {
    method: 'POST',
    body: formData,
  });
}
