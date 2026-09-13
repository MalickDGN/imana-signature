import { BadRequestException, Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { normalizeSpreadsheetNamespace } from '../catalog-import/catalog-import.parser';
import {
  PARTNER_HEADERS,
  PartnerHeader,
  PartnerImportIssue,
  PartnerImportRow,
} from './partner-import.types';

const MAX_ROWS = 5000;

@Injectable()
export class PartnerImportParser {
  async parse(buffer: Buffer): Promise<{
    analyzedRows: number;
    rows: PartnerImportRow[];
    issues: PartnerImportIssue[];
  }> {
    const workbook = new ExcelJS.Workbook();
    try {
      const compatible = await normalizeSpreadsheetNamespace(buffer);
      await workbook.xlsx.load(compatible as unknown as ExcelJS.Buffer);
    } catch {
      throw new BadRequestException(
        'Le fichier ne peut pas être lu comme un classeur Excel .xlsx.',
      );
    }
    const sheet = workbook.getWorksheet('Partenaires');
    if (!sheet) {
      throw new BadRequestException(
        'La feuille obligatoire "Partenaires" est absente.',
      );
    }
    const headerRow = findHeaderRow(sheet);
    const headerIndex = readHeaderIndex(sheet, headerRow);
    const issues: PartnerImportIssue[] = [];
    for (const header of PARTNER_HEADERS) {
      if (!headerIndex.has(header)) {
        issues.push(
          issue(
            headerRow,
            'file',
            'error',
            'MISSING_COLUMN',
            `La colonne obligatoire "${header}" est absente.`,
          ),
        );
      }
    }
    if (issues.length > 0) {
      return { analyzedRows: 0, rows: [], issues };
    }

    if (sheet.rowCount - headerRow > MAX_ROWS) {
      issues.push(
        issue(
          headerRow,
          'file',
          'error',
          'TOO_MANY_ROWS',
          `Le fichier dépasse la limite de ${MAX_ROWS} lignes.`,
        ),
      );
    }
    const rows: PartnerImportRow[] = [];
    let analyzedRows = 0;
    const references = new Map<string, number>();
    const emails = new Map<string, number>();
    const lastRow = Math.min(sheet.rowCount, headerRow + MAX_ROWS);
    for (let rowNumber = headerRow + 1; rowNumber <= lastRow; rowNumber++) {
      const excelRow = sheet.getRow(rowNumber);
      const values = Object.fromEntries(
        PARTNER_HEADERS.map((header) => [
          header,
          excelRow.getCell(headerIndex.get(header)!).text.trim(),
        ]),
      ) as Record<PartnerHeader, string>;
      if (!PARTNER_HEADERS.some((header) => Boolean(values[header]))) continue;
      analyzedRows += 1;
      const reference = values.reference_externe.toLowerCase();
      if (reference) {
        if (references.has(reference)) {
          issues.push(
            issue(
              rowNumber,
              'reference_externe',
              'error',
              'DUPLICATE_REFERENCE',
              `Référence déjà utilisée à la ligne ${references.get(reference)}.`,
            ),
          );
        } else {
          references.set(reference, rowNumber);
        }
      }
      const email = values.email.toLowerCase();
      if (email) {
        if (emails.has(email)) {
          issues.push(
            issue(
              rowNumber,
              'email',
              'warning',
              'DUPLICATE_EMAIL',
              `E-mail également présent à la ligne ${emails.get(email)}.`,
            ),
          );
        } else {
          emails.set(email, rowNumber);
        }
      }
      const parsed = validatePartnerRow(rowNumber, values);
      issues.push(...parsed.issues);
      if (parsed.row) rows.push(parsed.row);
    }
    return { analyzedRows, rows, issues };
  }
}

function findHeaderRow(sheet: ExcelJS.Worksheet): number {
  for (let row = 1; row <= Math.min(10, sheet.rowCount); row++) {
    if (
      (sheet.getRow(row).values as ExcelJS.CellValue[]).some(
        (value) => String(value ?? '').trim() === 'reference_externe',
      )
    ) {
      return row;
    }
  }
  throw new BadRequestException(
    'Impossible de trouver la ligne d’en-tête "reference_externe".',
  );
}

function readHeaderIndex(
  sheet: ExcelJS.Worksheet,
  row: number,
): Map<PartnerHeader, number> {
  const result = new Map<PartnerHeader, number>();
  sheet.getRow(row).eachCell((cell, column) => {
    const header = cell.text.trim() as PartnerHeader;
    if ((PARTNER_HEADERS as readonly string[]).includes(header)) {
      result.set(header, column);
    }
  });
  return result;
}

function validatePartnerRow(
  rowNumber: number,
  values: Record<PartnerHeader, string>,
): { row?: PartnerImportRow; issues: PartnerImportIssue[] } {
  const issues: PartnerImportIssue[] = [];
  for (const field of [
    'reference_externe',
    'type_partenaire',
    'nom',
    'type_entite',
  ] as PartnerHeader[]) {
    if (!values[field]) {
      issues.push(
        issue(rowNumber, field, 'error', 'REQUIRED', 'Valeur obligatoire.'),
      );
    }
  }
  if (
    values.reference_externe &&
    !/^[A-Za-z0-9._-]{2,64}$/.test(values.reference_externe)
  ) {
    issues.push(
      issue(
        rowNumber,
        'reference_externe',
        'error',
        'INVALID_REFERENCE',
        'Utilisez 2 à 64 lettres, chiffres, points, tirets ou underscores.',
      ),
    );
  }
  const rawPartnerType = values.type_partenaire.toLowerCase();
  const partnerType =
    rawPartnerType === 'mixte'
      ? 'both'
      : rawPartnerType === 'fournisseur'
        ? 'supplier'
        : rawPartnerType;
  if (!['client', 'supplier', 'both'].includes(partnerType)) {
    issues.push(
      issue(
        rowNumber,
        'type_partenaire',
        'error',
        'INVALID_PARTNER_TYPE',
        'Valeurs autorisées : client, fournisseur ou mixte.',
      ),
    );
  }
  const rawCompanyType = values.type_entite.toLowerCase();
  const companyType =
    rawCompanyType === 'société' || rawCompanyType === 'societe'
      ? 'company'
      : rawCompanyType === 'personne'
        ? 'person'
        : rawCompanyType;
  if (!['person', 'company'].includes(companyType)) {
    issues.push(
      issue(
        rowNumber,
        'type_entite',
        'error',
        'INVALID_ENTITY_TYPE',
        'Valeurs autorisées : personne ou société.',
      ),
    );
  }
  if (
    values.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)
  ) {
    issues.push(
      issue(
        rowNumber,
        'email',
        'error',
        'INVALID_EMAIL',
        'Adresse e-mail invalide.',
      ),
    );
  }
  if (
    values.code_pays_iso &&
    !/^[A-Za-z]{2}$/.test(values.code_pays_iso)
  ) {
    issues.push(
      issue(
        rowNumber,
        'code_pays_iso',
        'error',
        'INVALID_COUNTRY_CODE',
        'Utilisez un code pays ISO sur 2 lettres, par exemple SN.',
      ),
    );
  }
  if (partnerType === 'client' && !values.segment_client) {
    issues.push(
      issue(
        rowNumber,
        'segment_client',
        'warning',
        'CUSTOMER_SEGMENT_MISSING',
        'Le client sera importé sans segment client.',
      ),
    );
  }
  if (partnerType === 'supplier' && !values.segment_fournisseur) {
    issues.push(
      issue(
        rowNumber,
        'segment_fournisseur',
        'warning',
        'SUPPLIER_SEGMENT_MISSING',
        'Le fournisseur sera importé sans segment fournisseur.',
      ),
    );
  }
  if (
    issues.some((current) => current.severity === 'error')
  ) {
    return { issues };
  }
  return {
    row: {
      rowNumber,
      externalRef: values.reference_externe,
      partnerType: partnerType as PartnerImportRow['partnerType'],
      name: values.nom,
      companyType: companyType as PartnerImportRow['companyType'],
      email: values.email || undefined,
      phone: values.telephone || undefined,
      mobile: values.mobile || undefined,
      vat: values.identifiant_fiscal || undefined,
      street: values.adresse || undefined,
      street2: values.complement_adresse || undefined,
      city: values.ville || undefined,
      zip: values.code_postal || undefined,
      countryCode: values.code_pays_iso.toUpperCase() || undefined,
      language: values.langue || undefined,
      customerSegment: values.segment_client || undefined,
      supplierSegment: values.segment_fournisseur || undefined,
      tags: values.tags
        .split('|')
        .map((tag) => tag.trim())
        .filter(Boolean),
      active: !['non', 'no', '0', 'false'].includes(
        values.actif.toLowerCase(),
      ),
    },
    issues,
  };
}

function issue(
  row: number,
  field: PartnerImportIssue['field'],
  severity: PartnerImportIssue['severity'],
  code: string,
  message: string,
): PartnerImportIssue {
  return { row, field, severity, code, message };
}
