import { proxyCatalogImport } from '../../../../../lib/catalogImportProxy';

export async function POST(request: Request, context: { params: Promise<{ batchId: string }> }) {
  const { batchId } = await context.params;
  return proxyCatalogImport(`${encodeURIComponent(batchId)}/dry-run`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: await request.text(),
  });
}
