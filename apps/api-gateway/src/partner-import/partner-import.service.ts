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
  OdooService,
  PartnerImportData,
} from '../integrations/odoo/odoo.service';
import { PartnerImportParser } from './partner-import.parser';
import { EtlAuditActor, EtlJobRepository } from '../etl/etl-job.repository';
import { normalizeSpreadsheetSource } from '../etl/spreadsheet-source';
import {
  PartnerImportBatch,
  PartnerImportIssue,
  PartnerImportResponse,
  PartnerImportRow,
  PartnerImportStrategy,
} from './partner-import.types';

const BATCH_TTL_MS = 30 * 60 * 1000;
const MAX_BATCHES = 20;

@Injectable()
export class PartnerImportService {
  private readonly batches = new Map<string, PartnerImportBatch>();

  constructor(
    private readonly parser: PartnerImportParser,
    private readonly odoo: OdooService,
    @Optional() private readonly jobs?: EtlJobRepository,
  ) {}

  async validate(file: Express.Multer.File, actor?: EtlAuditActor): Promise<PartnerImportResponse> {
    this.cleanExpired();
    if (!file) throw new BadRequestException('Sélectionnez un fichier XLSX ou CSV.');
    if (!/\.(xlsx|csv)$/.test(file.originalname.toLowerCase())) {
      throw new BadRequestException('Seuls les fichiers .xlsx et .csv sont acceptés.');
    }
    const source = await normalizeSpreadsheetSource(file);
    const parsed = await this.parser.parse(source);
    const createdAt = new Date();
    const batch: PartnerImportBatch = {
      id: randomUUID(),
      fileName: file.originalname,
      createdAt,
      expiresAt: new Date(createdAt.getTime() + BATCH_TTL_MS),
      status: 'validated',
      analyzedRows: parsed.analyzedRows,
      rows: parsed.rows,
      issues: parsed.issues,
      results: parsed.rows.map((row) => ({
        row: row.rowNumber,
        externalRef: row.externalRef,
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

  async execute(batchId: string, actor?: EtlAuditActor): Promise<PartnerImportResponse> {
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
    if (batch.status === 'completed') return this.toResponse(batch);
    batch.status = 'importing';
    await this.persist(batch, 'IMPORT_STARTED', actor);
    let failed = false;
    const selectedRows = batch.retryFailedOnly
      ? batch.rows.filter((row) => batch.results.some((result) => result.row === row.rowNumber && result.status === 'failed'))
      : batch.rows;
    for (const row of selectedRows) {
      try {
        const imported = await this.odoo.importPartner(toOdooPartner(row));
        const result = batch.results.find(
          (item) => item.row === row.rowNumber,
        );
        if (result) {
          result.status = imported.action;
          result.message =
            imported.action === 'created'
              ? 'Partenaire créé dans Odoo.'
              : imported.action === 'updated'
                ? 'Partenaire mis à jour dans Odoo.'
                : 'Aucune modification détectée.';
        }
      } catch (cause) {
        failed = true;
        const message =
          cause instanceof Error
            ? cause.message
            : 'Erreur Odoo non identifiée.';
        const result = batch.results.find(
          (item) => item.row === row.rowNumber,
        );
        if (result) {
          result.status = 'failed';
          result.message = message;
        }
        batch.issues.push({
          row: row.rowNumber,
          field: 'import',
          severity: 'error',
          code: 'ODOO_IMPORT_FAILED',
          message,
        });
      }
    }
    batch.status = failed ? 'failed' : 'completed';
    batch.retryFailedOnly = false;
    await this.persist(batch, failed ? 'IMPORT_FAILED' : 'IMPORT_COMPLETED', actor);
    return this.toResponse(batch);
  }

  async dryRun(batchId: string, requestedStrategy?: string, actor?: EtlAuditActor): Promise<PartnerImportResponse> {
    const batch = await this.getBatch(batchId);
    batch.issues = batch.issues.filter((issue) => issue.code !== 'STRATEGY_CONFLICT');
    if (batch.issues.some((issue) => issue.severity === 'error')) {
      throw new BadRequestException('Corrigez toutes les erreurs avant le dry run.');
    }
    const strategy = parsePartnerImportStrategy(requestedStrategy);
    const existing = await this.odoo.findPartnerReferences(batch.rows.map((row) => row.externalRef));
    for (const result of batch.results) {
      const exists = existing.has(result.externalRef);
      const conflict = strategy === 'CREATE_ONLY' ? exists : strategy === 'UPDATE_ONLY' ? !exists : false;
      result.status = conflict ? 'failed' : exists ? 'updated' : 'created';
      result.message = conflict
        ? strategy === 'CREATE_ONLY' ? 'Création impossible : cette référence existe déjà.' : 'Mise à jour impossible : cette référence est absente.'
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

  async retry(batchId: string, actor?: EtlAuditActor): Promise<PartnerImportResponse> {
    const batch = await this.getBatch(batchId);
    if (batch.status !== 'failed') throw new BadRequestException('Seul un import en échec peut être relancé.');
    batch.issues = batch.issues.filter((issue) => issue.code !== 'ODOO_IMPORT_FAILED');
    batch.retryFailedOnly = true;
    batch.status = 'dry_run';
    await this.persist(batch, 'RETRY_STARTED', actor);
    return this.execute(batchId, actor);
  }

  async createReport(batchId: string): Promise<Buffer> {
    const batch = await this.getBatch(batchId);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'IMANA Signature';
    const summary = workbook.addWorksheet('Synthèse', {
      views: [{ showGridLines: false }],
    });
    const details = workbook.addWorksheet('Partenaires', {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
    });
    const issues = workbook.addWorksheet('Erreurs et anomalies', {
      views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
    });
    const response = this.toResponse(batch);
    summary.addRows([
      ['RAPPORT D’IMPORT PARTENAIRES IMANA', ''],
      ['Fichier', batch.fileName],
      ['Lot', batch.id],
      ['Statut', batch.status],
      ['', ''],
      ['Lignes analysées', response.summary.totalRows],
      ['Lignes valides', response.summary.validRows],
      ['Erreurs', response.summary.errors],
      ['Avertissements', response.summary.warnings],
      ['Créations', response.summary.created],
      ['Mises à jour', response.summary.updated],
      ['Ignorés', response.summary.ignored],
      ['Échecs', response.summary.failed],
    ]);
    summary.mergeCells('A1:B1');
    summary.getCell('A1').font = {
      bold: true,
      color: { argb: 'FFFFFFFF' },
      size: 15,
    };
    summary.getCell('A1').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF111827' },
    };
    summary.getRow(1).height = 28;
    summary.getColumn(1).width = 25;
    summary.getColumn(2).width = 48;

    details.columns = [
      { header: 'Ligne', key: 'row', width: 10 },
      { header: 'Référence', key: 'ref', width: 24 },
      { header: 'Nom', key: 'name', width: 32 },
      { header: 'Type', key: 'type', width: 16 },
      { header: 'Entité', key: 'entity', width: 16 },
      { header: 'E-mail', key: 'email', width: 32 },
      { header: 'Segment client', key: 'customerSegment', width: 22 },
      { header: 'Segment fournisseur', key: 'supplierSegment', width: 24 },
      { header: 'Résultat', key: 'status', width: 16 },
      { header: 'Message', key: 'message', width: 46 },
    ];
    for (const row of batch.rows) {
      const result = batch.results.find((item) => item.row === row.rowNumber);
      details.addRow({
        row: row.rowNumber,
        ref: row.externalRef,
        name: row.name,
        type: row.partnerType,
        entity: row.companyType,
        email: row.email ?? '',
        customerSegment: row.customerSegment ?? '',
        supplierSegment: row.supplierSegment ?? '',
        status: result?.status ?? 'ready',
        message: result?.message ?? '',
      });
    }
    issues.columns = [
      { header: 'Sévérité', key: 'severity', width: 16 },
      { header: 'Ligne', key: 'row', width: 10 },
      { header: 'Champ', key: 'field', width: 24 },
      { header: 'Code', key: 'code', width: 28 },
      { header: 'Description', key: 'message', width: 72 },
    ];
    batch.issues.forEach((current) => issues.addRow(current));
    styleSheet(details);
    styleSheet(issues);
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private async getBatch(batchId: string): Promise<PartnerImportBatch> {
    this.cleanExpired();
    const batch = this.batches.get(batchId) ?? await this.jobs?.load<PartnerImportBatch>(batchId, 'partner');
    if (!batch) {
      throw new NotFoundException(
        'Ce lot est introuvable ou a expiré. Validez de nouveau le fichier.',
      );
    }
    return batch;
  }

  private async persist(batch: PartnerImportBatch, event: string, actor?: EtlAuditActor): Promise<void> {
    await this.jobs?.save('partner', batch, event, actor);
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [id, batch] of this.batches) {
      if (batch.expiresAt.getTime() <= now) this.batches.delete(id);
    }
  }

  private toResponse(batch: PartnerImportBatch): PartnerImportResponse {
    const errors = batch.issues.filter(
      (issue) => issue.severity === 'error',
    ).length;
    const warnings = batch.issues.filter(
      (issue) => issue.severity === 'warning',
    ).length;
    const invalidRows = new Set(
      batch.issues
        .filter((issue) => issue.severity === 'error' && issue.row > 0)
        .map((issue) => issue.row),
    ).size;
    return {
      batchId: batch.id,
      fileName: batch.fileName,
      status: batch.status,
      expiresAt: batch.expiresAt.toISOString(),
      summary: {
        totalRows: batch.analyzedRows,
        validRows: Math.max(0, batch.rows.length - invalidRows),
        errors,
        warnings,
        created: countStatus(batch, 'created'),
        updated: countStatus(batch, 'updated'),
        ignored: countStatus(batch, 'ignored'),
        failed: countStatus(batch, 'failed'),
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

function parsePartnerImportStrategy(value?: string): PartnerImportStrategy {
  if (!value || value === 'UPSERT') return 'UPSERT';
  if (value === 'CREATE_ONLY' || value === 'UPDATE_ONLY') return value;
  throw new BadRequestException('Stratégie d’import invalide.');
}

function toOdooPartner(row: PartnerImportRow): PartnerImportData {
  return {
    externalRef: row.externalRef,
    partnerType: row.partnerType,
    name: row.name,
    companyType: row.companyType,
    email: row.email,
    phone: row.phone,
    mobile: row.mobile,
    vat: row.vat,
    street: row.street,
    street2: row.street2,
    city: row.city,
    zip: row.zip,
    countryCode: row.countryCode,
    language: row.language,
    customerSegment: row.customerSegment,
    supplierSegment: row.supplierSegment,
    tags: row.tags,
    active: row.active,
  };
}

function countStatus(
  batch: PartnerImportBatch,
  status: PartnerImportBatch['results'][number]['status'],
): number {
  return batch.results.filter((result) => result.status === status).length;
}

function styleSheet(sheet: ExcelJS.Worksheet): void {
  const header = sheet.getRow(1);
  header.height = 24;
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  header.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF6D5DFC' },
  };
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: sheet.columnCount },
  };
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.alignment = { vertical: 'top', wrapText: true };
    }
  });
}
