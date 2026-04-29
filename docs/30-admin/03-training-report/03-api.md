# 03 — Training Report: API

Mirrors placement-report API ([02-placement-report/03-api.md](../02-placement-report/03-api.md)). Endpoints under `/admin/v1/reports/training/*`.

## GET /admin/v1/reports/training/preview

Per-enrollment preview.

Query:

```ts
const TrainingReportQuery = z.object({
  tenantIds: z.array(z.string().uuid()).optional(),
  funders: z.array(z.enum(['CDFA', 'F3', 'CalOSBA', 'EDD', 'other'])).optional(),
  orgIds: z.array(z.string().uuid()).optional(),
  counties: z.array(CountyEnum).optional(),
  start: z.string().date(),
  end: z.string().date(),
  scope: z.enum(['enrollments', 'completions']).default('enrollments'),
  // enrollments → row per enrollment in date range
  // completions → only rows where status = completed in date range
  view: z.enum(['rows', 'by_program', 'by_funder', 'by_org']).default('rows'),
  includeNames: z.boolean().default(false),
  preview: z.coerce.number().min(1).max(100).default(20),
}).strict();
```

Response: same shape as placement-report preview.

## POST /admin/v1/reports/training/export

Same shape as placement-report export. Body:

```ts
const ExportBody = TrainingReportQuery.extend({
  format: z.enum(['csv', 'xlsx']).default('csv'),
  email: z.string().email().optional(),
});
```

Server: runs query based on `view`:

- `rows` → per-enrollment rows
- `by_program` → aggregated rows per program
- `by_funder` → aggregated rows per funder
- `by_org` → aggregated rows per training org

Same CSV / XLSX rendering as placement-report.

`report_runs.reportType = 'training'`. Filters logged. Email delivery optional.

## Errors

Same shape as placement-report. Additional: `org_not_found` (422) if `orgIds` references unknown org.
