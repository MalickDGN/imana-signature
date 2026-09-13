import { Injectable } from '@nestjs/common';
import { OdooService } from '../integrations/odoo/odoo.service';
import { CreateContactDto } from './dto/create-contact.dto';

@Injectable()
export class ContactsService {
  constructor(private readonly odooService: OdooService) {}

  async createLead(contact: CreateContactDto) {
    const id = await this.odooService.createCrmLead({
      name: `Contact site - ${contact.name}`,
      contactName: contact.name,
      email: contact.email,
      phone: contact.phone,
      message: contact.message,
    });

    return { id, status: 'received' };
  }
}
