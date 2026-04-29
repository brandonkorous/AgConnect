import { z } from 'zod';

export const waitlistRequestSchema = z.object({
  email: z.string().email('Invalid email').max(254),
  locale: z.enum(['en', 'es']).default('en'),
  audience: z.enum(['worker', 'employer', 'training_org', 'other']).optional(),
});

export type WaitlistRequest = z.infer<typeof waitlistRequestSchema>;

export const waitlistResponseSchema = z.object({
  ok: z.literal(true),
  message: z.string(),
});

export type WaitlistResponse = z.infer<typeof waitlistResponseSchema>;
