import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { OdooModule } from '../integrations/odoo/odoo.module';

@Module({
  imports: [AdminAuthModule, OdooModule],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
