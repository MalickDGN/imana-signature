import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OdooService } from '../integrations/odoo/odoo.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private readonly odooService: OdooService,
    private readonly configService: ConfigService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto) {
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
      product_id: this.getShippingProductId(createOrderDto.shippingMethod.code),
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
    });

    if (createOrderDto.payment.method === 'mobile') {
      this.logger.log(`Online payment order ${orderId} created. Awaiting payment webhook.`);
    } else {
      await this.odooService.confirmSalesOrder(orderId);
    }

    return {
      id: orderId,
      status: createOrderDto.payment.method === 'mobile' ? 'pending_payment' : 'confirmed',
      message: 'Order created successfully',
    };
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

  private getShippingProductId(code: 'standard' | 'express'): number {
    const key =
      code === 'express'
        ? 'ODOO_SHIPPING_EXPRESS_PRODUCT_ID'
        : 'ODOO_SHIPPING_STANDARD_PRODUCT_ID';
    const productId = Number(this.configService.get<string>(key));

    if (!Number.isInteger(productId) || productId <= 0) {
      throw new ServiceUnavailableException(
        `Shipping method ${code} is not configured.`,
      );
    }

    return productId;
  }
}
