import { Module } from '@nestjs/common';
import { OdooModule } from '../integrations/odoo/odoo.module';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

@Module({
  imports: [OdooModule],
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}
