import { Injectable } from '@nestjs/common';
import { OdooService, OdooDomain } from '../integrations/odoo/odoo.service';

const MEMBER_FIELDS = [
  'name',
  'email',
  'phone',
  'mobile',
  'city',
  'category_id',
  'active',
  'customer_rank',
];

@Injectable()
export class MembersService {
  constructor(private readonly odoo: OdooService) {}

  async list(params: { search?: string; limit: number; offset: number }) {
    const domain: OdooDomain = [['customer_rank', '>', 0]];
    if (params.search?.trim()) {
      domain.push(['name', 'ilike', params.search.trim()]);
    }
    return this.odoo.findPartners(domain, MEMBER_FIELDS, {
      limit: params.limit,
      offset: params.offset,
      order: 'name asc',
    });
  }
}
