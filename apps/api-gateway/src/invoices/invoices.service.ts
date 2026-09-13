import { Injectable } from '@nestjs/common';
import { OdooService, OdooDomain } from '../integrations/odoo/odoo.service';

const INVOICE_FIELDS = [
  'name',
  'invoice_date',
  'amount_total',
  'state',
  'payment_state',
  'partner_id',
  'move_type',
];

@Injectable()
export class InvoicesService {
  constructor(private readonly odoo: OdooService) {}

  async list(params: { search?: string; limit: number; offset: number }) {
    const domain: OdooDomain = [
      ['move_type', 'in', ['out_invoice', 'out_refund']],
    ];
    if (params.search?.trim()) {
      domain.push(['name', 'ilike', params.search.trim()]);
    }
    return this.odoo.findInvoices(domain, INVOICE_FIELDS, {
      limit: params.limit,
      offset: params.offset,
      order: 'invoice_date desc',
    });
  }
}
