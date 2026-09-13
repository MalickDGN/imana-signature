import { Injectable } from '@nestjs/common';
import { PortalDatabaseService } from '../portal-database/portal-database.service';

@Injectable()
export class EtlJobRepository {
  constructor(private readonly db: PortalDatabaseService) {}

  async save(kind: string, batch: PersistedBatch, eventType: string, actor?: EtlAuditActor): Promise<void> {
    if (!this.db.isAvailable()) return;
    await this.db.query(
      `INSERT INTO ${this.db.table('etl_jobs')}
        (id, object_type, file_name, status, environment, summary, payload, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (id) DO UPDATE SET status=$4, summary=$6, payload=$7,
         expires_at=$8, updated_at=now()`,
      [batch.id, kind, batch.fileName, batch.status, process.env.ENVIRONMENT ?? 'development',
       batchSummary(batch), JSON.stringify(batch), batch.expiresAt],
    );
    await this.db.query(
      `INSERT INTO ${this.db.table('etl_job_events')} (job_id, event_type, details)
       VALUES ($1,$2,$3)`,
      [batch.id, eventType, { status: batch.status, actor: actor ?? null }],
    );
  }

  async load<T extends PersistedBatch>(id: string, kind: string): Promise<T | null> {
    if (!this.db.isAvailable()) return null;
    const result = await this.db.query<{ payload: T }>(
      `SELECT payload FROM ${this.db.table('etl_jobs')}
       WHERE id=$1 AND object_type=$2 AND (expires_at IS NULL OR expires_at > now())`,
      [id, kind],
    );
    const payload = result.rows[0]?.payload;
    if (!payload) return null;
    return revive(payload) as T;
  }
}

export interface EtlAuditActor { id: string; email: string }

interface PersistedBatch { id: string; fileName: string; status: string; expiresAt: Date; results?: unknown[]; issues?: unknown[] }

function batchSummary(batch: PersistedBatch) {
  return { results: batch.results?.length ?? 0, issues: batch.issues?.length ?? 0 };
}

function revive(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(revive);
  if (!value || typeof value !== 'object') return value;
  const record = value as Record<string, unknown>;
  if (record.type === 'Buffer' && Array.isArray(record.data)) return Buffer.from(record.data as number[]);
  const output: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(record)) output[key] = revive(child);
  if (typeof output.createdAt === 'string') output.createdAt = new Date(output.createdAt);
  if (typeof output.expiresAt === 'string') output.expiresAt = new Date(output.expiresAt);
  return output;
}
