import { z } from 'zod';

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
