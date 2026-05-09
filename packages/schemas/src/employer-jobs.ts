import { z } from 'zod';
import { CountyEnum, LocaleEnum } from './common.js';
import { JobCardSchema } from './jobs.js';
import { SKILL_SLUGS } from './skill-slugs.js';

const SkillSlugEnum = z.enum(SKILL_SLUGS);

const titleField = z.string().min(1).max(120);
const descriptionField = z.string().min(20).max(5000);
const uuid = z.string().uuid();

// ─── Lookup table enums (mirrors @agconn/db enums) ─────────────────────────

export const WageStructureEnum = z.enum(['hourly', 'hourly_piece', 'piece']);
export type WageStructure = z.infer<typeof WageStructureEnum>;

export const PayFrequencyEnum = z.enum(['weekly', 'biweekly', 'daily']);
export type PayFrequency = z.infer<typeof PayFrequencyEnum>;

export const MinExperienceEnum = z.enum(['none', 'one_year', 'three_years', 'five_years']);
export type MinExperience = z.infer<typeof MinExperienceEnum>;

export const MinAgeEnum = z.enum(['sixteen', 'eighteen', 'twenty_one']);
export type MinAge = z.infer<typeof MinAgeEnum>;

export const ScreeningAnswerTypeEnum = z.enum(['yes_no', 'text']);
export type ScreeningAnswerType = z.infer<typeof ScreeningAnswerTypeEnum>;

// HH:MM 24h
const timeOfDay = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'time_format');

// Bitmask 0..127 (bit 0 = Mon, bit 6 = Sun)
const workingDaysMask = z.number().int().min(0).max(127);

// ─── Screening question shapes ─────────────────────────────────────────────

export const ScreeningQuestionInput = z
  .object({
    id: uuid.optional(), // present on existing rows; absent on new
    sortOrder: z.number().int().min(0).max(99).default(0),
    questionEn: z.string().min(3).max(280),
    questionEs: z.string().min(3).max(280),
    answerType: ScreeningAnswerTypeEnum.default('yes_no'),
    required: z.boolean().default(true),
  })
  .strict();
export type ScreeningQuestionInput = z.infer<typeof ScreeningQuestionInput>;

export const ScreeningQuestionView = ScreeningQuestionInput.required({ id: true });
export type ScreeningQuestionView = z.infer<typeof ScreeningQuestionView>;

// ─── Photo shapes (uploads happen separately; this is the row shape) ──────

export const JobPhotoView = z.object({
  id: uuid,
  url: z.string().url(),
  captionEn: z.string().nullable(),
  captionEs: z.string().nullable(),
  width: z.number().int().nullable(),
  height: z.number().int().nullable(),
  sortOrder: z.number().int(),
});
export type JobPhotoView = z.infer<typeof JobPhotoView>;

export const PhotoReorderBody = z
  .object({
    order: z.array(uuid).min(1).max(6),
  })
  .strict();

// ─── Employer contacts ─────────────────────────────────────────────────────

export const EmployerContactInput = z
  .object({
    name: z.string().min(2).max(120),
    phone: z.string().min(7).max(40),
    role: z.string().min(2).max(40).default('foreman'),
    languages: z.array(z.enum(['en', 'es'])).min(1).max(2).default(['en', 'es']),
    sortOrder: z.number().int().min(0).max(999).default(0),
  })
  .strict();
export type EmployerContactInput = z.infer<typeof EmployerContactInput>;

export const EmployerContactView = EmployerContactInput.extend({ id: uuid });
export type EmployerContactView = z.infer<typeof EmployerContactView>;

// ─── Lookup row views ──────────────────────────────────────────────────────

export const CropView = z.object({
  id: uuid,
  slug: z.string(),
  labelEn: z.string(),
  labelEs: z.string(),
  glyphKey: z.string(),
  sortOrder: z.number().int(),
});
export type CropView = z.infer<typeof CropView>;

export const RoleTypeView = z.object({
  id: uuid,
  slug: z.string(),
  labelEn: z.string(),
  labelEs: z.string(),
  sortOrder: z.number().int(),
});
export type RoleTypeView = z.infer<typeof RoleTypeView>;

export const SkillTagView = z.object({
  id: uuid,
  slug: z.string(),
  labelEn: z.string(),
  labelEs: z.string(),
  category: z.string(),
  sortOrder: z.number().int(),
});
export type SkillTagView = z.infer<typeof SkillTagView>;

// ─── CreateJobBody / PatchJobBody ──────────────────────────────────────────

const editJobV2Fields = {
  cropId: uuid.nullable().optional(),
  roleTypeId: uuid.nullable().optional(),
  dailyStartTime: timeOfDay.nullable().optional(),
  dailyEndTime: timeOfDay.nullable().optional(),
  workingDays: workingDaysMask.optional(),
  wageStructure: WageStructureEnum.optional(),
  pieceRate: z.number().min(0).max(1000).nullable().optional(),
  pieceUnit: z.string().min(1).max(20).nullable().optional(),
  payFrequency: PayFrequencyEnum.optional(),
  mealsProvided: z.boolean().optional(),
  endOfSeasonBonusCents: z.number().int().min(0).max(1_000_000).nullable().optional(),
  pickupPoint: z.string().max(160).nullable().optional(),
  minExperience: MinExperienceEnum.optional(),
  minAge: MinAgeEnum.optional(),
  autoMatchEnabled: z.boolean().optional(),
  autoTranslateEnabled: z.boolean().optional(),
  smsApplyEnabled: z.boolean().optional(),
  applicationDeadlineAt: z.string().datetime().nullable().optional(),
  foremanContactId: uuid.nullable().optional(),
  siteAddress: z.string().max(160).nullable().optional(),
  siteAcres: z.number().min(0).max(100_000).nullable().optional(),
  screeningQuestions: z.array(ScreeningQuestionInput).max(10).optional(),
};

export const CreateJobBody = z
  .object({
    titleEn: titleField,
    titleEs: titleField,
    descriptionEn: descriptionField,
    descriptionEs: descriptionField,
    county: CountyEnum,
    // Allow null on optional fields so the JobForm's toApiBody can use a
    // single shape for both create and patch (it sends `null` for cleared
    // optional values).
    city: z.string().max(60).nullable().optional(),
    zipCode: z.string().max(10).nullable().optional(),
    wageMin: z.number().min(0).max(500),
    wageMax: z.number().min(0).max(500),
    wageUnit: z.enum(['hour', 'day', 'piece']).default('hour'),
    startDate: z.string().date(),
    endDate: z.string().date().nullable().optional(),
    applyBy: z.string().date().nullable().optional(),
    skills: z.array(SkillSlugEnum).max(15).default([]),
    housing: z.boolean().default(false),
    transport: z.boolean().default(false),
    positionsTotal: z.number().int().min(1).max(500).default(1),
    ...editJobV2Fields,
  })
  .strict()
  .refine((b) => b.wageMin <= b.wageMax, { message: 'wage_order', path: ['wageMax'] })
  .refine((b) => !b.endDate || b.endDate >= b.startDate, {
    message: 'date_order',
    path: ['endDate'],
  })
  .refine(
    (b) => {
      const both = b.dailyStartTime && b.dailyEndTime;
      return !both || (b.dailyStartTime as string) < (b.dailyEndTime as string);
    },
    { message: 'time_order', path: ['dailyEndTime'] },
  )
  .refine(
    (b) => {
      if (b.wageStructure === 'piece' || b.wageStructure === 'hourly_piece') {
        return b.pieceRate != null && b.pieceUnit != null;
      }
      return b.pieceRate == null && b.pieceUnit == null;
    },
    { message: 'piece_consistency', path: ['pieceRate'] },
  );
export type CreateJobBody = z.infer<typeof CreateJobBody>;

export const PatchJobBody = z
  .object({
    titleEn: titleField.optional(),
    titleEs: titleField.optional(),
    descriptionEn: descriptionField.optional(),
    descriptionEs: descriptionField.optional(),
    county: CountyEnum.optional(),
    city: z.string().max(60).nullable().optional(),
    zipCode: z.string().max(10).nullable().optional(),
    wageMin: z.number().min(0).max(500).optional(),
    wageMax: z.number().min(0).max(500).optional(),
    wageUnit: z.enum(['hour', 'day', 'piece']).optional(),
    startDate: z.string().date().optional(),
    endDate: z.string().date().nullable().optional(),
    applyBy: z.string().date().nullable().optional(),
    skills: z.array(SkillSlugEnum).max(15).optional(),
    housing: z.boolean().optional(),
    transport: z.boolean().optional(),
    positionsTotal: z.number().int().min(1).max(500).optional(),
    // Renotify gate. `undefined` = server-decides (back-compat: enqueues iff
    // active job has material diff + active applicants). `true` = same as
    // undefined but explicit. `false` = suppress queue even when material diff
    // exists (the "Save & don't notify" save-bar action).
    notifyApplicants: z.boolean().optional(),
    ...editJobV2Fields,
  })
  .strict();
export type PatchJobBody = z.infer<typeof PatchJobBody>;

// Autosave is a softer-validated shape: every field optional, no cross-field
// refinements, accepts partial inputs. Drafts only.
export const AutosaveJobBody = PatchJobBody;
export type AutosaveJobBody = z.infer<typeof AutosaveJobBody>;

export const CloseJobBody = z
  .object({
    reason: z.enum(['filled', 'expired', 'changed_mind']).optional(),
  })
  .strict();

export const TranslateJobBody = z
  .object({
    field: z.enum(['title', 'description']),
    fromLocale: LocaleEnum,
    toLocale: LocaleEnum,
    text: z.string().min(1).max(5000),
  })
  .strict()
  .refine((b) => b.fromLocale !== b.toLocale, {
    message: 'same_locale',
    path: ['toLocale'],
  });

export const TranslateJobResponse = z.object({
  translation: z.string(),
  untranslated: z.boolean(),
  model: z.string().nullable(),
});

export const ApplicationCountsSchema = z.object({
  applied: z.number().int(),
  reviewed: z.number().int(),
  hired: z.number().int(),
  rejected: z.number().int(),
});

// ─── Card / detail views ───────────────────────────────────────────────────

export const EmployerJobCardSchema = JobCardSchema.extend({
  status: z.enum(['draft', 'active', 'closed', 'filled']),
  positionsTotal: z.number().int(),
  hireCount: z.number().int(),
  publishedAt: z.string().datetime().nullable(),
  filledAt: z.string().datetime().nullable(),
  closedAt: z.string().datetime().nullable(),
  applicationCounts: ApplicationCountsSchema,
});
export type EmployerJobCard = z.infer<typeof EmployerJobCardSchema>;

export const EmployerJobDetailSchema = EmployerJobCardSchema.extend({
  // Edit-Job v2 surface
  cropId: uuid.nullable(),
  roleTypeId: uuid.nullable(),
  dailyStartTime: z.string().nullable(),
  dailyEndTime: z.string().nullable(),
  workingDays: z.number().int(),
  wageStructure: WageStructureEnum,
  pieceRate: z.number().nullable(),
  pieceUnit: z.string().nullable(),
  payFrequency: PayFrequencyEnum,
  mealsProvided: z.boolean(),
  endOfSeasonBonusCents: z.number().int().nullable(),
  pickupPoint: z.string().nullable(),
  minExperience: MinExperienceEnum,
  minAge: MinAgeEnum,
  autoMatchEnabled: z.boolean(),
  autoTranslateEnabled: z.boolean(),
  renotifyPaused: z.boolean(),
  smsApplyEnabled: z.boolean(),
  smsApplyKeyword: z.string().nullable(),
  applicationDeadlineAt: z.string().datetime().nullable(),
  foremanContact: EmployerContactView.nullable(),
  siteAddress: z.string().nullable(),
  siteAcres: z.number().nullable(),
  siteLat: z.number().nullable(),
  siteLng: z.number().nullable(),
  humanId: z.string().nullable(),
  autosavedAt: z.string().datetime().nullable(),
  photos: z.array(JobPhotoView),
  screeningQuestions: z.array(ScreeningQuestionView),
});
export type EmployerJobDetail = z.infer<typeof EmployerJobDetailSchema>;

export const EmployerJobsQuery = z
  .object({
    status: z.enum(['draft', 'active', 'filled', 'closed']).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    cursor: z.string().min(1).max(200).optional(),
  })
  .strict();

export const EmployerJobsResponse = z.object({
  jobs: z.array(EmployerJobCardSchema),
  nextCursor: z.string().nullable(),
});

// ─── Match preview ─────────────────────────────────────────────────────────

export const MatchPreviewQuery = z
  .object({
    // Hono's query parser collapses a single repeated param ("?skills=foo") to
    // a string and only widens to an array on 2+ values. Accept either and
    // normalize to an array so the route always sees a list.
    skills: z
      .union([z.string(), z.array(z.string())])
      .optional()
      .transform((v) => (v == null ? [] : Array.isArray(v) ? v : [v]))
      .pipe(z.array(z.string()).max(15)),
    minExperience: MinExperienceEnum.optional(),
    minAge: MinAgeEnum.optional(),
    county: CountyEnum.optional(),
    siteLat: z.coerce.number().min(-90).max(90).optional(),
    siteLng: z.coerce.number().min(-180).max(180).optional(),
    radiusMiles: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict();

export const MatchPreviewResponse = z.object({
  qualifyingCount: z.number().int(),
  topMatchCount: z.number().int(), // capped at 30 — informs auto-match copy
  radiusMiles: z.number().int(),
});

// ─── Photo upload responses ────────────────────────────────────────────────

export const JobPhotoUploadResponse = z.object({
  photo: JobPhotoView,
});
