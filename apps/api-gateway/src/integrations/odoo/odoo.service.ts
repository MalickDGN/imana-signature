import {
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const OdooClient = require('odoo-await');

export type OdooDomain = Array<
  [field: string, operator: string, value: unknown]
>;

export interface OdooRecord {
  id: number;
  [key: string]: unknown;
}

export interface OdooClientInstance {
  connect(): Promise<void>;
  execute_kw(
    model: string,
    method: string,
    params: unknown[],
  ): Promise<unknown>;
}

export interface PartnerData {
  name: string;
  email: string;
  phone?: string;
  street?: string;
  city?: string;
}

export interface SalesOrderLine {
  product_id: number;
  product_uom_qty: number;
}

export interface CrmLeadData {
  name: string;
  contactName: string;
  email: string;
  phone?: string;
  message: string;
}

export interface CatalogImportProduct {
  sku: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  stock: number;
  barcode?: string;
  active: boolean;
  imageBase64?: string;
  attributes: Record<string, string>;
  variantGroup?: string;
}

export interface CatalogImportResult {
  action: 'created' | 'updated';
  productId: number;
  sku: string;
}

export interface PartnerImportData {
  externalRef: string;
  partnerType: 'client' | 'supplier' | 'both';
  name: string;
  companyType: 'person' | 'company';
  email?: string;
  phone?: string;
  mobile?: string;
  vat?: string;
  street?: string;
  street2?: string;
  city?: string;
  zip?: string;
  countryCode?: string;
  language?: string;
  customerSegment?: string;
  supplierSegment?: string;
  tags: string[];
  active: boolean;
}

export interface PartnerImportResult {
  action: 'created' | 'updated' | 'ignored';
  partnerId: number;
  externalRef: string;
}

export interface OdooConnectionOptions {
  baseUrl: string;
  port: number;
  db: string;
  username: string;
  password: string;
}

export type OdooClientFactory = (
  options: OdooConnectionOptions,
) => OdooClientInstance;

export const ODOO_CLIENT_FACTORY = Symbol('ODOO_CLIENT_FACTORY');

export const createOdooClient: OdooClientFactory = (options) =>
  new OdooClient(options);

@Injectable()
export class OdooService implements OnModuleInit {
  private readonly logger = new Logger(OdooService.name);
  private odoo?: OdooClientInstance;

  constructor(
    private readonly configService: ConfigService,
    @Inject(ODOO_CLIENT_FACTORY)
    private readonly clientFactory: OdooClientFactory,
  ) {}

  async onModuleInit() {
    const baseUrl = this.configService.get<string>('ODOO_URL');
    const db = this.configService.get<string>('ODOO_DB');
    const username = this.configService.get<string>('ODOO_USERNAME');
    const password = this.configService.get<string>('ODOO_PASSWORD');

    if (!baseUrl || !db || !username || !password) {
      this.logger.warn(
        'Odoo integration is disabled because its configuration is incomplete.',
      );
      return;
    }

    this.logger.log('Initializing Odoo connection...');

    try {
      const parsedUrl = new URL(baseUrl);
      const configuredPort = this.configService.get<string>('ODOO_PORT');
      const port = configuredPort
        ? Number(configuredPort)
        : parsedUrl.port
          ? Number(parsedUrl.port)
          : parsedUrl.protocol === 'https:'
            ? 443
            : 8069;
      const client = this.clientFactory({
        baseUrl,
        port,
        db,
        username,
        password,
      });
      await client.connect();
      this.odoo = client;
      this.logger.log('Odoo connection successful.');
    } catch (error) {
      this.odoo = undefined;
      this.logger.error(
        'Failed to connect to Odoo.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async findProducts(
    domain: OdooDomain = [],
    fields: string[] = [],
  ): Promise<OdooRecord[]> {
    return this.searchRead('product.product', domain, fields);
  }

  async findSalesOrders(
    domain: OdooDomain = [],
    fields: string[] = [],
    options: Record<string, unknown> = {},
  ): Promise<OdooRecord[]> {
    return this.searchRead('sale.order', domain, fields, options);
  }

  async findProductAttributeValues(ids: number[]): Promise<OdooRecord[]> {
    if (ids.length === 0) return [];
    return this.searchRead(
      'product.template.attribute.value',
      [['id', 'in', [...new Set(ids)]]],
      ['id', 'attribute_id', 'product_attribute_value_id'],
    );
  }

  async findSalesOrderByClientReference(reference: string): Promise<number | null> {
    const records = await this.searchRead(
      'sale.order',
      [['client_order_ref', '=', reference]],
      ['id'],
      { limit: 1 },
    );
    return records[0]?.id ?? null;
  }

  async getSalesOrderTotal(orderId: number): Promise<number> {
    const records = await this.searchRead(
      'sale.order',
      [['id', '=', orderId]],
      ['amount_total'],
      { limit: 1 },
    );
    return Number(records[0]?.amount_total ?? 0);
  }

  async findOrCreatePartner(partnerData: PartnerData): Promise<number> {
    const partners = await this.searchRead(
      'res.partner',
      [['email', '=', partnerData.email]],
      ['id'],
      { limit: 1 },
    );

    if (partners.length > 0) {
      return partners[0].id;
    }

    return this.create('res.partner', { ...partnerData });
  }

  async createSalesOrder(orderData: {
    partner_id: number;
    order_line: SalesOrderLine[];
    client_order_ref?: string;
  }): Promise<number> {
    return this.create('sale.order', {
      partner_id: orderData.partner_id,
      client_order_ref: orderData.client_order_ref,
      order_line: orderData.order_line.map((line) => [0, 0, line]),
    });
  }

  async confirmSalesOrder(orderId: number): Promise<void> {
    const client = this.getClient();
    await client.execute_kw('sale.order', 'action_confirm', [[[orderId]]]);
  }

  async cancelSalesOrder(orderId: number): Promise<void> {
    const client = this.getClient();
    await client.execute_kw('sale.order', 'action_cancel', [[[orderId]]]);
  }

  async findInvoices(
    domain: OdooDomain = [],
    fields: string[] = [],
    options: Record<string, unknown> = {},
  ): Promise<OdooRecord[]> {
    return this.searchRead('account.move', domain, fields, options);
  }

  async findDeliveries(
    domain: OdooDomain = [],
    fields: string[] = [],
    options: Record<string, unknown> = {},
  ): Promise<OdooRecord[]> {
    return this.searchRead('stock.picking', domain, fields, options);
  }

  async findStockMoves(
    domain: OdooDomain = [],
    fields: string[] = [],
    options: Record<string, unknown> = {},
  ): Promise<OdooRecord[]> {
    return this.searchRead('stock.move', domain, fields, options);
  }

  async findPartners(
    domain: OdooDomain = [],
    fields: string[] = [],
    options: Record<string, unknown> = {},
  ): Promise<OdooRecord[]> {
    return this.searchRead('res.partner', domain, fields, options);
  }

  async updateProduct(
    productId: number,
    values: Record<string, unknown>,
  ): Promise<void> {
    await this.write('product.product', productId, values);
  }

  async createCrmLead(lead: CrmLeadData): Promise<number> {
    return this.create('crm.lead', {
      name: lead.name,
      contact_name: lead.contactName,
      email_from: lead.email,
      phone: lead.phone,
      description: lead.message,
      type: 'lead',
    });
  }

  async importSimpleProduct(
    product: CatalogImportProduct,
  ): Promise<CatalogImportResult> {
    const categoryId = await this.findOrCreateCategory(product.category);
    const existing = await this.searchRead(
      'product.product',
      [['default_code', '=', product.sku]],
      ['id', 'product_tmpl_id'],
      { limit: 1 },
    );
    const templateValues = {
      name: product.name,
      categ_id: categoryId,
      description_sale: product.description || false,
      list_price: product.price,
      sale_ok: true,
      is_storable: true,
      active: product.active,
      ...(product.imageBase64 ? { image_1920: product.imageBase64 } : {}),
    };

    let productId: number;
    let action: 'created' | 'updated';
    if (existing.length > 0) {
      productId = existing[0].id;
      const templateId = relationId(existing[0].product_tmpl_id);
      await this.write('product.template', templateId, templateValues);
      await this.write('product.product', productId, {
        default_code: product.sku,
        barcode: product.barcode || false,
      });
      action = 'updated';
    } else {
      const templateId = await this.create('product.template', {
        ...templateValues,
        default_code: product.sku,
        barcode: product.barcode || false,
      });
      const variants = await this.searchRead(
        'product.product',
        [['product_tmpl_id', '=', templateId]],
        ['id'],
        { limit: 1 },
      );
      if (variants.length === 0) {
        throw new Error(`Odoo did not create a variant for ${product.sku}.`);
      }
      productId = variants[0].id;
      action = 'created';
    }

    await this.setProductStock(productId, product.stock);
    return { action, productId, sku: product.sku };
  }

  async findProductSkus(skus: string[]): Promise<Set<string>> {
    if (skus.length === 0) return new Set();
    const records = await this.searchRead(
      'product.product', [['default_code', 'in', [...new Set(skus)]]], ['default_code'],
    );
    return new Set(records.map((record) => String(record.default_code ?? '')).filter(Boolean));
  }

  async findPartnerReferences(references: string[]): Promise<Set<string>> {
    if (references.length === 0) return new Set();
    const records = await this.searchRead(
      'res.partner', [['ref', 'in', [...new Set(references)]]], ['ref'],
    );
    return new Set(records.map((record) => String(record.ref ?? '')).filter(Boolean));
  }

  async importVariantGroup(
    products: CatalogImportProduct[],
  ): Promise<CatalogImportResult[]> {
    if (products.length === 0) return [];
    const first = products[0];
    const categoryId = await this.findOrCreateCategory(first.category);
    const skus = products.map((product) => product.sku);
    const existingVariants = await this.searchRead(
      'product.product',
      [['default_code', 'in', skus]],
      ['id', 'default_code', 'product_tmpl_id'],
    );
    const knownTemplateId = existingVariants
      .map((variant) => relationId(variant.product_tmpl_id))
      .find((id) => id > 0);
    const templates = knownTemplateId
      ? [{ id: knownTemplateId }]
      : await this.searchRead(
          'product.template',
          [
            ['name', '=', first.name],
            ['categ_id', '=', categoryId],
          ],
          ['id'],
          { limit: 1 },
        );
    const templateValues = {
      name: first.name,
      categ_id: categoryId,
      description_sale: first.description || false,
      list_price: first.price,
      sale_ok: true,
      is_storable: true,
      active: first.active,
    };
    const templateId =
      templates.length > 0
        ? templates[0].id
        : await this.create('product.template', templateValues);
    if (templates.length > 0) {
      await this.write('product.template', templateId, templateValues);
    }

    const attributeValueIds = await this.ensureAttributeValues(products);
    for (const [attributeId, valueIds] of attributeValueIds) {
      const lines = await this.searchRead(
        'product.template.attribute.line',
        [
          ['product_tmpl_id', '=', templateId],
          ['attribute_id', '=', attributeId],
        ],
        ['id'],
        { limit: 1 },
      );
      if (lines.length > 0) {
        await this.write('product.template.attribute.line', lines[0].id, {
          value_ids: [[6, 0, valueIds]],
        });
      } else {
        await this.create('product.template.attribute.line', {
          product_tmpl_id: templateId,
          attribute_id: attributeId,
          value_ids: [[6, 0, valueIds]],
        });
      }
    }

    const variants = await this.searchRead(
      'product.product',
      [['product_tmpl_id', '=', templateId]],
      ['id', 'default_code', 'product_template_attribute_value_ids'],
    );
    const ptavIds = variants.flatMap((variant) =>
      numericIds(variant.product_template_attribute_value_ids),
    );
    const ptavs =
      ptavIds.length > 0
        ? await this.searchRead(
            'product.template.attribute.value',
            [['id', 'in', [...new Set(ptavIds)]]],
            ['id', 'attribute_id', 'product_attribute_value_id'],
          )
        : [];
    const signatures = new Map<number, string>();
    for (const ptav of ptavs) {
      const attributeName = relationName(ptav.attribute_id);
      const valueName = relationName(ptav.product_attribute_value_id);
      signatures.set(ptav.id, `${attributeName}=${valueName}`);
    }

    const results: CatalogImportResult[] = [];
    for (const product of products) {
      const signature = attributeSignature(product.attributes);
      const variant = variants.find((candidate) => {
        const candidateSignature = numericIds(
          candidate.product_template_attribute_value_ids,
        )
          .map((id) => signatures.get(id))
          .filter((value): value is string => Boolean(value))
          .sort()
          .join('|');
        return candidateSignature === signature;
      });
      if (!variant) {
        throw new Error(
          `No Odoo variant matches ${product.sku} (${signature}).`,
        );
      }
      const existed = existingVariants.some(
        (candidate) => candidate.id === variant.id,
      );
      await this.write('product.product', variant.id, {
        default_code: product.sku,
        barcode: product.barcode || false,
        active: product.active,
        ...(product.imageBase64
          ? { image_variant_1920: product.imageBase64 }
          : {}),
      });
      await this.setProductStock(variant.id, product.stock);
      results.push({
        action: existed ? 'updated' : 'created',
        productId: variant.id,
        sku: product.sku,
      });
    }

    return results;
  }

  async importPartner(
    partner: PartnerImportData,
  ): Promise<PartnerImportResult> {
    const existing = await this.searchRead(
      'res.partner',
      [['ref', '=', partner.externalRef]],
      [
        'id',
        'name',
        'company_type',
        'email',
        'phone',
        'mobile',
        'vat',
        'street',
        'street2',
        'city',
        'zip',
        'country_id',
        'lang',
        'customer_rank',
        'supplier_rank',
        'category_id',
        'active',
      ],
      { limit: 1 },
    );
    const countryId = partner.countryCode
      ? await this.findCountryByCode(partner.countryCode)
      : undefined;
    const tagNames = [
      ...partner.tags,
      ...(partner.customerSegment
        ? [`Client / ${partner.customerSegment}`]
        : []),
      ...(partner.supplierSegment
        ? [`Fournisseur / ${partner.supplierSegment}`]
        : []),
    ];
    const importedTagIds = await this.findOrCreatePartnerTags(tagNames);
    const existingTagIds = existing[0]
      ? numericIds(existing[0].category_id)
      : [];
    const categoryIds = [...new Set([...existingTagIds, ...importedTagIds])];
    const values: Record<string, unknown> = {
      ref: partner.externalRef,
      name: partner.name,
      company_type: partner.companyType,
      is_company: partner.companyType === 'company',
      email: partner.email || false,
      phone: partner.phone || false,
      mobile: partner.mobile || false,
      vat: partner.vat || false,
      street: partner.street || false,
      street2: partner.street2 || false,
      city: partner.city || false,
      zip: partner.zip || false,
      lang: partner.language || false,
      customer_rank:
        partner.partnerType === 'client' || partner.partnerType === 'both'
          ? 1
          : 0,
      supplier_rank:
        partner.partnerType === 'supplier' || partner.partnerType === 'both'
          ? 1
          : 0,
      category_id: [[6, 0, categoryIds]],
      active: partner.active,
      ...(countryId ? { country_id: countryId } : {}),
    };

    if (existing.length === 0) {
      const partnerId = await this.create('res.partner', values);
      return {
        action: 'created',
        partnerId,
        externalRef: partner.externalRef,
      };
    }

    const current = existing[0];
    if (partnerValuesMatch(current, values, categoryIds, countryId)) {
      return {
        action: 'ignored',
        partnerId: current.id,
        externalRef: partner.externalRef,
      };
    }
    await this.write('res.partner', current.id, values);
    return {
      action: 'updated',
      partnerId: current.id,
      externalRef: partner.externalRef,
    };
  }

  private async findCountryByCode(code: string): Promise<number> {
    const countries = await this.searchRead(
      'res.country',
      [['code', '=ilike', code]],
      ['id'],
      { limit: 1 },
    );
    if (countries.length === 0) {
      throw new Error(`Le pays ISO "${code}" n’existe pas dans Odoo.`);
    }
    return countries[0].id;
  }

  private async findOrCreatePartnerTags(names: string[]): Promise<number[]> {
    const ids: number[] = [];
    for (const name of [...new Set(names.map((value) => value.trim()))].filter(Boolean)) {
      const tags = await this.searchRead(
        'res.partner.category',
        [['name', '=ilike', name]],
        ['id'],
        { limit: 1 },
      );
      ids.push(
        tags[0]?.id ??
          (await this.create('res.partner.category', { name })),
      );
    }
    return ids;
  }

  private async ensureAttributeValues(
    products: CatalogImportProduct[],
  ): Promise<Map<number, number[]>> {
    const valuesByAttribute = new Map<string, Set<string>>();
    for (const product of products) {
      for (const [attribute, value] of Object.entries(product.attributes)) {
        const values = valuesByAttribute.get(attribute) ?? new Set<string>();
        values.add(value);
        valuesByAttribute.set(attribute, values);
      }
    }

    const result = new Map<number, number[]>();
    for (const [attributeName, values] of valuesByAttribute) {
      const attributes = await this.searchRead(
        'product.attribute',
        [['name', '=ilike', attributeName]],
        ['id'],
        { limit: 1 },
      );
      const attributeId =
        attributes[0]?.id ??
        (await this.create('product.attribute', { name: attributeName }));
      const valueIds: number[] = [];
      for (const valueName of values) {
        const existing = await this.searchRead(
          'product.attribute.value',
          [
            ['attribute_id', '=', attributeId],
            ['name', '=ilike', valueName],
          ],
          ['id'],
          { limit: 1 },
        );
        valueIds.push(
          existing[0]?.id ??
            (await this.create('product.attribute.value', {
              attribute_id: attributeId,
              name: valueName,
            })),
        );
      }
      result.set(attributeId, valueIds);
    }
    return result;
  }

  private async findOrCreateCategory(name: string): Promise<number> {
    const categories = await this.searchRead(
      'product.category',
      [['name', '=ilike', name]],
      ['id'],
      { limit: 1 },
    );
    return (
      categories[0]?.id ?? (await this.create('product.category', { name }))
    );
  }

  private async setProductStock(
    productId: number,
    quantity: number,
  ): Promise<void> {
    const locations = await this.searchRead(
      'stock.location',
      [['usage', '=', 'internal']],
      ['id', 'complete_name'],
      { limit: 1, order: 'id asc' },
    );
    if (locations.length === 0) {
      throw new Error('No internal Odoo stock location is available.');
    }
    const locationId = locations[0].id;
    const quants = await this.searchRead(
      'stock.quant',
      [
        ['product_id', '=', productId],
        ['location_id', '=', locationId],
      ],
      ['id'],
      { limit: 1 },
    );
    const quantId =
      quants[0]?.id ??
      (await this.create('stock.quant', {
        product_id: productId,
        location_id: locationId,
      }));
    await this.write('stock.quant', quantId, {
      inventory_quantity: quantity,
    });
    await this.call('stock.quant', 'action_apply_inventory', [[quantId]]);
  }

  private async searchRead(
    model: string,
    domain: OdooDomain,
    fields: string[],
    options: Record<string, unknown> = {},
  ): Promise<OdooRecord[]> {
    const client = this.getClient();
    const result = await client.execute_kw(model, 'search_read', [
      [domain],
      { fields, ...options },
    ]);
    return result as OdooRecord[];
  }

  private async create(
    model: string,
    values: Record<string, unknown>,
  ): Promise<number> {
    const client = this.getClient();
    const result = await client.execute_kw(model, 'create', [[values]]);
    return Number(result);
  }

  private async write(
    model: string,
    id: number,
    values: Record<string, unknown>,
  ): Promise<void> {
    const result = await this.call(model, 'write', [[id], values]);
    if (result !== true) {
      throw new Error(`Odoo refused to update ${model} ${id}.`);
    }
  }

  private async call(
    model: string,
    method: string,
    args: unknown[],
  ): Promise<unknown> {
    const client = this.getClient();
    return client.execute_kw(model, method, [[...args]]);
  }

  private getClient(): OdooClientInstance {
    if (!this.odoo) {
      throw new ServiceUnavailableException(
        'The Odoo integration is currently unavailable.',
      );
    }

    return this.odoo;
  }
}

function relationId(value: unknown): number {
  return Array.isArray(value) ? Number(value[0] ?? 0) : Number(value ?? 0);
}

function relationName(value: unknown): string {
  return Array.isArray(value) ? String(value[1] ?? '') : String(value ?? '');
}

function numericIds(value: unknown): number[] {
  return Array.isArray(value)
    ? value.map(Number).filter((id) => Number.isInteger(id) && id > 0)
    : [];
}

function attributeSignature(attributes: Record<string, string>): string {
  return Object.entries(attributes)
    .map(([attribute, value]) => `${attribute}=${value}`)
    .sort()
    .join('|');
}

function partnerValuesMatch(
  current: OdooRecord,
  values: Record<string, unknown>,
  categoryIds: number[],
  countryId?: number,
): boolean {
  const fields = [
    'name',
    'company_type',
    'email',
    'phone',
    'mobile',
    'vat',
    'street',
    'street2',
    'city',
    'zip',
    'lang',
    'customer_rank',
    'supplier_rank',
    'active',
  ];
  if (
    fields.some(
      (field) =>
        normalizeOdooValue(current[field]) !==
        normalizeOdooValue(values[field]),
    )
  ) {
    return false;
  }
  if (
    countryId &&
    relationId(current.country_id) !== countryId
  ) {
    return false;
  }
  const currentCategories = numericIds(current.category_id).sort((a, b) => a - b);
  const expectedCategories = [...categoryIds].sort((a, b) => a - b);
  return (
    currentCategories.length === expectedCategories.length &&
    currentCategories.every((id, index) => id === expectedCategories[index])
  );
}

function normalizeOdooValue(value: unknown): string {
  if (value === false || value === null || value === undefined) return '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return String(value);
}
