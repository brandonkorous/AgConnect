// Minimal CSV writer. Defaults to UTF-8 with BOM so Excel auto-detects
// encoding correctly when grantees double-click the file. Per
// docs/30-admin/02-placement-report/07-acceptance.md §1.4.

const UTF8_BOM = '﻿';

export type CsvCell = string | number | boolean | null | undefined | Date;

export type CsvOptions = {
  bom?: boolean;
};

export function toCsv(
  rows: ReadonlyArray<Record<string, CsvCell>>,
  columns: ReadonlyArray<string>,
  options: CsvOptions = {},
): Buffer {
  const lines: string[] = [];
  lines.push(columns.map(escape).join(','));
  for (const row of rows) {
    lines.push(columns.map((c) => escape(format(row[c]))).join(','));
  }
  const body = lines.join('\r\n');
  const out = options.bom === false ? body : `${UTF8_BOM}${body}`;
  return Buffer.from(out, 'utf-8');
}

function format(v: CsvCell): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

function escape(v: string): string {
  if (v.includes('"') || v.includes(',') || v.includes('\n') || v.includes('\r')) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}
