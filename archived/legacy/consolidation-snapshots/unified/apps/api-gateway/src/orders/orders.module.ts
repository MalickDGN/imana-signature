import { Module } from '@nestjs/common';
import { OdooModule } from '../integrations/odoo/odoo.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [OdooModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
