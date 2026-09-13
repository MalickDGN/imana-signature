import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import ExcelJS from 'exceljs';
import {
  CatalogImportProduct,
  OdooService,
} from '../integrations/odoo/odoo.service';
import { CatalogImportParser } from './catalog-import.parser';
import { EtlAuditActor, EtlJobRepository } from '../etl/etl-job.repository';
import { normalizeSpreadsheetSource } from '../etl/spreadsheet-source';
import {
  CatalogImportBatch,
  CatalogImportRow,
  ImportBatchResponse,
  ImportIssue,
  ImportStrategy,
} from './catalog-import.types';

const BATCH_TTL_MS = 30 * 60 * 1000;
const MAX_BATCHES = 20;

@Injectable()
export class CatalogImportService {
  private readonly batches = new Map<string, CatalogImportBatch>();

  constructor(
    private readonly parser: CatalogImportParser,
    private readonly odoo: OdooService,
    @Optional() private readonly jobs?: EtlJobRepository,
  ) {}

  async validate(file: Express.Multer.File, actor?: EtlAuditActor): Promise<ImportBatchResponse> {
    this.cleanExpiredBatches();
    if (!file) {
      throw new BadRequestException('Sélectionnez un fichier XLSX ou CSV.');
    }
    if (!/\.(xlsx|csv)$/.test(file.originalname.toLowerCase())) {
      throw new BadRequestException('Seuls les fichiers .xlsx et .csv sont acceptés.');
    }
    const source = await normalizeSpreadsheetSource(file);
    const { analyzedRows, rows, issues } = await this.parser.parse(source);
    const now = new Date();
    const batch: CatalogImportBatch = {
      id: randomUUID(),
      fileName: file.originalname,
      createdAt: now,
      expiresAt: new Date(now.getTime() + BATCH_TTL_MS),
      status: 'validated',
      analyzedRows,
      rows,
      issues,
      results: rows.map((row) => ({
        row: row.rowNumber,
        sku: row.sku,
        status: 'ready',
        message: 'Prêt à importer.',
      })),
    };
    this.batches.set(batch.id, batch);
    await this.persist(batch, 'VALIDATION_COMPLETED', actor);
    while (this.batches.size > MAX_BATCHES) {
      const oldest = this.batches.keys().next().value as string | undefined;
      if (!oldest) break;
      this.batches.delete(oldest);
    }
    return this.toResponse(batch);
  }

  async execute(batchId: string, actor?: EtlAuditActor): Promise<ImportBatchResponse> {
    const batch = await this.getBatch(batchId);
    if (batch.status === 'importing') {
      throw new ConflictException('Cet import est déjà en cours.');
    }
    if (batch.issues.some((issue) => issue.severity === 'error')) {
      throw new BadRequestException(
        'Corrigez toutes les erreurs avant de lancer l’import.',
      );
    }
    if (batch.status !== 'dry_run' && batch.status !== 'completed') {
      throw new BadRequestException('Exécutez et approuvez le dry run avant l’import.');
    }
    if (batch.status === 'completed') {
      return this.toResponse(batch);
    }

    batch.status = 'importing';
    await this.persist(batch, 'IMPORT_STARTED', actor);
    const selectedRows = batch.retryFailedOnly
      ? batch.rows.filter((row) => batch.results.some((result) => result.row === row.rowNumber && result.status === 'failed'))
      : batch.rows;
    const simpleRows = selectedRows.filter((row) => row.productType === 'simple');
    const variantGroups = groupVariants(selectedRows);
    let importFailed = false;

    for (const row of simpleRows) {
      try {
        const result = await this.odoo.importSimpleProduct(toOdooProduct(row));
        setResult(batch, row, result.action, `Produit ${result.action === 'created' ? 'créé' : 'mis à jour'} dans Odoo.`);
      } catch (cause) {
        importFailed = true;
        this.recordImportFailure(batch, [row], cause);
      }
    }

    for (const rows of variantGroups.values()) {
      try {
        const results = await this.odoo.importVariantGroup(
          rows.map(toOdooProduct),
        );
        for (const result of results) {
          const row = rows.find((candidate) => candidate.sku === result.sku);
          if (row) {
            setResult(
              batch,
              row,
              result.action,
              `Variante ${result.action === 'created' ? 'créée' : 'mise à jour'} dans Odoo.`,
            );
          }
        }
      } catch (cause) {
        importFailed = true;
        this.recordImportFailure(batch, rows, cause);
      }
    }

    batch.status = importFailed ? 'failed' : 'completed';
    batch.retryFailedOnly = false;
    await this.persist(batch, importFailed ? 'IMPORT_FAILED' : 'IMPORT_COMPLETED', actor);
    return this.toResponse(batch);
  }

  async dryRun(batchId: string, requestedStrategy?: string, actor?: EtlAuditActor): Promise<ImportBatchResponse> {
    const batch = await this.getBatch(batchId);
    batch.issues = batch.issues.filter((issue) => issue.code !== 'STRATEGY_CONFLICT');
    if (batch.issues.some((issue) => issue.severity === 'error')) {
      throw new BadRequestException('Corrigez toutes les erreurs avant le dry run.');
    }
    const strategy = parseImportStrategy(requestedStrategy);
    const existing = await this.odoo.findProductSkus(batch.rows.map((row) => row.sku));
    for (const result of batch.results) {
      const exists = existing.has(result.sku);
      const conflict = strategy === 'CREATE_ONLY' ? exists : strategy === 'UPDATE_ONLY' ? !exists : false;
      result.status = conflict ? 'failed' : exists ? 'updated' : 'created';
      result.message = conflict
        ? strategy === 'CREATE_ONLY' ? 'Création impossible : ce SKU existe déjà.' : 'Mise à jour impossible : ce SKU est absent.'
        : exists ? 'Mise à jour prévue.' : 'Création prévue.';
      if (conflict) batch.issues.push({
        row: result.row,
        field: 'import',
        severity: 'error',
        code: 'STRATEGY_CONFLICT',
        message: result.message,
      });
    }
    batch.strategy = strategy;
    batch.status = 'dry_run';
    await this.persist(batch, 'DRY_RUN_EXECUTED', actor);
    return this.toResponse(batch);
  }

  async retry(batchId: string, actor?: EtlAuditActor): Promise<ImportBatchResponse> {
    const batch = await this.getBatch(batchId);
    if (batch.status !== 'failed') throw new BadRequestException('Seul un import en échec peut être relancé.');
    batch.issues = batch.issues.filter((issue) => issue.code !== 'ODOO_IMPORT_FAILED');
    batch.retryFailedOnly = true;
    batch.status = 'dry_run';
    await this.persist(batch, 'RETRY_STARTED', actor);
    return this.execute(batchId, actor);
  }

  async get(batchId: string): Promise<ImportBatchResponse> {
    return this.toResponse(await this.getBatch(batchId));
  }

  async createReport(batchId: string): Promise<Buffer> {
    const batch = await this.getBatch(batchId);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'IMANA Signature';
    workbook.created = new Date();
    const summary = workbook.addWorksheet('Synthèse', {
      views: [{ showGridLines: false }],
    });
    const details = workbook.addWorksheet('Détails', {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
    });
    const issues = workbook.addWorksheet('Erreurs et anomalies', {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
    });
    const response = this.toResponse(batch);

    summary.addRows([
      ['RAPPORT D’IMPORT CATALOGUE IMANA', ''],
      ['Fichier', batch.fileName],
      ['Lot', batch.id],
      ['Statut', batch.status],
      ['Créé le', batch.createdAt],
      ['Expire le', batch.expiresAt],
      ['', ''],
      ['Lignes analysées', response.summary.totalRows],
      ['Lignes valides', response.summary.validRows],
      ['Erreurs', response.summary.errors],
      ['Avertissements', response.summary.warnings],
      ['Créations', response.summary.created],
      ['Mises à jour', response.summary.updated],
      ['Échecs import', response.summary.failed],
    ]);
    summary.mergeCells('A1:B1');
    summary.getCell('A1').font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 15 };
    summary.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } };
    summary.getRow(1).height = 28;
    summary.getColumn(1).width = 25;
    summary.getColumn(2).width = 48;
    summary.getColumn(2).numFmt = '#,##0';

    details.columns = [
      { header: 'Ligne', key: 'row', width: 10 },
      { header: 'Référence', key: 'sku', width: 22 },
      { header: 'Nom', key: 'name', width: 34 },
      { header: 'Catégorie', key: 'category', width: 24 },
      { header: 'Type', key: 'type', width: 14 },
      { header: 'Prix FCFA', key: 'price', width: 16 },
      { header: 'Stock', key: 'stock', width: 12 },
      { header: 'Résultat', key: 'status', width: 16 },
      { header: 'Message', key: 'message', width: 48 },
    ];
    for (const row of batch.rows) {
      const result = batch.results.find((item) => item.row === row.rowNumber);
      details.addRow({
        row: row.rowNumber,
        sku: row.sku,
        name: row.name,
        category: row.category,
        type: row.productType,
        price: row.price,
        stock: row.stock,
        status: result?.status ?? 'ready',
        message: result?.message ?? '',
      });
    }
    details.getColumn('price').numFmt = '#,##0';
    details.getColumn('stock').numFmt = '#,##0';

    issues.columns = [
      { header: 'Sévérité', key: 'severity', width: 16 },
      { header: 'Ligne', key: 'row', width: 10 },
      { header: 'Champ', key: 'field', width: 24 },
      { header: 'Code', key: 'code', width: 26 },
      { header: 'Description', key: 'message', width: 72 },
    ];
    for (const issue of batch.issues) issues.addRow(issue);
    styleReportTable(details);
    styleReportTable(issues);

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private async getBatch(batchId: string): Promise<CatalogImportBatch> {
    this.cleanExpiredBatches();
    const batch = this.batches.get(batchId) ?? await this.jobs?.load<CatalogImportBatch>(batchId, 'catalog');
    if (!batch) {
      throw new NotFoundException(
        'Ce lot est introuvable ou a expiré. Validez de nouveau le fichier.',
      );
    }
    return batch;
  }

  private async persist(batch: CatalogImportBatch, event: string, actor?: EtlAuditActor): Promise<void> {
    await this.jobs?.save('catalog', batch, event, actor);
  }

  private cleanExpiredBatches(): void {
    const now = Date.now();
    for (const [id, batch] of this.batches) {
      if (batch.expiresAt.getTime() <= now) this.batches.delete(id);
    }
  }

  private recordImportFailure(
    batch: CatalogImportBatch,
    rows: CatalogImportRow[],
    cause: unknown,
  ): void {
    const message =
      cause instanceof Error ? cause.message : 'Erreur Odoo non identifiée.';
    for (const row of rows) {
      setResult(batch, row, 'failed', message);
      batch.issues.push({
        row: row.rowNumber,
        field: 'import',
        severity: 'error',
        code: 'ODOO_IMPORT_FAILED',
        message,
      });
    }
  }

  private toResponse(batch: CatalogImportBatch): ImportBatchResponse {
    const errors = batch.issues.filter((issue) => issue.severity === 'error').length;
    const warnings = batch.issues.filter((issue) => issue.severity === 'warning').length;
    return {
      batchId: batch.id,
      fileName: batch.fileName,
      status: batch.status,
      expiresAt: batch.expiresAt.toISOString(),
      summary: {
        totalRows: batch.analyzedRows,
        validRows: batch.rows.length - new Set(
          batch.issues
            .filter((issue) => issue.severity === 'error' && issue.row > 0)
            .map((issue) => issue.row),
        ).size,
        errors,
        warnings,
        created: batch.results.filter((result) => result.status === 'created').length,
        updated: batch.results.filter((result) => result.status === 'updated').length,
        failed: batch.results.filter((result) => result.status === 'failed').length,
      },
      issues: batch.issues,
      results: batch.results,
      canImport:
        errors === 0 &&
        batch.rows.length > 0 &&
        batch.status === 'dry_run',
      canDryRun: errors === 0 && batch.rows.length > 0 && batch.status === 'validated',
      strategy: batch.strategy,
    };
  }
}

function parseImportStrategy(value?: string): ImportStrategy {
  if (!value || value === 'UPSERT') return 'UPSERT';
  if (value === 'CREATE_ONLY' || value === 'UPDATE_ONLY') return value;
  throw new BadRequestException('Stratégie d’import invalide.');
}

function groupVariants(
  rows: CatalogImportRow[],
): Map<string, CatalogImportRow[]> {
  const result = new Map<string, CatalogImportRow[]>();
  for (const row of rows) {
    if (row.productType !== 'variant' || !row.variantGroup) continue;
    const group = result.get(row.variantGroup) ?? [];
    group.push(row);
    result.set(row.variantGroup, group);
  }
  return result;
}

function toOdooProduct(row: CatalogImportRow): CatalogImportProduct {
  return {
    sku: row.sku,
    name: row.name,
    category: row.category,
    description: row.description,
    price: row.price,
    stock: row.stock,
    barcode: row.barcode,
    active: row.active,
    attributes: row.attributes,
    variantGroup: row.variantGroup,
    imageBase64: row.image?.buffer.toString('base64'),
  };
}

function setResult(
  batch: CatalogImportBatch,
  row: CatalogImportRow,
  status: 'created' | 'updated' | 'failed',
  message: string,
): void {
  const result = batch.results.find((item) => item.row === row.rowNumber);
  if (result) {
    result.status = status;
    result.message = message;
  }
}

function styleReportTable(worksheet: ExcelJS.Worksheet): void {
  const header = worksheet.getRow(1);
  header.height = 24;
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF6D5DFC' },
  };
  header.alignment = { vertical: 'middle' };
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: worksheet.columnCount },
  };
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: 'top', wrapText: true };
    }
  });
}
