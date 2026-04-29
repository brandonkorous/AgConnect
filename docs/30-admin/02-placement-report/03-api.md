# 02 — Placement Report: API

All endpoints under `/admin/v1/reports/placement/*`. Auth: `userRole === 'admin'`.

## GET /admin/v1/reports/placement/preview

Returns the first N rows of the report as JSON for preview in the admin UI.

Query:

```ts
const PlacementReportQuery = z.object({
  tenantIds: z.array(z.string().uuid()).optional(),
  counties: z.array(CountyEnum).optional(),
  funders: z.array(z.enum(['CDFA', 'F3', 'CalOSBA', 'EDD', 'other'])).optional(),
  start: z.string().date(),
  end: z.string().date(),
  includeNames: z.boolean().default(false),
  preview: z.coerce.number().min(1).max(100).default(20),
}).strict();
```

Response:

```ts
const PreviewResponse = z.object({
  rows: z.array(z.record(z.string(), z.union([z.string(), z.number(), z.null()]))),
  totalCount: z.number(),
  columns: z.array(z.string()),
});
```

## POST /admin/v1/reports/placement/export

Generate a full CSV or XLSX file. Synchronous (< 30s) for typical sizes.

Body:

```ts
const ExportBody = PlacementReportQuery.extend({
  format: z.enum(['csv', 'xlsx']).default('csv'),
  email: z.string().email().optional(),         // if set, deliver via email instead of inline
});
```

Server logic:

1. Run the canonical query.
2. Stream rows into CSV (using `papaparse` or manual) or XLSX (using `exceljs`).
3. If `email` set: upload to Blob, send email with download link, return `{ status: 'queued' }`.
4. Otherwise: return file inline with `Content-Disposition: attachment; filename="placement-report-2026-Q1.csv"`.

Either way: insert `ReportRun` row.

```ts
api.post('/admin/v1/reports/placement/export', async (c) => {
  const body = ExportBody.parse(await c.req.json());
  const rows = await runPlacementReport(body);

  const filename = `placement-report-${body.start}-${body.end}.${body.format}`;
  const buffer = body.format === 'csv' ? toCsv(rows) : await toXlsx(rows);

  await db.reportRun.create({
    data: { reportType: 'placement', filters: body, rowCount: rows.length, format: body.format, generatedBy: c.get('userId') },
  });

  if (body.email) {
    const blobPath = `reports/${c.get('userId')}/${nanoid()}.${body.format}`;
    await azureBlob.upload(blobPath, buffer, { contentType: mimeFor(body.format) });
    await enqueueEmail({
      tenantId: '...',
      userId: c.get('userId'),
      template: 'grant.report_ready',
      vars: { reportName: 'Placement Report', dateRange: `${body.start} to ${body.end}`, rowCount: rows.length },
      attachments: [{ filename, content: buffer, contentType: mimeFor(body.format) }],
    });
    return c.json({ status: 'queued' });
  }

  return c.body(buffer, 200, {
    'Content-Type': mimeFor(body.format),
    'Content-Disposition': `attachment; filename="${filename}"`,
  });
});
```

## GET /admin/v1/reports/runs

List historical report runs (audit).

Query: `?reportType=placement&from=...&to=...&limit=50`

Response: `{ runs: ReportRun[] }`.

## GET /admin/v1/reports/runs/:id/download

Re-download a previously archived report (if `blobPath` set).

## CSV / XLSX rendering

```ts
// packages/reporting/src/csv.ts
import { unparse } from 'papaparse';
export function toCsv(rows: Record<string, any>[]): Buffer {
  return Buffer.from(unparse(rows, { header: true, quotes: true }), 'utf-8');
}

// packages/reporting/src/xlsx.ts
import ExcelJS from 'exceljs';
export async function toXlsx(rows: Record<string, any>[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Placement Report');
  if (rows.length === 0) { return Buffer.from(await wb.xlsx.writeBuffer()); }
  ws.columns = Object.keys(rows[0]).map(k => ({ header: k, key: k, width: 20 }));
  ws.addRows(rows);
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];   // frozen header
  ws.autoFilter = { from: 'A1', to: ws.lastColumn?.letter + '1' };
  return Buffer.from(await wb.xlsx.writeBuffer());
}
```

## Errors

| code | http | when |
|---|---|---|
| `not_admin` | 403 | non-admin |
| `date_range_too_wide` | 422 | range > 2 years |
| `validation_failed` | 422 | bad query params |
| `report_too_large` | 413 | row count > 100k (defensive) |
