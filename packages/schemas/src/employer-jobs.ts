import { z } from 'zod';
import { CountyEnum, LocaleEnum } from './common';
import { JobCardSchema } from './jobs';

const titleField = z.string().min(1).max(120);
const descriptionField = z.string().min(20).max(5000);

export const CreateJobBody = z
  .object({
    titleEn: titleField,
    titleEs: titleField,
    descriptionEn: descriptionField,
    descriptionEs: descriptionField,
    county: CountyEnum,
    city: z.string().max(60).optional(),
    zipCode: z.string().max(10).optional(),
    wageMin: z.number().min(0).max(500),
    wageMax: z.number().min(0).max(500),
    wageUnit: z.enum(['hour', 'day', 'piece']).default('hour'),
    startDate: z.string().date(),
    endDate: z.string().date().optional(),
    applyBy: z.string().date().optional(),
    skills: z.array(z.string().min(1).max(60)).max(15).default([]),
    housing: z.boolean().default(false),
    transport: z.boolean().default(false),
    positionsTotal: z.number().int().min(1).max(500).default(1),
  })
  .strict()
  .refine((b) => b.wageMin <= b.wageMax, { message: 'wage_order', path: ['wageMax'] })
  .refine((b) => !b.endDate || b.endDate >= b.startDate, {
    message: 'date_order',
    path: ['endDate'],
  });
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
    skills: z.array(z.string().min(1).max(60)).max(15).optional(),
    housing: z.boolean().optional(),
    transport: z.boolean().optional(),
    positionsTotal: z.number().int().min(1).max(500).optional(),
  })
  .strict();
export type PatchJobBody = z.infer<typeof PatchJobBody>;

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
