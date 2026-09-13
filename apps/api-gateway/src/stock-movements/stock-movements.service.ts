import { Injectable } from '@nestjs/common';
import { OdooService, OdooDomain } from '../integrations/odoo/odoo.service';

const MOVE_FIELDS = [
  'product_id',
  'product_qty',
  'state',
  'date',
  'location_id',
  'location_dest_id',
  'reference',
];

@Injectable()
export class StockMovementsService {
  constructor(private readonly odoo: OdooService) {}

  async list(params: { productId?: number; limit: number; offset: number }) {
    const domain: OdooDomain = [['state', '=', 'done']];
    if (params.productId) domain.push(['product_id', '=', params.productId]);
    return this.odoo.findStockMoves(domain, MOVE_FIELDS, {
      limit: params.limit,
      offset: params.offset,
      order: 'date desc',
    });
  }
}
