import { Module } from '@nestjs/common';
import { OdooModule } from '../integrations/odoo/odoo.module';
import { PaymentMethodsModule } from '../payment-methods/payment-methods.module';
import { DeliveryZonesModule } from '../delivery-zones/delivery-zones.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [OdooModule, PaymentMethodsModule, DeliveryZonesModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
