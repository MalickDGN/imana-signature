import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  Product,
  ProductCategory,
} from '@imana-signature/shared-types';
import { OdooService } from '../integrations/odoo/odoo.service';
import { ListProductsQueryDto } from './dto/list-products-query.dto';

interface OdooProductRecord {
  id: number;
  display_name?: unknown;
  list_price?: unknown;
  description_sale?: unknown;
  qty_available?: unknown;
  categ_id?: unknown;
  image_128?: unknown;
}

const PRODUCT_FIELDS = [
  'display_name',
  'list_price',
  'description_sale',
  'qty_available',
  'categ_id',
  'image_128',
];

@Injectable()
export class ProductsService {
  constructor(private readonly odooService: OdooService) {}

  async findAll(query: ListProductsQueryDto): Promise<Product[]> {
    const domain: Array<[string, string, unknown]> = [
      ['sale_ok', '=', true],
    ];
    if (query.search?.trim()) {
      domain.push(['name', 'ilike', query.search.trim()]);
    }
    if (query.category) {
      const categoryId = Number(query.category);
      domain.push([
        'categ_id',
        '=',
        Number.isInteger(categoryId) ? categoryId : query.category,
      ]);
    }

    const records = await this.odooService.findProducts(
      domain,
      PRODUCT_FIELDS,
    );

    const products = records.map((record) =>
      this.toProduct(record as OdooProductRecord),
    );
    const direction = query.sort === 'price_desc' ? -1 : 1;
    products.sort((left, right) => {
      if (query.sort.startsWith('price')) {
        return (left.price - right.price) * direction;
      }
      return left.name.localeCompare(right.name, 'fr');
    });

    return products.slice(0, query.limit);
  }

  async findCategories(): Promise<ProductCategory[]> {
    const records = await this.odooService.findProducts(
      [['sale_ok', '=', true]],
      ['categ_id'],
    );
    const categories = new Map<string, ProductCategory>();

    for (const record of records) {
      const category = record.categ_id;
      if (Array.isArray(category) && category.length >= 2) {
        const id = String(category[0]);
        categories.set(id, { id, name: String(category[1]) });
      }
    }

    return [...categories.values()].sort((left, right) =>
      left.name.localeCompare(right.name, 'fr'),
    );
  }

  async findOne(id: number): Promise<Product> {
    const records = await this.odooService.findProducts(
      [
        ['id', '=', id],
        ['sale_ok', '=', true],
      ],
      PRODUCT_FIELDS,
    );

    if (records.length === 0) {
      throw new NotFoundException(`Product ${id} was not found.`);
    }

    return this.toProduct(records[0] as OdooProductRecord);
  }

  async findImage(id: number): Promise<Buffer> {
    const records = await this.odooService.findProducts(
      [
        ['id', '=', id],
        ['sale_ok', '=', true],
      ],
      ['image_512'],
    );
    const image = records[0]?.image_512;
    if (typeof image !== 'string' || !image) {
      throw new NotFoundException(`Product ${id} has no image.`);
    }
    return Buffer.from(image, 'base64');
  }

  private toProduct(record: OdooProductRecord): Product {
    const category = Array.isArray(record.categ_id)
      ? String(record.categ_id[1] ?? '')
      : undefined;
    const categoryId = Array.isArray(record.categ_id)
      ? String(record.categ_id[0] ?? '')
      : undefined;

    return {
      id: String(record.id),
      name: String(record.display_name ?? 'Produit sans nom'),
      price: Number(record.list_price ?? 0),
      description:
        typeof record.description_sale === 'string'
          ? record.description_sale
          : undefined,
      stock: Number(record.qty_available ?? 0),
      category,
      categoryId,
      imageUrl:
        typeof record.image_128 === 'string' && record.image_128
          ? `/api/products/${record.id}/image`
          : undefined,
    };
  }
}
