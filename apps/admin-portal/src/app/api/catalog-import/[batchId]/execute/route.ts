import { proxyCatalogImport } from '../../../../../lib/catalogImportProxy';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ batchId: string }> },
) {
  const { batchId } = await params;
  return proxyCatalogImport(`${encodeURIComponent(batchId)}/execute`, {
    method: 'POST',
  });
}
