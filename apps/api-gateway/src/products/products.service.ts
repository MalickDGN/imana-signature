import { Injectable, NotFoundException } from '@nestjs/common';
import type {
  Product,
  ProductCategory,
} from '@imana-signature/shared-types';
import { OdooService } from '../integrations/odoo/odoo.service';
import { ListProductsQueryDto } from './dto/list-products-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';

interface OdooProductRecord {
  id: number;
  display_name?: unknown;
  list_price?: unknown;
  description_sale?: unknown;
  qty_available?: unknown;
  categ_id?: unknown;
  image_128?: unknown;
  default_code?: unknown;
  product_tmpl_id?: unknown;
  product_template_attribute_value_ids?: unknown;
}

const PRODUCT_FIELDS = [
  'display_name',
  'list_price',
  'description_sale',
  'qty_available',
  'categ_id',
  'image_128',
  'default_code',
  'product_tmpl_id',
  'product_template_attribute_value_ids',
];

@Injectable()
export class ProductsService {
  constructor(private readonly odooService: OdooService) {}

  async getMetrics(): Promise<{ products: number; stock: number; lowStock: number; value: number }> {
    const records = await this.odooService.findProducts(
      [['active', '=', true], ['sale_ok', '=', true]],
      ['id', 'qty_available', 'list_price'],
    );
    return records.reduce(
      (metrics, record) => {
        const stock = Number(record.qty_available ?? 0);
        const price = Number(record.list_price ?? 0);
        metrics.products += 1;
        metrics.stock += stock;
        metrics.value += stock * price;
        if (stock <= 5) metrics.lowStock += 1;
        return metrics;
      },
      { products: 0, stock: 0, lowStock: 0, value: 0 },
    );
  }

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

    const attributes = await this.loadAttributes(records as OdooProductRecord[]);
    const products = records.map((record) => this.toProduct(record as OdooProductRecord, attributes));
    const direction = query.sort === 'price_desc' ? -1 : 1;
    products.sort((left, right) => {
      if (query.sort.startsWith('price')) {
        return (left.price - right.price) * direction;
      }
      return left.name.localeCompare(right.name, 'fr');
    });

    const offset = query.offset ?? 0;
    return products.slice(offset, offset + query.limit);
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

    const attributes = await this.loadAttributes(records as OdooProductRecord[]);
    return this.toProduct(records[0] as OdooProductRecord, attributes);
  }

  async update(id: number, dto: UpdateProductDto): Promise<void> {
    const values: Record<string, unknown> = {};
    if (dto.price !== undefined) values.list_price = dto.price;
    if (dto.active !== undefined) values.active = dto.active;
    if (Object.keys(values).length === 0) return;
    await this.odooService.updateProduct(id, values);
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

  private async loadAttributes(records: OdooProductRecord[]): Promise<Map<number, [string, string]>> {
    const ids = records.flatMap((record) =>
      Array.isArray(record.product_template_attribute_value_ids)
        ? record.product_template_attribute_value_ids.map(Number).filter(Number.isInteger)
        : [],
    );
    const values = await this.odooService.findProductAttributeValues(ids);
    return new Map(values.map((value) => [
      value.id,
      [relationName(value.attribute_id), relationName(value.product_attribute_value_id)],
    ]));
  }

  private toProduct(record: OdooProductRecord, attributeValues: Map<number, [string, string]>): Product {
    const category = Array.isArray(record.categ_id)
      ? String(record.categ_id[1] ?? '')
      : undefined;
    const categoryId = Array.isArray(record.categ_id)
      ? String(record.categ_id[0] ?? '')
      : undefined;

    const attributes = Object.fromEntries(
      (Array.isArray(record.product_template_attribute_value_ids)
        ? record.product_template_attribute_value_ids
        : [])
        .map(Number)
        .map((id) => attributeValues.get(id))
        .filter((value): value is [string, string] => Boolean(value)),
    );
    const get = (...names: string[]) => {
      const entry = Object.entries(attributes).find(([key]) =>
        names.includes(normalizeAttribute(key)),
      );
      return entry?.[1];
    };
    const list = (...names: string[]) => (get(...names) ?? '')
      .split(/[,;|]/)
      .map((value) => normalizeAttribute(value))
      .filter(Boolean);

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
      sku: typeof record.default_code === 'string' ? record.default_code : undefined,
      templateId: Array.isArray(record.product_tmpl_id) ? String(record.product_tmpl_id[0]) : undefined,
      family: get('famille', 'famille olfactive') ?? category,
      gender: normalizeOptional(get('genre', 'sexe')),
      brand: normalizeOptional(get('marque', 'brand')),
      collection: get('collection'),
      badge: get('badge'),
      notes: get('notes', 'notes olfactives'),
      format: parseFormat(get('format', 'contenance')),
      accessoryType: normalizeOptional(get('type accessoire', 'accessoire')),
      seasons: list('saison', 'saisons'),
      occasions: list('occasion', 'occasions'),
      attributes,
      imageUrl:
        typeof record.image_128 === 'string' && record.image_128
          ? `/api/products/${record.id}/image`
          : undefined,
    };
  }
}

function relationName(value: unknown): string {
  return Array.isArray(value) ? String(value[1] ?? '') : String(value ?? '');
}

function normalizeAttribute(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function normalizeOptional(value?: string): string | undefined {
  return value ? normalizeAttribute(value) : undefined;
}

function parseFormat(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : undefined;
}
