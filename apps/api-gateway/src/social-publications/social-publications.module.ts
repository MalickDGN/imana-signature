import { Module } from '@nestjs/common';
import { SocialPublicationsController } from './social-publications.controller';
import { SocialPublicationsService } from './social-publications.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AuditLogModule } from '../audit-log/audit-log.module';

@Module({
  imports: [AdminAuthModule, AuditLogModule],
  controllers: [SocialPublicationsController],
  providers: [SocialPublicationsService],
})
export class SocialPublicationsModule {}
