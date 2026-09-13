import { BadRequestException, Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import {
  CATALOG_HEADERS,
  CatalogHeader,
  CatalogImportRow,
  EmbeddedImage,
  ImportIssue,
} from './catalog-import.types';

const MAX_ROWS = 5000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_EXTENSIONS = new Set(['png', 'jpeg', 'jpg', 'webp']);

@Injectable()
export class CatalogImportParser {
  async parse(buffer: Buffer): Promise<{
    analyzedRows: number;
    rows: CatalogImportRow[];
    issues: ImportIssue[];
  }> {
    const workbook = new ExcelJS.Workbook();
    try {
      const compatibleBuffer = await normalizeSpreadsheetNamespace(buffer);
      await workbook.xlsx.load(
        compatibleBuffer as unknown as ExcelJS.Buffer,
      );
    } catch {
      throw new BadRequestException(
        'Le fichier ne peut pas être lu comme un classeur Excel .xlsx.',
      );
    }

    const worksheet = workbook.getWorksheet('Produits');
    if (!worksheet) {
      throw new BadRequestException(
        'La feuille obligatoire "Produits" est absente.',
      );
    }

    const headerRowNumber = this.findHeaderRow(worksheet);
    const headerIndex = this.readHeaderIndex(worksheet, headerRowNumber);
    const issues: ImportIssue[] = [];
    for (const header of CATALOG_HEADERS) {
      if (!headerIndex.has(header)) {
        issues.push({
          row: headerRowNumber,
          field: 'file',
          severity: 'error',
          code: 'MISSING_COLUMN',
          message: `La colonne obligatoire "${header}" est absente.`,
        });
      }
    }
    if (issues.length > 0) return { analyzedRows: 0, rows: [], issues };

    const images = this.readEmbeddedImages(workbook, worksheet, issues);
    const rows: CatalogImportRow[] = [];
    let analyzedRows = 0;
    const lastRow = Math.min(worksheet.rowCount, headerRowNumber + MAX_ROWS);
    if (worksheet.rowCount - headerRowNumber > MAX_ROWS) {
      issues.push({
        row: headerRowNumber,
        field: 'file',
        severity: 'error',
        code: 'TOO_MANY_ROWS',
        message: `Le fichier dépasse la limite de ${MAX_ROWS} lignes.`,
      });
    }

    for (let rowNumber = headerRowNumber + 1; rowNumber <= lastRow; rowNumber++) {
      const row = worksheet.getRow(rowNumber);
      const values = Object.fromEntries(
        CATALOG_HEADERS.map((header) => [
          header,
          cellText(row.getCell(headerIndex.get(header)!)),
        ]),
      ) as Record<CatalogHeader, string>;
      if (
        !CATALOG_HEADERS.some((header) => Boolean(values[header])) &&
        !images.has(rowNumber)
      ) {
        continue;
      }
      analyzedRows += 1;
      const parsed = this.validateRow(rowNumber, values, images.get(rowNumber));
      issues.push(...parsed.issues);
      if (parsed.row) rows.push(parsed.row);
    }

    this.validateCrossRows(rows, issues);
    return { analyzedRows, rows, issues };
  }

  private findHeaderRow(worksheet: ExcelJS.Worksheet): number {
    for (let rowNumber = 1; rowNumber <= Math.min(10, worksheet.rowCount); rowNumber++) {
      const firstCells = worksheet
        .getRow(rowNumber)
        .values as Array<ExcelJS.CellValue>;
      if (firstCells.some((value) => String(value ?? '').trim() === 'reference_interne')) {
        return rowNumber;
      }
    }
    throw new BadRequestException(
      'Impossible de trouver la ligne d’en-tête "reference_interne".',
    );
  }

  private readHeaderIndex(
    worksheet: ExcelJS.Worksheet,
    rowNumber: number,
  ): Map<CatalogHeader, number> {
    const result = new Map<CatalogHeader, number>();
    worksheet.getRow(rowNumber).eachCell((cell, columnNumber) => {
      const header = cellText(cell) as CatalogHeader;
      if ((CATALOG_HEADERS as readonly string[]).includes(header)) {
        result.set(header, columnNumber);
      }
    });
    return result;
  }

  private readEmbeddedImages(
    workbook: ExcelJS.Workbook,
    worksheet: ExcelJS.Worksheet,
    issues: ImportIssue[],
  ): Map<number, EmbeddedImage> {
    const images = new Map<number, EmbeddedImage>();
    for (const placedImage of worksheet.getImages()) {
      const rowNumber = Math.floor(placedImage.range.tl.nativeRow) + 1;
      const image = workbook.getImage(Number(placedImage.imageId));
      if (!image?.buffer || !image.extension) continue;
      const extension = image.extension.toLowerCase();
      const buffer = Buffer.from(image.buffer);
      if (!ALLOWED_IMAGE_EXTENSIONS.has(extension)) {
        issues.push({
          row: rowNumber,
          field: 'image_integree',
          severity: 'error',
          code: 'IMAGE_FORMAT',
          message: 'L’image doit être au format PNG, JPEG ou WebP.',
        });
      } else if (buffer.byteLength > MAX_IMAGE_BYTES) {
        issues.push({
          row: rowNumber,
          field: 'image_integree',
          severity: 'error',
          code: 'IMAGE_TOO_LARGE',
          message: 'L’image dépasse la limite de 5 Mo.',
        });
      } else if (images.has(rowNumber)) {
        issues.push({
          row: rowNumber,
          field: 'image_integree',
          severity: 'error',
          code: 'MULTIPLE_IMAGES',
          message: 'Une seule image peut être associée à une ligne.',
        });
      } else {
        images.set(rowNumber, { buffer, extension });
      }
    }
    return images;
  }

  private validateRow(
    rowNumber: number,
    values: Record<CatalogHeader, string>,
    image?: EmbeddedImage,
  ): { row?: CatalogImportRow; issues: ImportIssue[] } {
    const issues: ImportIssue[] = [];
    const required: CatalogHeader[] = [
      'reference_interne',
      'nom_produit',
      'categorie',
      'prix_vente_fcfa',
      'quantite_stock',
      'type_produit',
    ];
    for (const field of required) {
      if (!values[field]) {
        issues.push(error(rowNumber, field, 'REQUIRED', 'Valeur obligatoire.'));
      }
    }

    if (values.reference_interne && !/^[A-Za-z0-9._-]{2,64}$/.test(values.reference_interne)) {
      issues.push(
        error(
          rowNumber,
          'reference_interne',
          'INVALID_SKU',
          'Utilisez 2 à 64 lettres, chiffres, points, tirets ou underscores.',
        ),
      );
    }
    const price = parseNumber(values.prix_vente_fcfa);
    if (!Number.isFinite(price) || price < 0) {
      issues.push(
        error(
          rowNumber,
          'prix_vente_fcfa',
          'INVALID_PRICE',
          'Le prix doit être un nombre positif ou nul.',
        ),
      );
    } else if (price === 0) {
      issues.push(
        warning(
          rowNumber,
          'prix_vente_fcfa',
          'ZERO_PRICE',
          'Le produit sera importé avec un prix de vente nul.',
        ),
      );
    }
    const stock = parseNumber(values.quantite_stock);
    if (!Number.isInteger(stock) || stock < 0) {
      issues.push(
        error(
          rowNumber,
          'quantite_stock',
          'INVALID_STOCK',
          'Le stock doit être un entier positif ou nul.',
        ),
      );
    } else if (stock === 0) {
      issues.push(
        warning(
          rowNumber,
          'quantite_stock',
          'ZERO_STOCK',
          'Le produit sera importé en rupture de stock.',
        ),
      );
    }

    const productType = values.type_produit.toLowerCase();
    if (productType !== 'simple' && productType !== 'variante') {
      issues.push(
        error(
          rowNumber,
          'type_produit',
          'INVALID_TYPE',
          'Valeurs autorisées : simple ou variante.',
        ),
      );
    }
    const attributes = parseAttributes(values.attributs, rowNumber, issues);
    if (productType === 'variante' && !values.groupe_variantes) {
      issues.push(
        error(
          rowNumber,
          'groupe_variantes',
          'VARIANT_GROUP_REQUIRED',
          'Le groupe est obligatoire pour une variante.',
        ),
      );
    }
    if (productType === 'variante' && Object.keys(attributes).length === 0) {
      issues.push(
        error(
          rowNumber,
          'attributs',
          'ATTRIBUTES_REQUIRED',
          'Au moins un attribut est obligatoire pour une variante.',
        ),
      );
    }
    if (productType === 'simple' && values.groupe_variantes) {
      issues.push(
        warning(
          rowNumber,
          'groupe_variantes',
          'IGNORED_VARIANT_GROUP',
          'Le groupe de variantes sera ignoré pour un produit simple.',
        ),
      );
    }
    if (values.code_barres && !/^[0-9]{8,14}$/.test(values.code_barres)) {
      issues.push(
        error(
          rowNumber,
          'code_barres',
          'INVALID_BARCODE',
          'Le code-barres doit contenir entre 8 et 14 chiffres.',
        ),
      );
    }
    if (!image) {
      issues.push(
        warning(
          rowNumber,
          'image_integree',
          'IMAGE_MISSING',
          'Aucune image intégrée n’est associée à cette ligne.',
        ),
      );
    }

    if (issues.some((issue) => issue.severity === 'error')) {
      return { issues };
    }
    return {
      row: {
        rowNumber,
        sku: values.reference_interne,
        name: values.nom_produit,
        category: values.categorie,
        description: values.description || undefined,
        price,
        stock,
        productType: productType === 'variante' ? 'variant' : 'simple',
        variantGroup:
          productType === 'variante' ? values.groupe_variantes : undefined,
        attributes,
        barcode: values.code_barres || undefined,
        image,
        active: !['non', 'no', '0', 'false'].includes(
          values.actif.toLowerCase(),
        ),
      },
      issues,
    };
  }

  private validateCrossRows(
    rows: CatalogImportRow[],
    issues: ImportIssue[],
  ): void {
    const skuRows = new Map<string, number>();
    const barcodeRows = new Map<string, number>();
    const groupRows = new Map<string, CatalogImportRow[]>();
    for (const row of rows) {
      const normalizedSku = row.sku.toLowerCase();
      if (skuRows.has(normalizedSku)) {
        issues.push(
          error(
            row.rowNumber,
            'reference_interne',
            'DUPLICATE_SKU',
            `Référence déjà utilisée à la ligne ${skuRows.get(normalizedSku)}.`,
          ),
        );
      } else {
        skuRows.set(normalizedSku, row.rowNumber);
      }
      if (row.barcode) {
        if (barcodeRows.has(row.barcode)) {
          issues.push(
            error(
              row.rowNumber,
              'code_barres',
              'DUPLICATE_BARCODE',
              `Code-barres déjà utilisé à la ligne ${barcodeRows.get(row.barcode)}.`,
            ),
          );
        } else {
          barcodeRows.set(row.barcode, row.rowNumber);
        }
      }
      if (row.productType === 'variant' && row.variantGroup) {
        const group = groupRows.get(row.variantGroup) ?? [];
        group.push(row);
        groupRows.set(row.variantGroup, group);
      }
    }

    for (const [groupName, group] of groupRows) {
      const first = group[0];
      const signatureRows = new Map<string, number>();
      for (const row of group) {
        if (
          row.name !== first.name ||
          row.category.toLowerCase() !== first.category.toLowerCase() ||
          row.price !== first.price
        ) {
          issues.push(
            error(
              row.rowNumber,
              'variants',
              'INCONSISTENT_VARIANT_GROUP',
              `Le groupe "${groupName}" doit partager nom, catégorie et prix.`,
            ),
          );
        }
        const signature = Object.entries(row.attributes)
          .map(([key, value]) => `${key}=${value}`)
          .sort()
          .join('|');
        if (signatureRows.has(signature)) {
          issues.push(
            error(
              row.rowNumber,
              'attributs',
              'DUPLICATE_COMBINATION',
              `Combinaison déjà utilisée à la ligne ${signatureRows.get(signature)}.`,
            ),
          );
        } else {
          signatureRows.set(signature, row.rowNumber);
        }
      }
    }
  }
}

export async function normalizeSpreadsheetNamespace(
  buffer: Buffer,
): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);
  const spreadsheetNamespace =
    'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
  let changed = false;

  for (const entry of Object.values(zip.files)) {
    if (
      entry.dir ||
      !entry.name.startsWith('xl/') ||
      !entry.name.endsWith('.xml')
    ) {
      continue;
    }
    const xml = await entry.async('string');
    if (!xml.includes('<x:')) continue;
    changed = true;
    zip.file(
      entry.name,
      xml
        .replace(
          `xmlns:x="${spreadsheetNamespace}"`,
          `xmlns="${spreadsheetNamespace}"`,
        )
        .replace(/<(\/?)x:/g, '<$1'),
    );
  }

  return changed
    ? Buffer.from(await zip.generateAsync({ type: 'nodebuffer' }))
    : buffer;
}

function cellText(cell: ExcelJS.Cell): string {
  return cell.text.trim();
}

function parseNumber(value: string): number {
  if (!value) return Number.NaN;
  return Number(value.replace(/\s/g, '').replace(',', '.'));
}

function parseAttributes(
  value: string,
  row: number,
  issues: ImportIssue[],
): Record<string, string> {
  if (!value) return {};
  const result: Record<string, string> = {};
  for (const pair of value.split('|')) {
    const separator = pair.indexOf('=');
    const name = pair.slice(0, separator).trim();
    const attributeValue = pair.slice(separator + 1).trim();
    if (separator <= 0 || !name || !attributeValue) {
      issues.push(
        error(
          row,
          'attributs',
          'INVALID_ATTRIBUTE',
          `Attribut invalide "${pair}". Format attendu : Nom=Valeur.`,
        ),
      );
      continue;
    }
    if (result[name]) {
      issues.push(
        error(
          row,
          'attributs',
          'DUPLICATE_ATTRIBUTE',
          `L’attribut "${name}" est déclaré plusieurs fois.`,
        ),
      );
    }
    result[name] = attributeValue;
  }
  return result;
}

function error(
  row: number,
  field: ImportIssue['field'],
  code: string,
  message: string,
): ImportIssue {
  return { row, field, code, message, severity: 'error' };
}

function warning(
  row: number,
  field: ImportIssue['field'],
  code: string,
  message: string,
): ImportIssue {
  return { row, field, code, message, severity: 'warning' };
}
