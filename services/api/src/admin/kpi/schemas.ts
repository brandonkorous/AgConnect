import { z } from 'zod';

const CountyEnum = z.enum(['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare']);

const arrayOf = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess((v) => (typeof v === 'string' ? [v] : v), z.array(item));

export const kpiQuery = z
  .object({
    tenantIds: arrayOf(z.string().uuid()).optional(),
    counties: arrayOf(CountyEnum).optional(),
    start: z.string().date(),
    end: z.string().date(),
  })
  .strict()
  .refine((v) => v.start < v.end, { message: 'date_order', path: ['end'] })
  .refine(
    (v) => yearsBetween(v.start, v.end) <= 2,
    { message: 'date_range_too_wide', path: ['end'] },
  );

export type KpiQuery = z.infer<typeof kpiQuery>;

function yearsBetween(start: string, end: string): number {
  const a = Date.parse(`${start}T00:00:00Z`);
  const b = Date.parse(`${end}T00:00:00Z`);
  return (b - a) / (365.25 * 24 * 60 * 60 * 1000);
}
