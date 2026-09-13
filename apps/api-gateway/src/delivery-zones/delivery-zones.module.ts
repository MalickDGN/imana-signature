import { Module } from '@nestjs/common';
import {
  AdminDeliveryZonesController,
  PublicDeliveryZonesController,
} from './delivery-zones.controller';
import { DeliveryZonesService } from './delivery-zones.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AdminAuthModule, AuditLogModule],
  controllers: [AdminDeliveryZonesController, PublicDeliveryZonesController],
  providers: [DeliveryZonesService],
  exports: [DeliveryZonesService],
})
export class DeliveryZonesModule {}
