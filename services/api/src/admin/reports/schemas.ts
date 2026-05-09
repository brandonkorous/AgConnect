import { z } from 'zod';

const FunderEnum = z.enum(['CDFA', 'F3', 'CalOSBA', 'EDD', 'other']);
const CountyEnum = z.enum(['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare']);

export const placementReportQuery = z
  .object({
    tenantIds: z.array(z.string().uuid()).optional(),
    counties: z.array(CountyEnum).optional(),
    funders: z.array(FunderEnum).optional(),
    start: z.string().date(),
    end: z.string().date(),
    includeNames: z.coerce.boolean().default(false),
    preview: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine((v) => v.start <= v.end, {
    message: 'start must be on or before end',
    path: ['start'],
  })
  .refine(
    (v) => yearsBetween(v.start, v.end) <= 2,
    { message: 'date_range_too_wide', path: ['end'] },
  );

export type PlacementReportQuery = z.infer<typeof placementReportQuery>;

export const placementExportBody = z
  .object({
    tenantIds: z.array(z.string().uuid()).optional(),
    counties: z.array(CountyEnum).optional(),
    funders: z.array(FunderEnum).optional(),
    start: z.string().date(),
    end: z.string().date(),
    includeNames: z.boolean().default(false),
    format: z.enum(['csv', 'xlsx']).default('csv'),
    email: z.string().email().optional(),
  })
  .strict()
  .refine((v) => v.start <= v.end, {
    message: 'start must be on or before end',
    path: ['start'],
  })
  .refine(
    (v) => yearsBetween(v.start, v.end) <= 2,
    { message: 'date_range_too_wide', path: ['end'] },
  );

export type PlacementExportBody = z.infer<typeof placementExportBody>;

export const reportRunsQuery = z
  .object({
    reportType: z.enum(['placement', 'training', 'employer']).optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    limit: z.coerce.number().int().min(1).max(200).default(50),
  })
  .strict();

export type ReportRunsQuery = z.infer<typeof reportRunsQuery>;

function yearsBetween(start: string, end: string): number {
  const a = Date.parse(`${start}T00:00:00Z`);
  const b = Date.parse(`${end}T00:00:00Z`);
  return (b - a) / (365.25 * 24 * 60 * 60 * 1000);
}
