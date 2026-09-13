export const PARTNER_HEADERS = [
  'reference_externe',
  'type_partenaire',
  'nom',
  'type_entite',
  'email',
  'telephone',
  'mobile',
  'identifiant_fiscal',
  'adresse',
  'complement_adresse',
  'ville',
  'code_postal',
  'code_pays_iso',
  'langue',
  'segment_client',
  'segment_fournisseur',
  'tags',
  'actif',
] as const;

export type PartnerHeader = (typeof PARTNER_HEADERS)[number];

export interface PartnerImportIssue {
  row: number;
  field: PartnerHeader | 'file' | 'import';
  severity: 'error' | 'warning';
  code: string;
  message: string;
}

export interface PartnerImportRow {
  rowNumber: number;
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

export interface PartnerImportRowResult {
  row: number;
  externalRef: string;
  status: 'ready' | 'created' | 'updated' | 'ignored' | 'failed';
  message: string;
}

export interface PartnerImportBatch {
  id: string;
  fileName: string;
  createdAt: Date;
  expiresAt: Date;
  status: 'validated' | 'importing' | 'completed' | 'failed';
  analyzedRows: number;
  rows: PartnerImportRow[];
  issues: PartnerImportIssue[];
  results: PartnerImportRowResult[];
}

export interface PartnerImportResponse {
  batchId: string;
  fileName: string;
  status: PartnerImportBatch['status'];
  expiresAt: string;
  summary: {
    totalRows: number;
    validRows: number;
    errors: number;
    warnings: number;
    created: number;
    updated: number;
    ignored: number;
    failed: number;
  };
  issues: PartnerImportIssue[];
  results: PartnerImportRowResult[];
  canImport: boolean;
}
