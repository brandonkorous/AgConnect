import { z } from 'zod';

export const listTranslationsQuery = z.object({
  // 'platform' filters tenantId IS NULL; a tenant uuid filters to that tenant
  // (which also includes platform globals as a base when missing — handled in
  // the assembly view, not here).
  scope: z.enum(['platform', 'tenant']).default('platform'),
  tenantId: z.string().uuid().optional(),
  namespace: z.string().min(1).max(200).optional(),
  search: z.string().min(1).max(200).optional(),
  status: z.enum(['draft', 'needs_review', 'reviewed', 'published']).optional(),
  // when true: only return key pairs missing one side (EN or ES)
  missingOnly: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .transform((v) => v === true || v === 'true')
    .optional(),
  limit: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .pipe(z.number().int().min(1).max(500))
    .default(100),
  cursor: z.string().optional(),
});

export const updateTranslationBody = z.object({
  value: z.string().max(20_000),
});

export const createTranslationBody = z.object({
  scope: z.enum(['platform', 'tenant']),
  tenantId: z.string().uuid().optional(),
  namespace: z.string().min(1).max(200),
  key: z.string().min(1).max(200),
  // Create both EN and ES in one call when at least one value is provided.
  // The translation editor row is a (namespace, key) pair, so creating both
  // sides together matches the UI mental model.
  valueEn: z.string().max(20_000).optional(),
  valueEs: z.string().max(20_000).optional(),
});
