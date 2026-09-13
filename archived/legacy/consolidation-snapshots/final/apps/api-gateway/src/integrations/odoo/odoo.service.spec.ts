import { Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  OdooClientFactory,
  OdooClientInstance,
  OdooService,
} from './odoo.service';

function createClient(): OdooClientInstance {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    execute_kw: vi.fn(),
  };
}

function createConfig(overrides: Record<string, string> = {}) {
  return new ConfigService({
    ODOO_URL: 'http://odoo:8069',
    ODOO_DB: 'imana',
    ODOO_USERNAME: 'admin',
    ODOO_PASSWORD: 'secret',
    ...overrides,
  });
}

describe('OdooService', () => {
  let client: OdooClientInstance;
  let factory: OdooClientFactory;

  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    client = createClient();
    factory = vi.fn(() => client);
  });

  it('disables the integration when configuration is incomplete', async () => {
    const service = new OdooService(new ConfigService({}), factory);

    await service.onModuleInit();

    expect(factory).not.toHaveBeenCalled();
    await expect(service.findProducts()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('connects using the complete configuration and delegates product searches', async () => {
    vi.mocked(client.execute_kw).mockResolvedValue([
      { id: 12, display_name: 'Parfum' },
    ]);
    const service = new OdooService(createConfig(), factory);

    await service.onModuleInit();
    const products = await service.findProducts(
      [['sale_ok', '=', true]],
      ['display_name'],
    );

    expect(factory).toHaveBeenCalledWith({
      baseUrl: 'http://odoo:8069',
      db: 'imana',
      username: 'admin',
      password: 'secret',
    });
    expect(client.connect).toHaveBeenCalledOnce();
    expect(client.execute_kw).toHaveBeenCalledWith(
      'product.product',
      'search_read',
      [[[['sale_ok', '=', true]]], { fields: ['display_name'] }],
    );
    expect(products).toEqual([{ id: 12, display_name: 'Parfum' }]);
  });

  it('reuses an existing partner and does not create a duplicate', async () => {
    vi.mocked(client.execute_kw).mockResolvedValue([{ id: 55 }]);
    const service = new OdooService(createConfig(), factory);
    await service.onModuleInit();

    await expect(
      service.findOrCreatePartner({
        name: 'Awa Ndiaye',
        email: 'awa@example.com',
      }),
    ).resolves.toBe(55);

    expect(client.execute_kw).toHaveBeenCalledOnce();
  });

  it('creates partners and maps sales order lines to Odoo commands', async () => {
    vi.mocked(client.execute_kw)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(56)
      .mockResolvedValueOnce(124);
    const service = new OdooService(createConfig(), factory);
    await service.onModuleInit();

    const partnerId = await service.findOrCreatePartner({
      name: 'Awa Ndiaye',
      email: 'awa@example.com',
      phone: '+221770000000',
    });
    const orderId = await service.createSalesOrder({
      partner_id: partnerId,
      order_line: [{ product_id: 42, product_uom_qty: 2 }],
    });
    await service.confirmSalesOrder(orderId);

    expect(client.execute_kw).toHaveBeenNthCalledWith(
      2,
      'res.partner',
      'create',
      [[{
        name: 'Awa Ndiaye',
        email: 'awa@example.com',
        phone: '+221770000000',
      }]],
    );
    expect(client.execute_kw).toHaveBeenNthCalledWith(
      3,
      'sale.order',
      'create',
      [[{
        partner_id: 56,
        order_line: [[0, 0, { product_id: 42, product_uom_qty: 2 }]],
      }]],
    );
    expect(client.execute_kw).toHaveBeenNthCalledWith(
      4,
      'sale.order',
      'action_confirm',
      [[[124]]],
    );
  });

  it('remains unavailable after a connection failure', async () => {
    vi.mocked(client.connect).mockRejectedValue(new Error('Connection refused'));
    const service = new OdooService(createConfig(), factory);

    await service.onModuleInit();

    await expect(service.findProducts()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('creates a simple catalogue product and applies its inventory quantity', async () => {
    vi.mocked(client.execute_kw)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(42)
      .mockResolvedValueOnce([{ id: 77 }])
      .mockResolvedValueOnce([{ id: 15 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(91)
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(true);
    const service = new OdooService(createConfig(), factory);
    await service.onModuleInit();

    await expect(
      service.importSimpleProduct({
        sku: 'IMANA-001',
        name: 'Ambre',
        category: 'Niche',
        price: 68000,
        stock: 20,
        active: true,
        attributes: {},
      }),
    ).resolves.toEqual({
      action: 'created',
      productId: 77,
      sku: 'IMANA-001',
    });

    expect(client.execute_kw).toHaveBeenCalledWith(
      'product.template',
      'create',
      [
        [
          expect.objectContaining({
            name: 'Ambre',
            categ_id: 8,
            default_code: 'IMANA-001',
            list_price: 68000,
          }),
        ],
      ],
    );
    expect(client.execute_kw).toHaveBeenCalledWith(
      'stock.quant',
      'write',
      [[[91], { inventory_quantity: 20 }]],
    );
    expect(client.execute_kw).toHaveBeenCalledWith(
      'stock.quant',
      'action_apply_inventory',
      [[[91]]],
    );
  });

  it('creates a segmented customer partner from an import row', async () => {
    vi.mocked(client.execute_kw)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 200 }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(300)
      .mockResolvedValueOnce(55);
    const service = new OdooService(createConfig(), factory);
    await service.onModuleInit();

    await expect(
      service.importPartner({
        externalRef: 'CLI-0001',
        partnerType: 'client',
        name: 'Awa Ndiaye',
        companyType: 'person',
        email: 'awa@example.com',
        countryCode: 'SN',
        customerSegment: 'VIP',
        tags: [],
        active: true,
      }),
    ).resolves.toEqual({
      action: 'created',
      partnerId: 55,
      externalRef: 'CLI-0001',
    });

    expect(client.execute_kw).toHaveBeenCalledWith(
      'res.partner',
      'create',
      [
        [
          expect.objectContaining({
            ref: 'CLI-0001',
            name: 'Awa Ndiaye',
            customer_rank: 1,
            supplier_rank: 0,
            country_id: 200,
            category_id: [[6, 0, [300]]],
          }),
        ],
      ],
    );
  });

  it('ignores an unchanged imported partner', async () => {
    vi.mocked(client.execute_kw).mockResolvedValueOnce([
      {
        id: 55,
        name: 'Awa Ndiaye',
        company_type: 'person',
        email: false,
        phone: false,
        mobile: false,
        vat: false,
        street: false,
        street2: false,
        city: false,
        zip: false,
        country_id: false,
        lang: false,
        customer_rank: 1,
        supplier_rank: 0,
        category_id: [4],
        active: true,
      },
    ]);
    const service = new OdooService(createConfig(), factory);
    await service.onModuleInit();

    await expect(
      service.importPartner({
        externalRef: 'CLI-0001',
        partnerType: 'client',
        name: 'Awa Ndiaye',
        companyType: 'person',
        tags: [],
        active: true,
      }),
    ).resolves.toEqual({
      action: 'ignored',
      partnerId: 55,
      externalRef: 'CLI-0001',
    });
    expect(client.execute_kw).toHaveBeenCalledOnce();
  });
});
