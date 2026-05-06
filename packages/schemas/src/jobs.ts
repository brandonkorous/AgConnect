import { z } from 'zod';
import { CountyEnum } from './common';

export const JobCardSchema = z.object({
  id: z.string().uuid(),
  seoSlug: z.string(),
  titleEn: z.string(),
  titleEs: z.string(),
  county: CountyEnum,
  city: z.string().nullable(),
  wageMin: z.number(),
  wageMax: z.number(),
  wageUnit: z.enum(['hour', 'day', 'piece']),
  startDate: z.string(),
  endDate: z.string().nullable(),
  employerName: z.string(),
  employerVerified: z.boolean(),
  skills: z.array(z.string()),
  housing: z.boolean(),
  transport: z.boolean(),
  createdAt: z.string().datetime(),
});
export type JobCard = z.infer<typeof JobCardSchema>;

export const JobFullSchema = JobCardSchema.extend({
  descriptionEn: z.string(),
  descriptionEs: z.string(),
  applyBy: z.string().nullable(),
  status: z.enum(['draft', 'active', 'closed', 'filled']),
  publishedAt: z.string().datetime().nullable(),
  applicationStatus: z.enum(['applied', 'reviewed', 'hired', 'rejected', 'withdrawn']).nullable(),
  applicationId: z.string().uuid().nullable(),
});
export type JobFull = z.infer<typeof JobFullSchema>;

export const JobsQuery = z
  .object({
    county: z.array(CountyEnum).optional(),
    skills: z.array(z.string()).optional(),
    wageMin: z.coerce.number().min(0).optional(),
    wageMax: z.coerce.number().min(0).optional(),
    startBefore: z.string().optional(),
    startAfter: z.string().optional(),
    q: z.string().max(120).optional(),
    sort: z.enum(['best', 'newest', 'wage_high', 'starts_soon']).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    cursor: z.string().min(1).max(200).optional(),
  })
  .strict();
export type JobsQuery = z.infer<typeof JobsQuery>;

export const JobsResponse = z.object({
  jobs: z.array(JobCardSchema),
  nextCursor: z.string().nullable(),
  total: z.number().optional(),
});

export const RecommendedResponse = z.object({
  jobs: z.array(JobCardSchema.extend({ matchScore: z.number().int() })),
});

// Saved searches -----------------------------------------------------------

export const SavedSearchFiltersSchema = z
  .object({
    county: z.array(CountyEnum).optional(),
    skills: z.array(z.string().min(1).max(60)).optional(),
    wageMin: z.number().min(0).optional(),
    wageMax: z.number().min(0).optional(),
    startBefore: z.string().optional(),
    startAfter: z.string().optional(),
    q: z.string().max(120).optional(),
  })
  .strict();
export type SavedSearchFilters = z.infer<typeof SavedSearchFiltersSchema>;

export const CreateSavedSearchBody = z
  .object({
    name: z.string().max(60).optional(),
    filters: SavedSearchFiltersSchema,
    alertChannel: z.enum(['sms', 'email', 'both', 'none']).default('sms'),
    alertActive: z.boolean().default(true),
  })
  .strict();
export type CreateSavedSearchBody = z.infer<typeof CreateSavedSearchBody>;

export const PatchSavedSearchBody = z
  .object({
    name: z.string().max(60).nullable().optional(),
    filters: SavedSearchFiltersSchema.optional(),
    alertChannel: z.enum(['sms', 'email', 'both', 'none']).optional(),
    alertActive: z.boolean().optional(),
  })
  .strict();

export const SavedSearchSchema = z.object({
  id: z.string().uuid(),
  name: z.string().nullable(),
  filters: SavedSearchFiltersSchema,
  alertChannel: z.enum(['sms', 'email', 'both', 'none']),
  alertActive: z.boolean(),
  lastNotifiedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
