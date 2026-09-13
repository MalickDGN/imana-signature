import { Injectable } from '@nestjs/common';
import { PortalDatabaseService } from '../portal-database/portal-database.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly db: PortalDatabaseService) {}

  async list(params: { status?: string; provider?: string; limit: number; offset: number }) {
    const conditions: string[] = [];
    const values: unknown[] = [];
    if (params.status) {
      values.push(params.status);
      conditions.push(`status = $${values.length}`);
    }
    if (params.provider) {
      values.push(params.provider);
      conditions.push(`provider = $${values.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(params.limit, params.offset);
    const result = await this.db.query(
      `SELECT id, order_id, provider, amount_fcfa, external_reference, status,
              customer_phone, created_at, updated_at
       FROM ${this.db.table('payment_transactions')}
       ${where}
       ORDER BY created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
      values,
    );
    return result.rows;
  }
}
