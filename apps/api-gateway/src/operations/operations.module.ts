import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { OdooModule } from '../integrations/odoo/odoo.module';
import { OperationsController } from './operations.controller';
import { OperationsService } from './operations.service';

@Module({ imports: [AdminAuthModule, OdooModule], controllers: [OperationsController], providers: [OperationsService] })
export class OperationsModule {}
