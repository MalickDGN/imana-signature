import { proxyAdminImport } from '../../../../../lib/catalogImportProxy';
export async function POST(_request: Request, context: { params: Promise<{ batchId: string }> }) { const { batchId } = await context.params; return proxyAdminImport('partner-import', `${encodeURIComponent(batchId)}/retry`, { method: 'POST' }); }
