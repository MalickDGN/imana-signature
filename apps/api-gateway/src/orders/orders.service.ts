import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'node:crypto';
import type { CreateOrderResult } from '@imana-signature/shared-types';
import { OdooService } from '../integrations/odoo/odoo.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { PortalDatabaseService } from '../portal-database/portal-database.service';
import { PaymentMethodsService } from '../payment-methods/payment-methods.service';
import { DeliveryZonesService } from '../delivery-zones/delivery-zones.service';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly inFlight = new Map<string, Promise<OrderResponse>>();

  constructor(
    private readonly odooService: OdooService,
    private readonly configService: ConfigService,
    private readonly paymentMethods: PaymentMethodsService,
    private readonly deliveryZones: DeliveryZonesService,
    @Optional() private readonly db?: PortalDatabaseService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto, idempotencyKey?: string): Promise<OrderResponse> {
    if (!idempotencyKey || !/^[A-Za-z0-9_-]{16,100}$/.test(idempotencyKey)) {
      throw new BadRequestException('A valid Idempotency-Key header is required.');
    }
    const running = this.inFlight.get(idempotencyKey);
    if (running) return running;
    const operation = this.createOrderOnce(createOrderDto, idempotencyKey);
    this.inFlight.set(idempotencyKey, operation);
    try {
      return await operation;
    } finally {
      this.inFlight.delete(idempotencyKey);
    }
  }

  private async createOrderOnce(createOrderDto: CreateOrderDto, idempotencyKey: string): Promise<OrderResponse> {
    const paymentMethod = await this.paymentMethods.findActiveByCode(createOrderDto.payment.method);
    if (!paymentMethod) {
      throw new BadRequestException(`Unknown or inactive payment method: ${createOrderDto.payment.method}`);
    }
    const isWave = paymentMethod.provider === 'wave';
    if (isWave) {
      this.assertWaveConfigured();
    } else if (paymentMethod.provider !== 'cod') {
      throw new ServiceUnavailableException(`${paymentMethod.label} is not configured yet.`);
    }

    const existingOrderId = await this.odooService.findSalesOrderByClientReference(idempotencyKey);
    if (existingOrderId) {
      const paymentUrl = isWave
        ? await this.createWaveCheckout(existingOrderId, createOrderDto.shippingAddress.phone)
        : undefined;
      return {
        id: existingOrderId,
        status: isWave ? 'pending_payment' : 'confirmed',
        paymentUrl,
        message: 'Order already created',
      };
    }
    const orderLines = createOrderDto.items.map((item) => {
      const productId = Number(item.id);

      if (!Number.isInteger(productId) || productId <= 0) {
        throw new BadRequestException(`Invalid product id: ${item.id}`);
      }

      return {
        product_id: productId,
        product_uom_qty: item.quantity,
      };
    });
    orderLines.push({
      product_id: await this.getShippingProductId(createOrderDto.shippingMethod.code),
      product_uom_qty: 1,
    });

    await this.assertStockAvailability(
      orderLines.slice(0, createOrderDto.items.length),
    );

    const partnerId = await this.odooService.findOrCreatePartner({
      name: createOrderDto.shippingAddress.name,
      email: createOrderDto.shippingAddress.email,
      phone: createOrderDto.shippingAddress.phone,
      street: createOrderDto.shippingAddress.address,
      city: createOrderDto.shippingAddress.city,
    });

    const orderId = await this.odooService.createSalesOrder({
      partner_id: partnerId,
      order_line: orderLines,
      client_order_ref: idempotencyKey,
    });

    if (isWave) {
      const paymentUrl = await this.createWaveCheckout(orderId, createOrderDto.shippingAddress.phone);
      await this.recordPayment(orderId, createOrderDto.shippingAddress.phone);
      this.logger.log(`Wave checkout created for order ${orderId}.`);
      return {
        id: orderId,
        status: 'pending_payment' as const,
        paymentUrl,
        message: 'Order created successfully',
      };
    } else {
      await this.odooService.confirmSalesOrder(orderId);
    }

    return {
      id: orderId,
      status: 'confirmed' as const,
      message: 'Order created successfully',
    };
  }

  async processWaveWebhook(rawBody?: Buffer, signature?: string) {
    if (!rawBody || !signature || !this.isValidWaveSignature(rawBody, signature)) {
      throw new ForbiddenException('Invalid Wave webhook signature.');
    }
    const event = JSON.parse(rawBody.toString('utf8')) as {
      type?: string;
      data?: { client_reference?: string; payment_status?: string; transaction_id?: string };
    };
    if (event.type !== 'checkout.session.completed' || event.data?.payment_status !== 'succeeded') {
      return { received: true };
    }
    const orderId = Number(event.data.client_reference);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      throw new BadRequestException('Wave webhook has an invalid client reference.');
    }
    await this.odooService.confirmSalesOrder(orderId);
    if (this.db?.isAvailable()) {
      await this.db.query(
        `UPDATE ${this.db.table('payment_transactions')}
         SET status='succeeded', external_reference=$2, updated_at=now()
         WHERE provider='wave' AND order_id=$1`,
        [orderId, event.data.transaction_id ?? null],
      );
    }
    return { received: true };
  }

  private async createWaveCheckout(orderId: number, phone: string): Promise<string> {
    const apiKey = this.configService.get<string>('WAVE_API_KEY');
    const frontendUrl = this.configService.get<string>('FRONTEND_PUBLIC_URL');
    this.assertWaveConfigured();
    const search = await fetch(`https://api.wave.com/v1/checkout/sessions/search?client_reference=${orderId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(10_000),
    });
    if (search.ok) {
      const found = await search.json() as { result?: Array<{ wave_launch_url?: unknown; checkout_status?: unknown }> };
      const open = found.result?.find((session) => session.checkout_status === 'open' && typeof session.wave_launch_url === 'string');
      if (open && typeof open.wave_launch_url === 'string') return open.wave_launch_url;
    }
    const amount = await this.odooService.getSalesOrderTotal(orderId);
    if (!Number.isInteger(amount) || amount <= 0) {
      throw new ServiceUnavailableException('The order total cannot be paid with Wave.');
    }
    const response = await fetch('https://api.wave.com/v1/checkout/sessions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: String(amount),
        currency: 'XOF',
        client_reference: String(orderId),
        restrict_payer_mobile: phone,
        success_url: `${frontendUrl}/order/success?orderId=${orderId}&status=pending_payment`,
        error_url: `${frontendUrl}/checkout?payment=failed`,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const payload = await response.json() as { wave_launch_url?: unknown };
    if (!response.ok || typeof payload.wave_launch_url !== 'string') {
      throw new ServiceUnavailableException('Wave checkout could not be created.');
    }
    return payload.wave_launch_url;
  }

  private assertWaveConfigured(): void {
    const apiKey = this.configService.get<string>('WAVE_API_KEY');
    const frontendUrl = this.configService.get<string>('FRONTEND_PUBLIC_URL');
    if (!apiKey || !frontendUrl?.startsWith('https://')) {
      throw new ServiceUnavailableException('Wave payment is not configured.');
    }
  }

  private async recordPayment(orderId: number, phone: string): Promise<void> {
    if (!this.db?.isAvailable()) return;
    const amount = await this.odooService.getSalesOrderTotal(orderId);
    await this.db.query(
      `INSERT INTO ${this.db.table('payment_transactions')}
        (id, order_id, provider, amount_fcfa, status, customer_phone)
       VALUES ($1,$2,'wave',$3,'pending',$4)
       ON CONFLICT (provider, order_id) DO UPDATE SET updated_at=now()`,
      [`wave-${orderId}`, orderId, amount, phone],
    );
  }

  private isValidWaveSignature(rawBody: Buffer, header: string): boolean {
    const secret = this.configService.get<string>('WAVE_WEBHOOK_SECRET');
    if (!secret) return false;
    const parts = Object.fromEntries(header.split(',').map((part) => part.split('=', 2)));
    const timestamp = Number(parts.t);
    if (!Number.isInteger(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > 300 || !parts.v1) return false;
    const expected = createHmac('sha256', secret).update(`${timestamp}${rawBody.toString('utf8')}`).digest();
    let received: Buffer;
    try { received = Buffer.from(parts.v1, 'hex'); } catch { return false; }
    return received.length === expected.length && timingSafeEqual(received, expected);
  }

  private async assertStockAvailability(
    orderLines: Array<{ product_id: number; product_uom_qty: number }>,
  ): Promise<void> {
    const records = await this.odooService.findProducts(
      [['id', 'in', orderLines.map((line) => line.product_id)]],
      ['qty_available', 'sale_ok'],
    );
    const products = new Map(records.map((record) => [record.id, record]));

    for (const line of orderLines) {
      const product = products.get(line.product_id);
      const available = Number(product?.qty_available ?? 0);
      if (!product || product.sale_ok === false || available < line.product_uom_qty) {
        throw new BadRequestException(
          `Insufficient stock for product ${line.product_id}.`,
        );
      }
    }
  }

  private async getShippingProductId(zoneId: string): Promise<number> {
    const zone = await this.deliveryZones.findActiveById(zoneId);
    const productId = Number(zone?.odoo_shipping_product_id);

    if (!zone || !Number.isInteger(productId) || productId <= 0) {
      throw new ServiceUnavailableException(
        `Delivery zone ${zoneId} is not configured.`,
      );
    }

    return productId;
  }
}

type OrderResponse = CreateOrderResult & { message: string };
