import { Module } from '@nestjs/common';
import { OdooModule } from '../integrations/odoo/odoo.module';
import { PartnerImportController } from './partner-import.controller';
import { PartnerImportParser } from './partner-import.parser';
import { PartnerImportService } from './partner-import.service';

@Module({
  imports: [OdooModule],
  controllers: [PartnerImportController],
  providers: [PartnerImportParser, PartnerImportService],
})
export class PartnerImportModule {}
