import { z } from 'zod';

export const ComplianceCategoryEnum = z.enum([
  'documentation',
  'safety',
  'wage_hour',
  'pesticide',
  'h2a',
  'custom',
]);
export type ComplianceCategory = z.infer<typeof ComplianceCategoryEnum>;

export const ComplianceItemStatusEnum = z.enum(['ok', 'warn', 'fail']);
export type ComplianceItemStatus = z.infer<typeof ComplianceItemStatusEnum>;

export const CreateComplianceItemBody = z
  .object({
    category: ComplianceCategoryEnum,
    itemKey: z.string().min(1).max(60),
    label: z.string().min(1).max(200),
    status: ComplianceItemStatusEnum.default('ok'),
    details: z.string().max(500).optional(),
    evidenceUrl: z.string().url().max(2048).optional(),
    dueAt: z.string().datetime().optional(),
  })
  .strict();
export type CreateComplianceItemBody = z.infer<typeof CreateComplianceItemBody>;

export const PatchComplianceItemBody = z
  .object({
    status: ComplianceItemStatusEnum.optional(),
    details: z.string().max(500).nullable().optional(),
    evidenceUrl: z.string().url().max(2048).nullable().optional(),
    dueAt: z.string().datetime().nullable().optional(),
    resolved: z.boolean().optional(),
    noteAppend: z.string().min(1).max(500).optional(),
  })
  .strict();
export type PatchComplianceItemBody = z.infer<typeof PatchComplianceItemBody>;

// Content for the sidebar instructions panel. Sourced from authoritative
// regulatory pages (USCIS, IRS, CDPR, Cal/OSHA, EPA, DLSE) and curated in
// packages/db/seed-data/compliance-item-content.ts. The API picks the
// requester's locale and ships the resolved strings inline with each item.
export const ComplianceInstructionsSchema = z.object({
  why: z.string(),
  how: z.array(z.string()),
  acceptableEvidence: z.array(z.string()),
  deadline: z.string().nullable(),
  source: z.object({ label: z.string(), url: z.string().url() }),
  extraSources: z.array(z.object({ label: z.string(), url: z.string().url() })).optional(),
  lastVerified: z.string(),
});
export type ComplianceInstructions = z.infer<typeof ComplianceInstructionsSchema>;

export const ComplianceItemSchema = z.object({
  id: z.string().uuid(),
  category: ComplianceCategoryEnum,
  itemKey: z.string(),
  label: z.string(),
  status: ComplianceItemStatusEnum,
  details: z.string().nullable(),
  evidenceUrl: z.string().nullable(),
  dueAt: z.string().nullable(),
  resolvedAt: z.string().nullable(),
  updatedAt: z.string(),
});
export type ComplianceItemView = z.infer<typeof ComplianceItemSchema>;
