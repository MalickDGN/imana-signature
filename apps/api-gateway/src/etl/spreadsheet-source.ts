import { BadRequestException } from '@nestjs/common';
import ExcelJS from 'exceljs';

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const CSV_MIMES = new Set(['text/csv', 'text/plain', 'application/csv', 'application/vnd.ms-excel']);

export async function normalizeSpreadsheetSource(file: Express.Multer.File): Promise<Buffer> {
  const extension = file.originalname.toLowerCase().split('.').pop();
  if (extension === 'xlsx') {
    if (file.mimetype !== XLSX_MIME || file.buffer.subarray(0, 2).toString() !== 'PK') throw new BadRequestException('Le contenu ne correspond pas à un classeur XLSX valide.');
    return file.buffer;
  }
  if (extension !== 'csv' || !CSV_MIMES.has(file.mimetype)) throw new BadRequestException('Seuls les fichiers .xlsx et .csv sont acceptés.');
  let text: string;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(file.buffer).replace(/^\uFEFF/, ''); }
  catch { throw new BadRequestException('Le CSV doit être encodé en UTF-8.'); }
  if (text.includes('\0')) throw new BadRequestException('Le CSV contient des données binaires interdites.');
  const rows = parseCsv(text, detectDelimiter(text));
  if (!rows.length) throw new BadRequestException('Le CSV est vide.');
  const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet('Import');
  for (const row of rows) sheet.addRow(row.map((value) => /^[=+\-@]/.test(value.trimStart()) ? `'${value}` : value));
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function detectDelimiter(text: string): ',' | ';' | '\t' {
  const line = text.split(/\r?\n/, 1)[0] ?? '';
  return ([',', ';', '\t'] as const).map((delimiter) => ({ delimiter, count: line.split(delimiter).length - 1 })).sort((a, b) => b.count - a.count)[0].delimiter;
}

function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false;
  for (let index = 0; index < text.length; index += 1) { const char = text[index];
    if (char === '"') { if (quoted && text[index + 1] === '"') { cell += '"'; index += 1; } else quoted = !quoted; }
    else if (char === delimiter && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && text[index + 1] === '\n') index += 1; row.push(cell); if (row.some((value) => value.trim())) rows.push(row); row = []; cell = ''; }
    else cell += char;
  }
  if (quoted) throw new BadRequestException('Le CSV contient une valeur entre guillemets non terminée.');
  row.push(cell); if (row.some((value) => value.trim())) rows.push(row); return rows;
}
