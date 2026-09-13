import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OdooService } from '../integrations/odoo/odoo.service';
import { CatalogImportParser } from './catalog-import.parser';
import { CatalogImportService } from './catalog-import.service';
import { CatalogImportRow } from './catalog-import.types';

const simpleRow: CatalogImportRow = {
  rowNumber: 5,
  sku: 'SIMPLE-1',
  name: 'Ambre',
  category: 'Niche',
  price: 68000,
  stock: 20,
  productType: 'simple',
  attributes: {},
  active: true,
};

const variantRows: CatalogImportRow[] = [
  {
    rowNumber: 6,
    sku: 'ROSE-50',
    name: 'Rose',
    category: 'Niche',
    price: 95000,
    stock: 10,
    productType: 'variant',
    variantGroup: 'ROSE',
    attributes: { Volume: '50 ml' },
    active: true,
  },
  {
    rowNumber: 7,
    sku: 'ROSE-100',
    name: 'Rose',
    category: 'Niche',
    price: 95000,
    stock: 5,
    productType: 'variant',
    variantGroup: 'ROSE',
    attributes: { Volume: '100 ml' },
    active: true,
  },
];

describe('CatalogImportService', () => {
  const parser = { parse: vi.fn() };
  const odoo = {
    importSimpleProduct: vi.fn(),
    importVariantGroup: vi.fn(),
  };
  let service: CatalogImportService;

  beforeEach(() => {
    vi.clearAllMocks();
    parser.parse.mockResolvedValue({
      analyzedRows: 3,
      rows: [simpleRow, ...variantRows],
      issues: [],
    });
    odoo.importSimpleProduct.mockResolvedValue({
      action: 'created',
      productId: 10,
      sku: simpleRow.sku,
    });
    odoo.importVariantGroup.mockResolvedValue(
      variantRows.map((row, index) => ({
        action: index === 0 ? 'created' : 'updated',
        productId: 20 + index,
        sku: row.sku,
      })),
    );
    service = new CatalogImportService(
      parser as unknown as CatalogImportParser,
      odoo as unknown as OdooService,
    );
  });

  it('validates then executes simple and variant imports', async () => {
    const validation = await service.validate(createFile());
    expect(validation.canImport).toBe(true);
    expect(validation.summary.totalRows).toBe(3);

    const imported = await service.execute(validation.batchId);

    expect(odoo.importSimpleProduct).toHaveBeenCalledOnce();
    expect(odoo.importVariantGroup).toHaveBeenCalledOnce();
    expect(imported.status).toBe('completed');
    expect(imported.summary).toEqual(
      expect.objectContaining({ created: 2, updated: 1, failed: 0 }),
    );
  });

  it('blocks execution when validation contains errors', async () => {
    parser.parse.mockResolvedValue({
      analyzedRows: 1,
      rows: [],
      issues: [
        {
          row: 5,
          field: 'reference_interne',
          severity: 'error',
          code: 'REQUIRED',
          message: 'Valeur obligatoire.',
        },
      ],
    });
    const validation = await service.validate(createFile());

    await expect(service.execute(validation.batchId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(odoo.importSimpleProduct).not.toHaveBeenCalled();
  });

  it('generates an Excel report for a validated batch', async () => {
    const validation = await service.validate(createFile());
    const report = await service.createReport(validation.batchId);

    expect(report.subarray(0, 2).toString()).toBe('PK');
    expect(report.byteLength).toBeGreaterThan(1000);
  });
});

function createFile(): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'catalogue.xlsx',
    encoding: '7bit',
    mimetype:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: 4,
    buffer: Buffer.from('test'),
    stream: undefined as never,
    destination: '',
    filename: '',
    path: '',
  };
}
