import { Module } from '@nestjs/common';
import { OdooModule } from '../integrations/odoo/odoo.module';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  imports: [OdooModule],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
