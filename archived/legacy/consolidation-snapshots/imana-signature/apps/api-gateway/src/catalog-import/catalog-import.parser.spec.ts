import ExcelJS from 'exceljs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CatalogImportParser } from './catalog-import.parser';
import { CATALOG_HEADERS } from './catalog-import.types';

describe('CatalogImportParser', () => {
  const parser = new CatalogImportParser();

  it('parses simple products and a consistent variant group', async () => {
    const buffer = await createWorkbook([
      [
        'SKU-SIMPLE',
        'Ambre',
        'Niche',
        'Description',
        68000,
        20,
        'simple',
        '',
        '',
        '',
        '',
        'OUI',
      ],
      [
        'SKU-ROSE-50',
        'Rose',
        'Niche',
        '',
        95000,
        12,
        'variante',
        'ROSE',
        'Volume=50 ml',
        '',
        '',
        'OUI',
      ],
      [
        'SKU-ROSE-100',
        'Rose',
        'Niche',
        '',
        95000,
        8,
        'variante',
        'ROSE',
        'Volume=100 ml',
        '',
        '',
        'OUI',
      ],
    ]);

    const result = await parser.parse(buffer);

    expect(result.analyzedRows).toBe(3);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[1]).toEqual(
      expect.objectContaining({
        productType: 'variant',
        variantGroup: 'ROSE',
        attributes: { Volume: '50 ml' },
      }),
    );
    expect(result.issues.filter((issue) => issue.severity === 'error')).toHaveLength(0);
    expect(
      result.issues.filter((issue) => issue.code === 'IMAGE_MISSING'),
    ).toHaveLength(3);
  });

  it('blocks duplicate references and inconsistent variant groups', async () => {
    const buffer = await createWorkbook([
      [
        'SKU-DUP',
        'Rose',
        'Niche',
        '',
        95000,
        5,
        'variante',
        'ROSE',
        'Volume=50 ml',
        '',
        '',
        'OUI',
      ],
      [
        'SKU-DUP',
        'Rose différente',
        'Designers',
        '',
        99000,
        5,
        'variante',
        'ROSE',
        'Volume=50 ml',
        '',
        '',
        'OUI',
      ],
    ]);

    const result = await parser.parse(buffer);
    const codes = result.issues.map((issue) => issue.code);

    expect(codes).toContain('DUPLICATE_SKU');
    expect(codes).toContain('INCONSISTENT_VARIANT_GROUP');
    expect(codes).toContain('DUPLICATE_COMBINATION');
  });

  it('reports missing required columns without parsing data rows', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Produits');
    sheet.addRow(['reference_interne', 'nom_produit']);
    sheet.addRow(['SKU-1', 'Produit']);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const result = await parser.parse(buffer);

    expect(result.rows).toHaveLength(0);
    expect(result.issues.some((issue) => issue.code === 'MISSING_COLUMN')).toBe(true);
  });

  it('keeps the downloadable Admin template compatible with the parser', async () => {
    const template = await readFile(
      resolve(
        process.cwd(),
        '../admin-portal/public/templates/modele-import-catalogue-imana.xlsx',
      ),
    );
    const result = await parser.parse(template);

    expect(result.analyzedRows).toBe(3);
    expect(result.issues.filter((issue) => issue.severity === 'error')).toHaveLength(0);
  });
});

async function createWorkbook(rows: unknown[][]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Produits');
  sheet.addRow([...CATALOG_HEADERS]);
  rows.forEach((row) => sheet.addRow(row));
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
