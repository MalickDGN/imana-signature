import { Module } from '@nestjs/common';
import { OrdersAdminController } from './orders-admin.controller';
import { OrdersAdminService } from './orders-admin.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { OdooModule } from '../integrations/odoo/odoo.module';

@Module({
  imports: [AdminAuthModule, AuditLogModule, OdooModule],
  controllers: [OrdersAdminController],
  providers: [OrdersAdminService],
})
export class OrdersAdminModule {}
