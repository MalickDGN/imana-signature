import { Module } from '@nestjs/common';
import { OdooModule } from '../integrations/odoo/odoo.module';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [OdooModule, AdminAuthModule, AuditLogModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
