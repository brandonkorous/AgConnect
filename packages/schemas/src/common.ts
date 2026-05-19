import { z } from 'zod';

export const CountyEnum = z.enum(['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare']);
export type County = z.infer<typeof CountyEnum>;

// URL-safe service-county slugs. Single source of truth for county routing and
// the per-county SEO landing pages. 1:1 with CountyEnum.
export const SERVICE_COUNTIES = ['fresno', 'kern', 'kings', 'madera', 'tulare'] as const;
export type CountySlug = (typeof SERVICE_COUNTIES)[number];

const SLUG_TO_COUNTY: Record<CountySlug, County> = {
  fresno: 'Fresno',
  kern: 'Kern',
  kings: 'Kings',
  madera: 'Madera',
  tulare: 'Tulare',
};

export function isCountySlug(value: string): value is CountySlug {
  return (SERVICE_COUNTIES as readonly string[]).includes(value.toLowerCase());
}

// Normalizes a raw slug ('Fresno', 'fresno', '%20' already decoded) to the
// canonical County enum value, or null if it is not a service county.
export function countyFromSlug(value: string): County | null {
  const slug = value.toLowerCase();
  return isCountySlug(slug) ? SLUG_TO_COUNTY[slug] : null;
}

export function slugForCounty(county: County): CountySlug {
  return county.toLowerCase() as CountySlug;
}

export type Locale = 'en' | 'es';

export const LocaleEnum = z.enum(['en', 'es']);

export const cursorSchema = z.string().min(1).max(200);

export const ApiOkSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ ok: z.literal(true), data });

export const ApiErrSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    fields: z.record(z.string(), z.string()).optional(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
});
