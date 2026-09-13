import { Module } from '@nestjs/common';
import { OdooModule } from '../integrations/odoo/odoo.module';
import { CatalogImportController } from './catalog-import.controller';
import { CatalogImportParser } from './catalog-import.parser';
import { CatalogImportService } from './catalog-import.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { EtlJobRepository } from '../etl/etl-job.repository';

@Module({
  imports: [OdooModule, AdminAuthModule],
  controllers: [CatalogImportController],
  providers: [CatalogImportParser, CatalogImportService, EtlJobRepository],
})
export class CatalogImportModule {}
