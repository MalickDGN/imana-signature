import ExcelJS from 'exceljs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { PartnerImportParser } from './partner-import.parser';
import { PARTNER_HEADERS } from './partner-import.types';

describe('PartnerImportParser', () => {
  const parser = new PartnerImportParser();

  it('parses clients, suppliers and mixed partners with segmentation', async () => {
    const buffer = await createWorkbook([
      [
        'CLI-1',
        'client',
        'Awa',
        'personne',
        'awa@example.com',
        '',
        '',
        '',
        '',
        '',
        'Dakar',
        '',
        'SN',
        'fr_FR',
        'VIP',
        '',
        'Newsletter|Retail',
        'OUI',
      ],
      [
        'FOU-1',
        'fournisseur',
        'Essences SA',
        'société',
        'contact@example.com',
        '',
        '',
        '',
        '',
        '',
        'Paris',
        '',
        'FR',
        'fr_FR',
        '',
        'Importateur',
        'B2B',
        'OUI',
      ],
      [
        'MIX-1',
        'mixte',
        'Concept Store',
        'société',
        '',
        '',
        '',
        '',
        '',
        '',
        'Abidjan',
        '',
        'CI',
        'fr_FR',
        'Revendeur',
        'Distributeur',
        '',
        'OUI',
      ],
    ]);

    const result = await parser.parse(buffer);

    expect(result.analyzedRows).toBe(3);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[1]).toEqual(
      expect.objectContaining({
        partnerType: 'supplier',
        companyType: 'company',
        supplierSegment: 'Importateur',
        tags: ['B2B'],
      }),
    );
    expect(result.rows[2].partnerType).toBe('both');
    expect(result.issues.filter((issue) => issue.severity === 'error')).toHaveLength(0);
  });

  it('reports duplicate references and malformed emails', async () => {
    const buffer = await createWorkbook([
      ['DUP-1', 'client', 'A', 'personne', 'bad-email', '', '', '', '', '', '', '', '', '', '', '', '', 'OUI'],
      ['DUP-1', 'client', 'B', 'personne', '', '', '', '', '', '', '', '', '', '', '', '', '', 'OUI'],
    ]);
    const result = await parser.parse(buffer);
    const codes = result.issues.map((issue) => issue.code);
    expect(codes).toContain('INVALID_EMAIL');
    expect(codes).toContain('DUPLICATE_REFERENCE');
  });

  it('keeps the downloadable partner template compatible with the parser', async () => {
    const template = await readFile(
      resolve(
        process.cwd(),
        '../admin-portal/public/templates/modele-import-partenaires-imana.xlsx',
      ),
    );
    const result = await parser.parse(template);

    expect(result.analyzedRows).toBe(3);
    expect(result.rows).toHaveLength(3);
    expect(result.issues.filter((issue) => issue.severity === 'error')).toHaveLength(0);
  });
});

async function createWorkbook(rows: unknown[][]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Partenaires');
  sheet.addRow([...PARTNER_HEADERS]);
  rows.forEach((row) => sheet.addRow(row));
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
