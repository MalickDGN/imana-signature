import { Module } from '@nestjs/common';
import { OdooModule } from '../integrations/odoo/odoo.module';
import { CatalogImportController } from './catalog-import.controller';
import { CatalogImportParser } from './catalog-import.parser';
import { CatalogImportService } from './catalog-import.service';

@Module({
  imports: [OdooModule],
  controllers: [CatalogImportController],
  providers: [CatalogImportParser, CatalogImportService],
})
export class CatalogImportModule {}
