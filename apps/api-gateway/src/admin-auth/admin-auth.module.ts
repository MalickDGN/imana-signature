import { Module } from '@nestjs/common';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAccessGuard } from './admin-auth.guard';
import { AdminAuthService } from './admin-auth.service';

@Module({
  controllers: [AdminAuthController],
  providers: [AdminAuthService, AdminAccessGuard],
  exports: [AdminAuthService, AdminAccessGuard],
})
export class AdminAuthModule {}
