import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OdooService } from '../integrations/odoo/odoo.service';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  const odoo = {
    findProducts: vi.fn(),
    findProductAttributeValues: vi.fn().mockResolvedValue([]),
  };
  const service = new ProductsService(odoo as unknown as OdooService);

  beforeEach(() => {
    odoo.findProductAttributeValues.mockResolvedValue([]);
  });

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

  it('calculates catalogue metrics across more than 100 products', async () => {
    odoo.findProducts.mockResolvedValue(Array.from({ length: 150 }, (_, index) => ({
      id: index + 1,
      qty_available: index < 10 ? 5 : 10,
      list_price: 100,
    })));

    await expect(service.getMetrics()).resolves.toEqual({
      products: 150,
      stock: 1450,
      lowStock: 10,
      value: 145000,
    });
    expect(odoo.findProducts).toHaveBeenCalledWith(
      [['active', '=', true], ['sale_ok', '=', true]],
      ['id', 'qty_available', 'list_price'],
    );
  });

  it('maps Odoo variant attributes to storefront facets', async () => {
    odoo.findProducts.mockResolvedValue([{
      id: 5,
      display_name: 'Rose',
      list_price: 50000,
      product_template_attribute_value_ids: [10, 11],
    }]);
    odoo.findProductAttributeValues.mockResolvedValue([
      { id: 10, attribute_id: [1, 'Genre'], product_attribute_value_id: [2, 'Femme'] },
      { id: 11, attribute_id: [3, 'Format'], product_attribute_value_id: [4, '100 ml'] },
    ]);

    await expect(service.findAll({ limit: 40, offset: 0, sort: 'name_asc' } as ListProductsQueryDto))
      .resolves.toEqual([expect.objectContaining({ gender: 'femme', format: 100 })]);
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
