import { z } from 'zod';

export const CountyEnum = z.enum(['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare']);
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
