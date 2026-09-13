import { proxyAdminImport } from '../../../../../lib/catalogImportProxy';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  { params }: { params: { batchId: string } },
) {
  return proxyAdminImport(
    'partner-import',
    `${encodeURIComponent(params.batchId)}/execute`,
    { method: 'POST' },
  );
}
