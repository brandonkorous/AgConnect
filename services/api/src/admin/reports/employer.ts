import { z } from 'zod';
import { PrismaNamespace, type Tx } from '@agconn/db';

const CountyEnum = z.enum(['Fresno', 'Kern', 'Kings', 'Madera', 'Tulare']);
const LicenseEnum = z.enum(['grower', 'flc', 'labor_contractor']);

const arrayOf = <T extends z.ZodTypeAny>(item: T) =>
  z.preprocess((v) => (typeof v === 'string' ? [v] : v), z.array(item));

export const employerActivityQuery = z
  .object({
    tenantIds: arrayOf(z.string().uuid()).optional(),
    counties: arrayOf(CountyEnum).optional(),
    licenseTypes: arrayOf(LicenseEnum).optional(),
    start: z.string().date(),
    end: z.string().date(),
    view: z.enum(['rows', 'by_county', 'by_license_type']).default('rows'),
    preview: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict()
  .refine((v) => v.start <= v.end, { message: 'start must be <= end', path: ['start'] });

export type EmployerActivityQuery = z.infer<typeof employerActivityQuery>;

export const employerActivityExportBody = z
  .object({
    tenantIds: z.array(z.string().uuid()).optional(),
    counties: z.array(CountyEnum).optional(),
    licenseTypes: z.array(LicenseEnum).optional(),
    start: z.string().date(),
    end: z.string().date(),
    view: z.enum(['rows', 'by_county', 'by_license_type']).default('rows'),
    format: z.enum(['csv', 'xlsx']).default('csv'),
    email: z.string().email().optional(),
  })
  .strict()
  .refine((v) => v.start <= v.end, { message: 'start must be <= end', path: ['start'] });

export type EmployerActivityExportBody = z.infer<typeof employerActivityExportBody>;

type RowFilters = Omit<EmployerActivityQuery, 'view' | 'preview'> | Omit<EmployerActivityExportBody, 'view' | 'format' | 'email'>;

export type EmployerRow = {
  employerId: string;
  legalName: string;
  dbaName: string | null;
  licenseType: string | null;
  county: string | null;
  flcLicenseNum: string | null;
  verified: boolean;
  postings: number;
  applications: number;
  hires: number;
  hireRate: number | null;
  avgWage: number | null;
};

export const EMPLOYER_COLUMNS = [
  'employerId',
  'legalName',
  'dbaName',
  'licenseType',
  'county',
  'flcLicenseNum',
  'verified',
  'postings',
  'applications',
  'hires',
  'hireRate',
  'avgWage',
] as const;

type RawEmployer = {
  id: string;
  legal_name: string;
  dba_name: string | null;
  license_type: string | null;
  county: string | null;
  flc_license_num: string | null;
  flc_verified_at: Date | null;
  postings: bigint;
  applications: bigint;
  hires: bigint;
  avg_wage: string | null;
};

export async function runEmployerActivityReport(
  db: Tx,
  filters: RowFilters,
): Promise<EmployerRow[]> {
  const tenants = filters.tenantIds?.length
    ? PrismaNamespace.sql`AND ep.tenant_id = ANY(${filters.tenantIds}::uuid[])`
    : PrismaNamespace.empty;
  const counties = filters.counties?.length
    ? PrismaNamespace.sql`AND ep.county::text = ANY(${filters.counties}::text[])`
    : PrismaNamespace.empty;
  const licenses = filters.licenseTypes?.length
    ? PrismaNamespace.sql`AND ep.license_type::text = ANY(${filters.licenseTypes}::text[])`
    : PrismaNamespace.empty;

  const rows = await db.$queryRaw<RawEmployer[]>(
    PrismaNamespace.sql`
      WITH window_apps AS (
        SELECT a.*, j.employer_id, j.tenant_id
        FROM applications a
        JOIN job_postings j ON j.id = a.job_id
        WHERE a.deleted_at IS NULL
          AND a.applied_at >= ${filters.start}::date
          AND a.applied_at <  ${filters.end}::date
      ),
      window_post AS (
        SELECT j.*
        FROM job_postings j
        WHERE j.created_at >= ${filters.start}::date
          AND j.created_at <  ${filters.end}::date
      )
      SELECT
        ep.id                                                AS id,
        ep.legal_name                                        AS legal_name,
        ep.dba_name                                          AS dba_name,
        ep.license_type::text                                AS license_type,
        ep.county::text                                      AS county,
        ep.flc_license_num                                   AS flc_license_num,
        ep.flc_verified_at                                   AS flc_verified_at,
        COALESCE((SELECT COUNT(*) FROM window_post wp WHERE wp.employer_id = ep.id), 0)::bigint AS postings,
        COALESCE((SELECT COUNT(*) FROM window_apps wa WHERE wa.employer_id = ep.id), 0)::bigint AS applications,
        COALESCE((SELECT COUNT(*) FROM window_apps wa WHERE wa.employer_id = ep.id AND wa.status = 'hired'), 0)::bigint AS hires,
        (SELECT AVG(wa.wage_offered)::text FROM window_apps wa WHERE wa.employer_id = ep.id AND wa.status = 'hired') AS avg_wage
      FROM employer_profiles ep
      WHERE ep.deleted_at IS NULL
        ${tenants}
        ${counties}
        ${licenses}
      ORDER BY hires DESC, applications DESC, ep.legal_name ASC
      LIMIT 50000
    `,
  );

  return rows.map((r) => {
    const hires = Number(r.hires);
    const applications = Number(r.applications);
    return {
      employerId: r.id,
      legalName: r.legal_name,
      dbaName: r.dba_name,
      licenseType: r.license_type,
      county: r.county,
      flcLicenseNum: r.flc_license_num,
      verified: r.flc_verified_at !== null,
      postings: Number(r.postings),
      applications,
      hires,
      hireRate: applications === 0 ? null : hires / applications,
      avgWage: r.avg_wage ? Number(r.avg_wage) : null,
    };
  });
}

export type AggregatedEmployerRow = Record<string, string | number | null>;

export function aggregateEmployersBy(
  rows: EmployerRow[],
  by: 'county' | 'license_type',
): AggregatedEmployerRow[] {
  const groups = new Map<string, EmployerRow[]>();
  for (const r of rows) {
    const key = by === 'county' ? (r.county ?? 'unknown') : (r.licenseType ?? 'unknown');
    const arr = groups.get(key) ?? [];
    arr.push(r);
    groups.set(key, arr);
  }
  return Array.from(groups.entries()).map(([key, items]) => {
    const apps = items.reduce((s, x) => s + x.applications, 0);
    const hires = items.reduce((s, x) => s + x.hires, 0);
    return {
      [by]: key,
      employers: items.length,
      postings: items.reduce((s, x) => s + x.postings, 0),
      applications: apps,
      hires,
      hireRate: apps === 0 ? null : hires / apps,
    };
  });
}

export function aggregatedEmployerColumns(view: 'by_county' | 'by_license_type'): readonly string[] {
  const label = view === 'by_county' ? 'county' : 'license_type';
  return [label, 'employers', 'postings', 'applications', 'hires', 'hireRate'];
}
