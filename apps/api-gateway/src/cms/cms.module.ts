import { Module } from '@nestjs/common';
import { AdminCmsController, PublicCmsController } from './cms.controller';
import { CmsService } from './cms.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';

@Module({
  imports: [AdminAuthModule],
  controllers: [AdminCmsController, PublicCmsController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
