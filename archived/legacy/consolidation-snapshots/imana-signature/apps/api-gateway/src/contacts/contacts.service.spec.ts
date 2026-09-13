import { describe, expect, it, vi } from 'vitest';
import { OdooService } from '../integrations/odoo/odoo.service';
import { ContactsService } from './contacts.service';

describe('ContactsService', () => {
  it('maps a website request to an Odoo CRM lead', async () => {
    const odoo = {
      createCrmLead: vi.fn().mockResolvedValue(77),
    };
    const service = new ContactsService(odoo as unknown as OdooService);

    await expect(
      service.createLead({
        name: 'Awa Ndiaye',
        email: 'awa@example.com',
        phone: '+221770000000',
        message: 'Je souhaite un conseil.',
      }),
    ).resolves.toEqual({ id: 77, status: 'received' });

    expect(odoo.createCrmLead).toHaveBeenCalledWith({
      name: 'Contact site - Awa Ndiaye',
      contactName: 'Awa Ndiaye',
      email: 'awa@example.com',
      phone: '+221770000000',
      message: 'Je souhaite un conseil.',
    });
  });
});
