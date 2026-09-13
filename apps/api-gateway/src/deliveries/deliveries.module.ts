import { Module } from '@nestjs/common';
import { DeliveriesController } from './deliveries.controller';
import { DeliveriesService } from './deliveries.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { OdooModule } from '../integrations/odoo/odoo.module';

@Module({
  imports: [AdminAuthModule, OdooModule],
  controllers: [DeliveriesController],
  providers: [DeliveriesService],
})
export class DeliveriesModule {}
