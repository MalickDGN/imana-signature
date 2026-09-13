import {
  BadRequestException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHmac } from 'node:crypto';
import { OdooService } from '../integrations/odoo/odoo.service';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';
import { DeliveryZonesService } from '../delivery-zones/delivery-zones.service';
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
    code: 'zone-standard',
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
    findSalesOrderByClientReference: vi.fn(),
    getSalesOrderTotal: vi.fn(),
  };
  const paymentMethods = {
    findActiveByCode: vi.fn(),
  };
  const deliveryZones = {
    findActiveById: vi.fn(),
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
    odoo.findSalesOrderByClientReference.mockResolvedValue(null);
    odoo.getSalesOrderTotal.mockResolvedValue(150000);
    paymentMethods.findActiveByCode.mockImplementation(async (code: string) =>
      code === 'cod'
        ? { id: 'payment-cod', code: 'cod', label: 'Paiement à la livraison', provider: 'cod' }
        : code === 'wave'
          ? { id: 'payment-wave', code: 'wave', label: 'Wave', provider: 'wave' }
          : null,
    );
    deliveryZones.findActiveById.mockImplementation(async (id: string) =>
      id === 'zone-standard'
        ? { id: 'zone-standard', odoo_shipping_product_id: '900' }
        : id === 'zone-express'
          ? { id: 'zone-express', odoo_shipping_product_id: '901' }
          : null,
    );

    service = new OrdersService(
      odoo as unknown as OdooService,
      new ConfigService({
        WAVE_API_KEY: 'wave_test_key',
        FRONTEND_PUBLIC_URL: 'https://imana.example',
        WAVE_WEBHOOK_SECRET: 'wave_test_webhook_secret',
      }),
      paymentMethods as unknown as PaymentMethodsService,
      deliveryZones as unknown as DeliveryZonesService,
    );
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ wave_launch_url: 'https://pay.wave.com/c/test' }),
    }));
  });

  it('creates and confirms a cash-on-delivery order with a server shipping line', async () => {
    await expect(service.createOrder(createOrder(), 'checkout_test_key_123')).resolves.toEqual({
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
      client_order_ref: 'checkout_test_key_123',
    });
    expect(odoo.confirmSalesOrder).toHaveBeenCalledWith(123);
  });

  it('keeps a mobile-money order pending until the payment webhook', async () => {
    const result = await service.createOrder(
      createOrder({
        shippingMethod: {
          code: 'zone-express',
          name: 'Livraison Express',
          price: 7000,
        },
        payment: { method: 'wave' },
      }), 'checkout_test_key_456',
    );

    expect(result.status).toBe('pending_payment');
    expect(result.paymentUrl).toBe('https://pay.wave.com/c/test');
    expect(odoo.createSalesOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        order_line: expect.arrayContaining([
          { product_id: 901, product_uom_qty: 1 },
        ]),
      }),
    );
    expect(odoo.confirmSalesOrder).not.toHaveBeenCalled();
  });

  it('rejects an unknown or inactive payment method', async () => {
    await expect(
      service.createOrder(
        createOrder({ payment: { method: 'orange_money' } }),
        'checkout_test_key_unknown_payment',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(odoo.createSalesOrder).not.toHaveBeenCalled();
  });

  it('rejects a malformed product ID before creating an Odoo partner', async () => {
    await expect(
      service.createOrder(
        createOrder({ items: [{ id: '42abc', quantity: 1 }] }),
        'checkout_test_key_789',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(odoo.findOrCreatePartner).not.toHaveBeenCalled();
    expect(odoo.createSalesOrder).not.toHaveBeenCalled();
  });

  it('returns the existing Odoo order for the same idempotency key', async () => {
    odoo.findSalesOrderByClientReference.mockResolvedValue(321);
    await expect(service.createOrder(createOrder(), 'checkout_duplicate_123'))
      .resolves.toEqual({ id: 321, status: 'confirmed', message: 'Order already created' });
    expect(odoo.createSalesOrder).not.toHaveBeenCalled();
  });

  it('confirms an order only after a valid Wave webhook', async () => {
    const body = Buffer.from(JSON.stringify({
      type: 'checkout.session.completed',
      data: { client_reference: '123', payment_status: 'succeeded' },
    }));
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac('sha256', 'wave_test_webhook_secret')
      .update(`${timestamp}${body.toString('utf8')}`).digest('hex');
    await expect(service.processWaveWebhook(body, `t=${timestamp},v1=${signature}`))
      .resolves.toEqual({ received: true });
    expect(odoo.confirmSalesOrder).toHaveBeenCalledWith(123);
  });

  it('rejects an order when Odoo stock is insufficient', async () => {
    odoo.findProducts.mockResolvedValue([
      { id: 42, qty_available: 1, sale_ok: true },
    ]);

    await expect(service.createOrder(createOrder(), 'checkout_test_key_stock')).rejects.toThrow(
      'Insufficient stock for product 42.',
    );
    expect(odoo.findOrCreatePartner).not.toHaveBeenCalled();
  });

  it('rejects an order when its delivery zone is not configured', async () => {
    deliveryZones.findActiveById.mockResolvedValue(null);

    await expect(service.createOrder(createOrder(), 'checkout_test_key_ship')).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(odoo.findOrCreatePartner).not.toHaveBeenCalled();
  });
});
