import { Module } from '@nestjs/common';
import { StockMovementsController } from './stock-movements.controller';
import { StockMovementsService } from './stock-movements.service';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { OdooModule } from '../integrations/odoo/odoo.module';

@Module({
  imports: [AdminAuthModule, OdooModule],
  controllers: [StockMovementsController],
  providers: [StockMovementsService],
})
export class StockMovementsModule {}
