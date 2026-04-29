# 01 — KPI Dashboard: API

All endpoints under `/admin/v1/kpi/*`. Auth: `userRole === 'admin'`.

## Common query

```ts
const KpiQuery = z.object({
  tenantIds: z.array(z.string().uuid()).optional(),     // omit → all tenants
  counties: z.array(CountyEnum).optional(),
  start: z.string().date(),                              // inclusive
  end: z.string().date(),                                // exclusive
}).strict()
  .refine((b) => b.start < b.end, 'date_order');
```

If `tenantIds` omitted, defaults to all non-deleted tenants the admin has access to.

## GET /admin/v1/kpi/summary

One-shot dashboard payload. Optimized so a single API call populates all tiles.

Response:

```ts
const KpiSummaryResponse = z.object({
  placements: z.object({
    count: z.number(),
    uniqueWorkers: z.number(),
    avgWage: z.number().nullable(),
    trend: TrendSchema,                  // { count: number, deltaPct: number }
  }),
  training: z.object({
    completedCount: z.number(),
    uniqueWorkers: z.number(),
    certCount: z.number(),
    trend: TrendSchema,
  }),
  employers: z.object({
    activeCount: z.number(),
    postingsCount: z.number(),
    hireRate: z.number().nullable(),       // 0..1
    trend: TrendSchema,
  }),
  wages: z.object({
    distribution: z.array(z.object({ bucket: z.number(), n: z.number() })),
    median: z.number().nullable(),
    p10: z.number().nullable(),
    p90: z.number().nullable(),
  }),
});
```

Server: runs all aggregations in parallel via `Promise.all`. P95 target < 1.5s.

## GET /admin/v1/kpi/series/:metric

Time series data for a single metric. Used for sparkline charts on tiles.

Query: same as summary, plus `interval=day|week|month`.

Path: `metric=placements|training|active_employers|hire_rate`.

Response:

```ts
const SeriesResponse = z.object({
  series: z.array(z.object({
    bucket: z.string().date(),       // start of interval
    value: z.number(),
  })),
});
```

## GET /admin/v1/kpi/breakdown/:dimension

Group-by breakdowns for tile drill-downs.

Path: `dimension=county|funder|skill|employer`.

For example, `GET /admin/v1/kpi/breakdown/county` returns placements grouped by county.

Response:

```ts
const BreakdownResponse = z.object({
  rows: z.array(z.object({
    key: z.string(),
    label: z.string(),
    value: z.number(),
  })),
});
```

## Errors

| code | http | when |
|---|---|---|
| `not_admin` | 403 | non-admin |
| `date_range_too_wide` | 422 | range > 2 years (defensive) |
| `validation_failed` | 422 | bad query params |
