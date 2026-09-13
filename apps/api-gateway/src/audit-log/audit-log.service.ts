import { Injectable, Logger } from '@nestjs/common';
import { PortalDatabaseService } from '../portal-database/portal-database.service';
import { AdminUser } from '../admin-auth/admin-auth.service';

@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private readonly db: PortalDatabaseService) {}

  /** Best-effort: never blocks or fails the caller's write operation. */
  async record(
    actor: AdminUser | undefined,
    action: string,
    entityType: string,
    entityId: string | null,
    details: Record<string, unknown> = {},
  ): Promise<void> {
    if (!this.db.isAvailable()) return;
    try {
      await this.db.query(
        `INSERT INTO ${this.db.table('audit_logs')}
          (actor_id, actor_email, action, entity_type, entity_id, details)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          actor?.id ?? null,
          actor?.email ?? null,
          action,
          entityType,
          entityId,
          JSON.stringify(details),
        ],
      );
    } catch (error) {
      this.logger.error(
        `Failed to record audit log for ${action} on ${entityType}.`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async list(limit = 100, offset = 0) {
    const result = await this.db.query(
      `SELECT id, actor_id, actor_email, action, entity_type, entity_id, details, created_at
       FROM ${this.db.table('audit_logs')}
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset],
    );
    return result.rows;
  }
}
