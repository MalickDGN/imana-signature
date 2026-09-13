import { Module } from '@nestjs/common';
import { OdooModule } from '../integrations/odoo/odoo.module';
import { PartnerImportController } from './partner-import.controller';
import { PartnerImportParser } from './partner-import.parser';
import { PartnerImportService } from './partner-import.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { EtlJobRepository } from '../etl/etl-job.repository';

@Module({
  imports: [OdooModule, AdminAuthModule],
  controllers: [PartnerImportController],
  providers: [PartnerImportParser, PartnerImportService, EtlJobRepository],
})
export class PartnerImportModule {}
