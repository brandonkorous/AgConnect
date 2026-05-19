import { z } from 'zod';
import { countyFromSlug } from '@agconn/schemas';

export const publicJobsSortEnum = z.enum([
  'recent',
  'wage_desc',
  'wage_asc',
  'start_soon',
]);
export type PublicJobsSort = z.infer<typeof publicJobsSortEnum>;

// Validates the public job-browse query. Defaults reproduce the pre-existing
// behaviour (recent = createdAt desc, page size 20) so /jobs and FeaturedJobs
// are unaffected. `county` is normalized via the shared registry, never an
// unchecked cast.
export const publicJobsQuerySchema = z
  .object({
    county: z
      .string()
      .optional()
      .transform((v, ctx) => {
        if (v == null || v === '') return undefined;
        const c = countyFromSlug(v);
        if (!c) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'invalid_county' });
          return z.NEVER;
        }
        return c;
      }),
    sort: publicJobsSortEnum.default('recent'),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    cursor: z.string().min(1).max(400).optional(),
  })
  .strict();

export type PublicJobsQuery = z.infer<typeof publicJobsQuerySchema>;

export const waitlistRequestSchema = z
  .object({
    email: z.string().email('invalid_email').max(254).optional(),
    phone: z.string().min(7).max(20).optional(),
    locale: z.enum(['en', 'es']).default('es'),
    audience: z.enum(['worker', 'employer', 'training_org', 'other']).optional(),
    county: z.string().min(2).max(80).optional(),
    source: z
      .enum([
        'landing_final_cta',
        'landing_coming_soon',
        'landing_waitlist_form',
        'landing_newsletter',
      ])
      .default('landing_final_cta'),
  })
  .strict()
  .refine((b) => Boolean(b.email) || Boolean(b.phone), {
    message: 'email_or_phone_required',
  });

export type WaitlistRequest = z.infer<typeof waitlistRequestSchema>;

export const waitlistResponseSchema = z.object({
  status: z.enum(['queued', 'already_confirmed']),
  needsConfirm: z.boolean(),
});

export type WaitlistResponse = z.infer<typeof waitlistResponseSchema>;

export const tokenQuerySchema = z.object({
  token: z.string().min(10).max(2048),
});

export type TokenQuery = z.infer<typeof tokenQuerySchema>;

export type WaitlistConfirmResult = 'confirmed' | 'already' | 'expired' | 'invalid';
export type WaitlistUnsubscribeResult = 'unsubscribed' | 'already' | 'invalid';
