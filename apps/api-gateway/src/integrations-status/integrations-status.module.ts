import { Module } from '@nestjs/common';
import { IntegrationsStatusController } from './integrations-status.controller';
import { IntegrationsStatusService } from './integrations-status.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { OdooModule } from '../integrations/odoo/odoo.module';

@Module({
  imports: [AdminAuthModule, OdooModule],
  controllers: [IntegrationsStatusController],
  providers: [IntegrationsStatusService],
})
export class IntegrationsStatusModule {}
