import { z } from 'zod';
import { PrismaNamespace, type Tx } from '@agconn/db';

const FunderEnum = z.enum(['CDFA', 'F3', 'CalOSBA', 'EDD', 'other']);
const CountyEnum = z.enum(['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare']);

const arrayOf = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess((v) => (typeof v === 'string' ? [v] : v), z.array(item));

export const trainingReportQuery = z
  .object({
    tenantIds: arrayOf(z.string().uuid()).optional(),
    funders: arrayOf(FunderEnum).optional(),
    orgIds: arrayOf(z.string().uuid()).optional(),
    counties: arrayOf(CountyEnum).optional(),
    start: z.string().date(),
    end: z.string().date(),
    scope: z.enum(['enrollments', 'completions']).default('enrollments'),
    view: z.enum(['rows', 'by_program', 'by_funder', 'by_org']).default('rows'),
    includeNames: z.coerce.boolean().default(false),
    preview: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine((v) => v.start <= v.end, { message: 'start must be <= end', path: ['start'] });

export type TrainingReportQuery = z.infer<typeof trainingReportQuery>;

export const trainingExportBody = z
  .object({
    tenantIds: z.array(z.string().uuid()).optional(),
    funders: z.array(FunderEnum).optional(),
    orgIds: z.array(z.string().uuid()).optional(),
    counties: z.array(CountyEnum).optional(),
    start: z.string().date(),
    end: z.string().date(),
    scope: z.enum(['enrollments', 'completions']).default('enrollments'),
    view: z.enum(['rows', 'by_program', 'by_funder', 'by_org']).default('rows'),
    includeNames: z.boolean().default(false),
    format: z.enum(['csv', 'xlsx']).default('csv'),
    email: z.string().email().optional(),
  })
  .strict()
  .refine((v) => v.start <= v.end, { message: 'start must be <= end', path: ['start'] });

export type TrainingExportBody = z.infer<typeof trainingExportBody>;

type RowFilters = Omit<TrainingReportQuery, 'view' | 'preview'> | Omit<TrainingExportBody, 'view' | 'format' | 'email'>;

export type TrainingRow = {
  enrollmentId: string;
  workerId: string;
  workerName: string | null;
  programTitle: string;
  programId: string;
  funder: string;
  county: string;
  orgId: string;
  status: string;
  enrolledAt: string;
  completedAt: string | null;
  certIssued: boolean;
  certificateId: string | null;
};

export const TRAINING_COLUMNS_NO_NAMES = [
  'enrollmentId',
  'programTitle',
  'funder',
  'county',
  'orgId',
  'status',
  'enrolledAt',
  'completedAt',
  'certIssued',
  'certificateId',
] as const;

export const TRAINING_COLUMNS_WITH_NAMES = [
  'enrollmentId',
  'workerId',
  'workerName',
  'programTitle',
  'funder',
  'county',
  'orgId',
  'status',
  'enrolledAt',
  'completedAt',
  'certIssued',
  'certificateId',
] as const;

export function trainingColumns(includeNames: boolean): readonly string[] {
  return includeNames ? TRAINING_COLUMNS_WITH_NAMES : TRAINING_COLUMNS_NO_NAMES;
}

type RawEnrollment = {
  id: string;
  worker_id: string;
  first_name: string | null;
  last_name: string | null;
  program_id: string;
  program_title: string;
  funder: string;
  county: string;
  org_id: string;
  status: string;
  enrolled_at: Date;
  completed_at: Date | null;
  certificate_id: string | null;
};

export async function runTrainingReport(
  db: Tx,
  filters: RowFilters,
): Promise<TrainingRow[]> {
  const dateCol = filters.scope === 'completions' ? 'completed_at' : 'enrolled_at';
  const completionsClause =
    filters.scope === 'completions'
      ? PrismaNamespace.sql`AND e.status = 'completed' AND e.completed_at IS NOT NULL`
      : PrismaNamespace.empty;

  const tenants = filters.tenantIds?.length
    ? PrismaNamespace.sql`AND e.tenant_id = ANY(${filters.tenantIds}::uuid[])`
    : PrismaNamespace.empty;
  const funders = filters.funders?.length
    ? PrismaNamespace.sql`AND p.funder::text = ANY(${filters.funders}::text[])`
    : PrismaNamespace.empty;
  const counties = filters.counties?.length
    ? PrismaNamespace.sql`AND p.county::text = ANY(${filters.counties}::text[])`
    : PrismaNamespace.empty;
  const orgs = filters.orgIds?.length
    ? PrismaNamespace.sql`AND p.org_id = ANY(${filters.orgIds}::uuid[])`
    : PrismaNamespace.empty;

  const dateFilter =
    dateCol === 'completed_at'
      ? PrismaNamespace.sql`AND e.completed_at >= ${filters.start}::date AND e.completed_at < ${filters.end}::date`
      : PrismaNamespace.sql`AND e.enrolled_at >= ${filters.start}::date AND e.enrolled_at < ${filters.end}::date`;

  const rows = await db.$queryRaw<RawEnrollment[]>(
    PrismaNamespace.sql`
      SELECT
        e.id                            AS id,
        e.worker_id                     AS worker_id,
        wp.first_name                   AS first_name,
        wp.last_name                    AS last_name,
        e.program_id                    AS program_id,
        p.title_en                      AS program_title,
        p.funder::text                  AS funder,
        p.county::text                  AS county,
        p.org_id                        AS org_id,
        e.status::text                  AS status,
        e.enrolled_at                   AS enrolled_at,
        e.completed_at                  AS completed_at,
        e.certificate_id                AS certificate_id
      FROM enrollments e
      JOIN training_programs p ON p.id = e.program_id
      LEFT JOIN worker_profiles wp ON wp.user_id = e.worker_id
      WHERE e.deleted_at IS NULL
        ${dateFilter}
        ${completionsClause}
        ${tenants}
        ${funders}
        ${counties}
        ${orgs}
      ORDER BY e.enrolled_at DESC
      LIMIT 50000
    `,
  );

  return rows.map((r) => ({
    enrollmentId: r.id,
    workerId: r.worker_id,
    workerName: [r.first_name, r.last_name].filter(Boolean).join(' ') || null,
    programTitle: r.program_title,
    programId: r.program_id,
    funder: r.funder,
    county: r.county,
    orgId: r.org_id,
    status: r.status,
    enrolledAt: r.enrolled_at.toISOString().slice(0, 10),
    completedAt: r.completed_at ? r.completed_at.toISOString().slice(0, 10) : null,
    certIssued: r.certificate_id !== null,
    certificateId: r.certificate_id,
  }));
}

export type AggregatedRow = Record<string, string | number>;

export function aggregateBy(rows: TrainingRow[], by: 'program' | 'funder' | 'org'): AggregatedRow[] {
  const groups = new Map<string, { label: string; key: string; rows: TrainingRow[] }>();
  for (const r of rows) {
    let key: string;
    let label: string;
    if (by === 'program') {
      key = r.programId;
      label = r.programTitle;
    } else if (by === 'funder') {
      key = r.funder;
      label = r.funder;
    } else {
      key = r.orgId;
      label = r.orgId;
    }
    const g = groups.get(key) ?? { label, key, rows: [] };
    g.rows.push(r);
    groups.set(key, g);
  }
  return Array.from(groups.values()).map((g) => ({
    [by]: g.label,
    enrollments: g.rows.length,
    completions: g.rows.filter((r) => r.status === 'completed').length,
    certificates: g.rows.filter((r) => r.certIssued).length,
    uniqueWorkers: new Set(g.rows.map((r) => r.workerId)).size,
  }));
}

export function aggregatedColumns(view: 'by_program' | 'by_funder' | 'by_org'): readonly string[] {
  const label = view === 'by_program' ? 'program' : view === 'by_funder' ? 'funder' : 'org';
  return [label, 'enrollments', 'completions', 'certificates', 'uniqueWorkers'];
}
