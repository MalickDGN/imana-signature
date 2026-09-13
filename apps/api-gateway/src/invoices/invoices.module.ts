import { Module } from '@nestjs/common';
import { InvoicesController } from './invoices.controller';
import { InvoicesService } from './invoices.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { OdooModule } from '../integrations/odoo/odoo.module';

@Module({
  imports: [AdminAuthModule, OdooModule],
  controllers: [InvoicesController],
  providers: [InvoicesService],
})
export class InvoicesModule {}
