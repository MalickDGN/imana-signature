import { Injectable } from '@nestjs/common';
import { OdooService, OdooDomain } from '../integrations/odoo/odoo.service';

const ORDER_FIELDS = [
  'name',
  'date_order',
  'amount_total',
  'partner_id',
  'state',
  'invoice_status',
  'client_order_ref',
];

@Injectable()
export class OrdersAdminService {
  constructor(private readonly odoo: OdooService) {}

  async list(params: { status?: string; search?: string; limit: number; offset: number }) {
    const domain: OdooDomain = [];
    if (params.status) domain.push(['state', '=', params.status]);
    if (params.search?.trim()) {
      domain.push(['name', 'ilike', params.search.trim()]);
    }
    return this.odoo.findSalesOrders(domain, ORDER_FIELDS, {
      limit: params.limit,
      offset: params.offset,
      order: 'date_order desc',
    });
  }

  async findOne(id: number) {
    const rows = await this.odoo.findSalesOrders(
      [['id', '=', id]],
      [...ORDER_FIELDS, 'order_line'],
      { limit: 1 },
    );
    return rows[0] ?? null;
  }

  async confirm(id: number): Promise<void> {
    await this.odoo.confirmSalesOrder(id);
  }

  async cancel(id: number): Promise<void> {
    await this.odoo.cancelSalesOrder(id);
  }
}
