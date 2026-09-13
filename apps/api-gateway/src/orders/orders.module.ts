import { Module } from '@nestjs/common';
import { OdooModule } from '../integrations/odoo/odoo.module';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';
import { DeliveryZonesModule } from '../delivery-zones/delivery-zones.module';
import { AuditLogModule } from '../audit-log/audit-log.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [OdooModule, PaymentMethodsModule, DeliveryZonesModule, AuditLogModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
