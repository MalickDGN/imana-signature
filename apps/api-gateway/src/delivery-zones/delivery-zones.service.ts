import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PortalDatabaseService } from '../portal-database/portal-database.service';
import { CreateDeliveryZoneDto, UpdateDeliveryZoneDto } from './delivery-zones.dto';

export interface DeliveryZoneRow {
  id: string;
  name: string;
  price_fcfa: string;
  odoo_shipping_product_id: string | null;
  active: boolean;
  sort_order: number;
}

@Injectable()
export class DeliveryZonesService {
  constructor(private readonly db: PortalDatabaseService) {}

  async listAll(): Promise<DeliveryZoneRow[]> {
    const result = await this.db.query<DeliveryZoneRow>(
      `SELECT * FROM ${this.db.table('delivery_zones')} ORDER BY sort_order ASC, name ASC`,
    );
    return result.rows;
  }

  async listActive(): Promise<DeliveryZoneRow[]> {
    const result = await this.db.query<DeliveryZoneRow>(
      `SELECT * FROM ${this.db.table('delivery_zones')}
       WHERE active = true ORDER BY sort_order ASC, name ASC`,
    );
    return result.rows;
  }

  async findActiveById(id: string): Promise<DeliveryZoneRow | null> {
    const result = await this.db.query<DeliveryZoneRow>(
      `SELECT * FROM ${this.db.table('delivery_zones')}
       WHERE id = $1 AND active = true`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async create(dto: CreateDeliveryZoneDto): Promise<DeliveryZoneRow> {
    const result = await this.db.query<DeliveryZoneRow>(
      `INSERT INTO ${this.db.table('delivery_zones')}
        (id, name, price_fcfa, odoo_shipping_product_id, active, sort_order)
       VALUES ($1,$2,$3,$4,true,$5)
       RETURNING *`,
      [
        randomUUID(),
        dto.name.trim(),
        dto.priceFcfa,
        dto.odooShippingProductId ?? null,
        dto.sortOrder ?? 10,
      ],
    );
    return result.rows[0];
  }

  async update(id: string, dto: UpdateDeliveryZoneDto): Promise<DeliveryZoneRow> {
    const fields: string[] = [];
    const values: unknown[] = [];
    const add = (column: string, value: unknown) => {
      values.push(value);
      fields.push(`${column} = $${values.length}`);
    };
    if (dto.name !== undefined) add('name', dto.name.trim());
    if (dto.priceFcfa !== undefined) add('price_fcfa', dto.priceFcfa);
    if (dto.odooShippingProductId !== undefined) {
      add('odoo_shipping_product_id', dto.odooShippingProductId || null);
    }
    if (dto.active !== undefined) add('active', dto.active);
    if (dto.sortOrder !== undefined) add('sort_order', dto.sortOrder);
    if (fields.length === 0) throw new BadRequestException('Aucune modification fournie.');
    add('updated_at', new Date());
    values.push(id);
    const result = await this.db.query<DeliveryZoneRow>(
      `UPDATE ${this.db.table('delivery_zones')}
       SET ${fields.join(', ')}
       WHERE id = $${values.length}
       RETURNING *`,
      values,
    );
    if (!result.rows[0]) throw new NotFoundException('Zone de livraison introuvable.');
    return result.rows[0];
  }
}
