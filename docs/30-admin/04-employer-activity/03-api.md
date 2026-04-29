# 04 — Employer Activity Report: API

Endpoints under `/admin/v1/reports/employer/*`. Auth: `userRole === 'admin'`.

## GET /admin/v1/reports/employer/preview

Per-employer preview.

Query:

```ts
const EmployerActivityQuery = z.object({
  tenantIds: z.array(z.string().uuid()).optional(),
  counties: z.array(CountyEnum).optional(),
  licenseTypes: z.array(z.enum(['grower', 'flc', 'labor_contractor'])).optional(),
  start: z.string().date(),
  end: z.string().date(),
  view: z.enum(['rows', 'by_county', 'by_license_type']).default('rows'),
  preview: z.coerce.number().min(1).max(100).default(20),
}).strict();
```

Response: same shape as other reports.

## POST /admin/v1/reports/employer/export

Body matches the placement-report export pattern.

```ts
const ExportBody = EmployerActivityQuery.extend({
  format: z.enum(['csv', 'xlsx']).default('csv'),
  email: z.string().email().optional(),
});
```

## GET /admin/v1/employers/:id/activity

Drill into a single employer's full activity history. Used from KPI dashboard breakdown clicks.

Response includes:

```ts
{
  employer: EmployerProfileSchema,
  postings: JobPostingCardSchema[],            // their last 50 postings
  hires: ApplicationCardSchema[],              // their last 100 hires
  metrics: { /* same as report row */ },
}
```

## Errors

Same as other reports.
