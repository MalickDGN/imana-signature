import { BadRequestException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OdooService } from '../integrations/odoo/odoo.service';
import { PartnerImportParser } from './partner-import.parser';
import { PartnerImportService } from './partner-import.service';
import { PartnerImportRow } from './partner-import.types';

const rows: PartnerImportRow[] = [
  {
    rowNumber: 5,
    externalRef: 'CLI-1',
    partnerType: 'client',
    name: 'Awa',
    companyType: 'person',
    email: 'awa@example.com',
    customerSegment: 'VIP',
    tags: ['Newsletter'],
    active: true,
  },
  {
    rowNumber: 6,
    externalRef: 'FOU-1',
    partnerType: 'supplier',
    name: 'Essences',
    companyType: 'company',
    supplierSegment: 'Importateur',
    tags: [],
    active: true,
  },
];

describe('PartnerImportService', () => {
  const parser = { parse: vi.fn() };
  const odoo = { importPartner: vi.fn() };
  let service: PartnerImportService;

  beforeEach(() => {
    vi.clearAllMocks();
    parser.parse.mockResolvedValue({
      analyzedRows: 2,
      rows,
      issues: [],
    });
    odoo.importPartner
      .mockResolvedValueOnce({
        action: 'created',
        partnerId: 1,
        externalRef: 'CLI-1',
      })
      .mockResolvedValueOnce({
        action: 'ignored',
        partnerId: 2,
        externalRef: 'FOU-1',
      });
    service = new PartnerImportService(
      parser as unknown as PartnerImportParser,
      odoo as unknown as OdooService,
    );
  });

  it('validates and imports partner rows with ignored tracking', async () => {
    const validation = await service.validate(createFile());
    expect(validation.canImport).toBe(true);

    const imported = await service.execute(validation.batchId);

    expect(odoo.importPartner).toHaveBeenCalledTimes(2);
    expect(imported.status).toBe('completed');
    expect(imported.summary).toEqual(
      expect.objectContaining({
        created: 1,
        updated: 0,
        ignored: 1,
        failed: 0,
      }),
    );
  });

  it('blocks import when validation errors remain', async () => {
    parser.parse.mockResolvedValue({
      analyzedRows: 1,
      rows: [],
      issues: [
        {
          row: 5,
          field: 'email',
          severity: 'error',
          code: 'INVALID_EMAIL',
          message: 'Adresse invalide.',
        },
      ],
    });
    const validation = await service.validate(createFile());
    await expect(service.execute(validation.batchId)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('generates a detailed Excel report', async () => {
    const validation = await service.validate(createFile());
    const report = await service.createReport(validation.batchId);
    expect(report.subarray(0, 2).toString()).toBe('PK');
    expect(report.byteLength).toBeGreaterThan(1000);
  });
});

function createFile(): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname: 'partenaires.xlsx',
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
