import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PortalDatabaseService } from '../portal-database/portal-database.service';
import { CreatePaymentMethodDto, UpdatePaymentMethodDto } from './payment-methods.dto';

export interface PaymentMethodRow {
  id: string;
  code: string;
  label: string;
  provider: string;
  collect_at: 'order' | 'delivery';
  active: boolean;
  sort_order: number;
}

@Injectable()
export class PaymentMethodsService {
  constructor(private readonly db: PortalDatabaseService) {}

  async listAll(): Promise<PaymentMethodRow[]> {
    const result = await this.db.query<PaymentMethodRow>(
      `SELECT * FROM ${this.db.table('payment_methods')} ORDER BY sort_order ASC, label ASC`,
    );
    return result.rows;
  }

  async listActive(): Promise<PaymentMethodRow[]> {
    const result = await this.db.query<PaymentMethodRow>(
      `SELECT * FROM ${this.db.table('payment_methods')}
       WHERE active = true ORDER BY sort_order ASC, label ASC`,
    );
    return result.rows;
  }

  async findActiveByCode(code: string): Promise<PaymentMethodRow | null> {
    const result = await this.db.query<PaymentMethodRow>(
      `SELECT * FROM ${this.db.table('payment_methods')}
       WHERE code = $1 AND active = true`,
      [code],
    );
    return result.rows[0] ?? null;
  }

  async create(dto: CreatePaymentMethodDto): Promise<PaymentMethodRow> {
    const existing = await this.db.query(
      `SELECT id FROM ${this.db.table('payment_methods')} WHERE code = $1`,
      [dto.code],
    );
    if (existing.rowCount) {
      throw new BadRequestException('Un moyen de paiement avec ce code existe déjà.');
    }
    const result = await this.db.query<PaymentMethodRow>(
      `INSERT INTO ${this.db.table('payment_methods')}
        (id, code, label, provider, collect_at, active, sort_order)
       VALUES ($1,$2,$3,$4,$5,true,$6)
       RETURNING *`,
      [randomUUID(), dto.code, dto.label.trim(), dto.provider, dto.collectAt, dto.sortOrder ?? 10],
    );
    return result.rows[0];
  }

  async update(id: string, dto: UpdatePaymentMethodDto): Promise<PaymentMethodRow> {
    const fields: string[] = [];
    const values: unknown[] = [];
    const add = (column: string, value: unknown) => {
      values.push(value);
      fields.push(`${column} = $${values.length}`);
    };
    if (dto.label !== undefined) add('label', dto.label.trim());
    if (dto.provider !== undefined) add('provider', dto.provider);
    if (dto.collectAt !== undefined) add('collect_at', dto.collectAt);
    if (dto.active !== undefined) add('active', dto.active);
    if (dto.sortOrder !== undefined) add('sort_order', dto.sortOrder);
    if (fields.length === 0) throw new BadRequestException('Aucune modification fournie.');
    add('updated_at', new Date());
    values.push(id);
    const result = await this.db.query<PaymentMethodRow>(
      `UPDATE ${this.db.table('payment_methods')}
       SET ${fields.join(', ')}
       WHERE id = $${values.length}
       RETURNING *`,
      values,
    );
    if (!result.rows[0]) throw new NotFoundException('Moyen de paiement introuvable.');
    return result.rows[0];
  }
}
