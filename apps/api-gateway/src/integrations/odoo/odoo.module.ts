import { Module } from '@nestjs/common';
import {
  createOdooClient,
  ODOO_CLIENT_FACTORY,
  OdooService,
} from './odoo.service';

@Module({
  providers: [
    {
      provide: ODOO_CLIENT_FACTORY,
      useValue: createOdooClient,
    },
    OdooService,
  ],
  exports: [OdooService],
})
export class OdooModule {}
