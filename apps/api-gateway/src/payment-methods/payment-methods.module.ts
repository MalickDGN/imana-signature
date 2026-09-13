import { Module } from '@nestjs/common';
import {
  AdminPaymentMethodsController,
  PublicPaymentMethodsController,
} from './payment-methods.controller';
import { PaymentMethodsService } from './payment-methods.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AdminAuthModule, AuditLogModule],
  controllers: [AdminPaymentMethodsController, PublicPaymentMethodsController],
  providers: [PaymentMethodsService],
  exports: [PaymentMethodsService],
})
export class PaymentMethodsModule {}
