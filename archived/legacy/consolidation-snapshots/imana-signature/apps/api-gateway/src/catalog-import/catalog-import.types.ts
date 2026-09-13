export const CATALOG_HEADERS = [
  'reference_interne',
  'nom_produit',
  'categorie',
  'description',
  'prix_vente_fcfa',
  'quantite_stock',
  'type_produit',
  'groupe_variantes',
  'attributs',
  'code_barres',
  'image_integree',
  'actif',
] as const;

export type CatalogHeader = (typeof CATALOG_HEADERS)[number];
export type ImportSeverity = 'error' | 'warning';
export type ImportBatchStatus =
  | 'validated'
  | 'importing'
  | 'completed'
  | 'failed';

export interface ImportIssue {
  row: number;
  field: CatalogHeader | 'file' | 'variants' | 'import';
  severity: ImportSeverity;
  code: string;
  message: string;
}

export interface EmbeddedImage {
  buffer: Buffer;
  extension: string;
}

export interface CatalogImportRow {
  rowNumber: number;
  sku: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  stock: number;
  productType: 'simple' | 'variant';
  variantGroup?: string;
  attributes: Record<string, string>;
  barcode?: string;
  image?: EmbeddedImage;
  active: boolean;
}

export interface ImportRowResult {
  row: number;
  sku: string;
  status: 'ready' | 'created' | 'updated' | 'failed';
  message: string;
}

export interface CatalogImportBatch {
  id: string;
  fileName: string;
  createdAt: Date;
  expiresAt: Date;
  status: ImportBatchStatus;
  analyzedRows: number;
  rows: CatalogImportRow[];
  issues: ImportIssue[];
  results: ImportRowResult[];
}

export interface ImportBatchResponse {
  batchId: string;
  fileName: string;
  status: ImportBatchStatus;
  expiresAt: string;
  summary: {
    totalRows: number;
    validRows: number;
    errors: number;
    warnings: number;
    created: number;
    updated: number;
    failed: number;
  };
  issues: ImportIssue[];
  results: ImportRowResult[];
  canImport: boolean;
}
