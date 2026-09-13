import {
  BadRequestException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OdooService } from '../integrations/odoo/odoo.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

const createOrder = (
  overrides: Partial<CreateOrderDto> = {},
): CreateOrderDto => ({
  items: [{ id: '42', quantity: 2 }],
  shippingAddress: {
    name: 'Awa Ndiaye',
    email: 'awa@example.com',
    phone: '+221770000000',
    address: '10 rue de Dakar',
    city: 'Dakar',
  },
  shippingMethod: {
    code: 'standard',
    name: 'Livraison Standard',
    price: 3000,
  },
  payment: { method: 'cod' },
  ...overrides,
});

describe('OrdersService', () => {
  const odoo = {
    findProducts: vi.fn(),
    findOrCreatePartner: vi.fn(),
    createSalesOrder: vi.fn(),
    confirmSalesOrder: vi.fn(),
  };
  let service: OrdersService;

  beforeEach(() => {
    vi.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    odoo.findProducts.mockResolvedValue([
      { id: 42, qty_available: 10, sale_ok: true },
    ]);
    odoo.findOrCreatePartner.mockResolvedValue(7);
    odoo.createSalesOrder.mockResolvedValue(123);
    odoo.confirmSalesOrder.mockResolvedValue(undefined);

    service = new OrdersService(
      odoo as unknown as OdooService,
      new ConfigService({
        ODOO_SHIPPING_STANDARD_PRODUCT_ID: '900',
        ODOO_SHIPPING_EXPRESS_PRODUCT_ID: '901',
      }),
    );
  });

  it('creates and confirms a cash-on-delivery order with a server shipping line', async () => {
    await expect(service.createOrder(createOrder())).resolves.toEqual({
      id: 123,
      status: 'confirmed',
      message: 'Order created successfully',
    });

    expect(odoo.findOrCreatePartner).toHaveBeenCalledWith({
      name: 'Awa Ndiaye',
      email: 'awa@example.com',
      phone: '+221770000000',
      street: '10 rue de Dakar',
      city: 'Dakar',
    });
    expect(odoo.createSalesOrder).toHaveBeenCalledWith({
      partner_id: 7,
      order_line: [
        { product_id: 42, product_uom_qty: 2 },
        { product_id: 900, product_uom_qty: 1 },
      ],
    });
    expect(odoo.confirmSalesOrder).toHaveBeenCalledWith(123);
  });

  it('keeps a mobile-money order pending until the payment webhook', async () => {
    const result = await service.createOrder(
      createOrder({
        shippingMethod: {
          code: 'express',
          name: 'Livraison Express',
          price: 7000,
        },
        payment: { method: 'mobile', provider: 'wave' },
      }),
    );

    expect(result.status).toBe('pending_payment');
    expect(odoo.createSalesOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        order_line: expect.arrayContaining([
          { product_id: 901, product_uom_qty: 1 },
        ]),
      }),
    );
    expect(odoo.confirmSalesOrder).not.toHaveBeenCalled();
  });

  it('rejects a malformed product ID before creating an Odoo partner', async () => {
    await expect(
      service.createOrder(
        createOrder({ items: [{ id: '42abc', quantity: 1 }] }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(odoo.findOrCreatePartner).not.toHaveBeenCalled();
    expect(odoo.createSalesOrder).not.toHaveBeenCalled();
  });

  it('rejects an order when Odoo stock is insufficient', async () => {
    odoo.findProducts.mockResolvedValue([
      { id: 42, qty_available: 1, sale_ok: true },
    ]);

    await expect(service.createOrder(createOrder())).rejects.toThrow(
      'Insufficient stock for product 42.',
    );
    expect(odoo.findOrCreatePartner).not.toHaveBeenCalled();
  });

  it('rejects an order when its shipping product is not configured', async () => {
    service = new OrdersService(
      odoo as unknown as OdooService,
      new ConfigService({}),
    );

    await expect(service.createOrder(createOrder())).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(odoo.findOrCreatePartner).not.toHaveBeenCalled();
  });
});
