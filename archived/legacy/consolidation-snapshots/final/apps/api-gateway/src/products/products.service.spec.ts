import { NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { OdooService } from '../integrations/odoo/odoo.service';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const odoo = {
    findProducts: vi.fn(),
  };
  const service = new ProductsService(odoo as unknown as OdooService);

  it('maps, sorts and limits Odoo products', async () => {
    odoo.findProducts.mockResolvedValue([
      {
        id: 2,
        display_name: 'Santal',
        list_price: 72000,
        qty_available: 3,
        categ_id: [8, 'Boisés'],
      },
      {
        id: 1,
        display_name: 'Ambre',
        list_price: 68000,
        qty_available: 4,
        categ_id: [7, 'Orientaux'],
      },
    ]);

    const products = await service.findAll({
      sort: 'price_desc',
      limit: 1,
    } as ListProductsQueryDto);

    expect(products).toEqual([
      expect.objectContaining({
        id: '2',
        name: 'Santal',
        price: 72000,
        category: 'Boisés',
        categoryId: '8',
      }),
    ]);
  });

  it('returns unique sorted categories', async () => {
    odoo.findProducts.mockResolvedValue([
      { id: 1, categ_id: [8, 'Boisés'] },
      { id: 2, categ_id: [7, 'Agrumes'] },
      { id: 3, categ_id: [8, 'Boisés'] },
    ]);

    await expect(service.findCategories()).resolves.toEqual([
      { id: '7', name: 'Agrumes' },
      { id: '8', name: 'Boisés' },
    ]);
  });

  it('returns a not-found error for an unknown product', async () => {
    odoo.findProducts.mockResolvedValue([]);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('decodes the Odoo product image', async () => {
    const image = Buffer.from('image-bytes');
    odoo.findProducts.mockResolvedValue([
      { id: 12, image_512: image.toString('base64') },
    ]);

    await expect(service.findImage(12)).resolves.toEqual(image);
    expect(odoo.findProducts).toHaveBeenCalledWith(
      [
        ['id', '=', 12],
        ['sale_ok', '=', true],
      ],
      ['image_512'],
    );
  });

  it('rejects a product without an image', async () => {
    odoo.findProducts.mockResolvedValue([{ id: 12, image_512: false }]);

    await expect(service.findImage(12)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
