import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OdooService } from '../integrations/odoo/odoo.service';
import { PortalDatabaseService } from '../portal-database/portal-database.service';

export interface IntegrationStatus {
  name: string;
  status: 'operational' | 'degraded' | 'not_configured';
  configured: boolean;
  detail?: string;
}

@Injectable()
export class IntegrationsStatusService {
  constructor(
    private readonly odoo: OdooService,
    private readonly db: PortalDatabaseService,
    private readonly config: ConfigService,
  ) {}

  async check(): Promise<IntegrationStatus[]> {
    const [odooStatus, waveStatus, postgresStatus] = await Promise.all([
      this.checkOdoo(),
      this.checkWave(),
      Promise.resolve(this.checkPostgres()),
    ]);
    return [odooStatus, waveStatus, postgresStatus];
  }

  private async checkOdoo(): Promise<IntegrationStatus> {
    const configured = Boolean(this.config.get<string>('ODOO_URL'));
    if (!configured) return { name: 'Odoo', status: 'not_configured', configured };
    try {
      await this.odoo.findSalesOrders([], ['id'], { limit: 1 });
      return { name: 'Odoo', status: 'operational', configured };
    } catch (error) {
      return {
        name: 'Odoo',
        status: 'degraded',
        configured,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async checkWave(): Promise<IntegrationStatus> {
    const configured = Boolean(
      this.config.get<string>('WAVE_API_KEY') && this.config.get<string>('WAVE_WEBHOOK_SECRET'),
    );
    return {
      name: 'Wave',
      status: configured ? 'operational' : 'not_configured',
      configured,
    };
  }

  private checkPostgres(): IntegrationStatus {
    const available = this.db.isAvailable();
    return {
      name: 'PostgreSQL',
      status: available ? 'operational' : 'degraded',
      configured: true,
    };
  }
}
