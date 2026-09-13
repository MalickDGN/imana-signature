import { Global, Module } from '@nestjs/common';
import { PortalDatabaseService } from './portal-database.service';

@Global()
@Module({
  providers: [PortalDatabaseService],
  exports: [PortalDatabaseService],
})
export class PortalDatabaseModule {}
