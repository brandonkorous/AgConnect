import { z } from 'zod';
import { CountyEnum, LocaleEnum } from './common.js';
import { ResumeSchema } from './resume.js';

// 7-day weekly availability, half-day granularity. See
// docs/10-worker/01-onboarding/02-data-model.md.
const HalfDay = z.object({ am: z.boolean(), pm: z.boolean() }).strict();

export const AvailabilitySchema = z
  .object({
    mon: HalfDay.default({ am: false, pm: false }),
    tue: HalfDay.default({ am: false, pm: false }),
    wed: HalfDay.default({ am: false, pm: false }),
    thu: HalfDay.default({ am: false, pm: false }),
    fri: HalfDay.default({ am: false, pm: false }),
    sat: HalfDay.default({ am: false, pm: false }),
    sun: HalfDay.default({ am: false, pm: false }),
    notes: z.string().max(280).optional(),
  })
  .strict();

export type Availability = z.infer<typeof AvailabilitySchema>;

export const WorkerProfileSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  zipCode: z.string().nullable(),
  county: CountyEnum.nullable(),
  skills: z.array(z.string()),
  availability: AvailabilitySchema,
  resume: ResumeSchema.nullable(),
  resumeRawUrl: z.string().nullable(),
  onboardedAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime(),
});

// Onboarding ----------------------------------------------------------------

export const OnboardingNextStep = z.enum([
  'language',
  'resume_upload',
  'profile_review',
  'county',
  'skills',
  'availability',
  'complete',
]);
export type OnboardingNextStep = z.infer<typeof OnboardingNextStep>;

export const StartResponseSchema = z.object({
  user: z.object({
    id: z.string(),
    role: z.string(),
    preferredLang: LocaleEnum,
    onboarded: z.boolean(),
  }),
  next_step: OnboardingNextStep,
});

export const SetLanguageBody = z.object({ lang: LocaleEnum }).strict();

export const PatchOnboardingProfileBody = z
  .object({
    resume: ResumeSchema.partial().optional(),
    county: CountyEnum.optional(),
    zipCode: z.string().regex(/^\d{5}$/).optional(),
    skills: z.array(z.string().min(1).max(60)).max(20).optional(),
    availability: AvailabilitySchema.optional(),
    email: z.string().email().optional(),
    firstName: z.string().min(1).max(60).optional(),
    lastName: z.string().min(1).max(60).optional(),
  })
  .strict();
export type PatchOnboardingProfileBody = z.infer<typeof PatchOnboardingProfileBody>;

export const WaitlistBody = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().min(7).max(20).optional(),
    county: z.string().min(2).max(80),
    preferredLang: LocaleEnum.default('es'),
  })
  .strict()
  .refine((b) => Boolean(b.email) || Boolean(b.phone), {
    message: 'email_or_phone_required',
  });

// Profile editor ------------------------------------------------------------

export const PatchProfileBody = z
  .object({
    firstName: z.string().min(1).max(60).optional(),
    lastName: z.string().min(1).max(60).optional(),
    email: z.string().email().nullable().optional(),
    zipCode: z.string().regex(/^\d{5}$/).nullable().optional(),
    county: CountyEnum.optional(),
    skills: z.array(z.string().min(1).max(60)).max(20).optional(),
    availability: AvailabilitySchema.optional(),
    resume: ResumeSchema.partial().optional(),
    expectedUpdatedAt: z.string().datetime().optional(),
  })
  .strict();
export type PatchProfileBody = z.infer<typeof PatchProfileBody>;
