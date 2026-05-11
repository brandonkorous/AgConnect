import type { Context } from 'hono';

// RFC 4180 CSV with UTF-8 BOM so Excel detects encoding correctly. Newlines
// inside cells are kept (quoted); embedded quotes are doubled. Header row is
// always present.

export type CsvColumn<T> = { header: string; value: (row: T) => string | number | boolean | null | undefined };

function escapeCell(raw: string | number | boolean | null | undefined): string {
  if (raw === null || raw === undefined) return '';
  const s = String(raw);
  if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function rowsToCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const lines: string[] = [];
  lines.push(columns.map((c) => escapeCell(c.header)).join(','));
  for (const r of rows) {
    lines.push(columns.map((c) => escapeCell(c.value(r))).join(','));
  }
  return '﻿' + lines.join('\r\n') + '\r\n';
}

// Return a Response containing the CSV body with the right headers. Filename
// is sanitized server-side so the client cannot inject path-style characters.
export function csvResponse(c: Context, filename: string, csv: string): Response {
  const safeName = filename.replace(/[^a-z0-9_\-.]/gi, '_').slice(0, 80);
  return new Response(csv, {
    status: 200,
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${safeName}"`,
      'cache-control': 'no-store',
    },
  });
}
