import { Injectable } from '@nestjs/common';
import { OdooService, OdooDomain } from '../integrations/odoo/odoo.service';

const DELIVERY_FIELDS = [
  'name',
  'partner_id',
  'state',
  'scheduled_date',
  'origin',
  'picking_type_id',
];

@Injectable()
export class DeliveriesService {
  constructor(private readonly odoo: OdooService) {}

  async list(params: { status?: string; search?: string; limit: number; offset: number }) {
    const domain: OdooDomain = [];
    if (params.status) domain.push(['state', '=', params.status]);
    if (params.search?.trim()) {
      domain.push(['name', 'ilike', params.search.trim()]);
    }
    return this.odoo.findDeliveries(domain, DELIVERY_FIELDS, {
      limit: params.limit,
      offset: params.offset,
      order: 'scheduled_date desc',
    });
  }
}
