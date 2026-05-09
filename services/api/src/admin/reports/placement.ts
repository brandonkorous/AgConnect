import { type Prisma, PrismaNamespace, type Tx } from '@agconn/db';
import {
  PLACEMENT_COLUMNS,
  PLACEMENT_COLUMNS_NO_NAMES,
  participantId,
  type CsvCell,
  type PlacementColumn,
} from '@agconn/reporting';

// Heavy quarterly query — joined hires + most-recent-completed-training
// per worker, returned in WIOA column order. See
// docs/30-admin/02-placement-report/02-data-model.md.

export type PlacementFilters = {
  tenantIds?: string[];
  counties?: string[];
  funders?: string[];
  start: string;
  end: string;
  includeNames: boolean;
};

type Row = {
  tenant_id: string | null;
  worker_id: string;
  first_name: string | null;
  last_name: string | null;
  county: string | null;
  preferred_lang: string | null;
  service_start: Date | null;
  service_end: Date | null;
  hired_at: Date | null;
  employer_name: string | null;
  ein: string | null;
  title_en: string | null;
  wage_offered: Prisma.Decimal | null;
  training_title: string | null;
  training_funder: string | null;
  training_completed_at: Date | null;
  cert_name: string | null;
  certificate_id: string | null;
};

export async function runPlacementReport(
  db: Tx,
  filters: PlacementFilters,
): Promise<Array<Record<PlacementColumn, CsvCell>>> {
  const tenantIds = filters.tenantIds ?? [];
  const counties = filters.counties ?? [];
  const funders = filters.funders ?? [];

  const rows = await db.$queryRaw<Row[]>(PrismaNamespace.sql`
    SELECT
      a."tenant_id"                                   AS tenant_id,
      a."worker_id"                                   AS worker_id,
      wp."first_name"                                 AS first_name,
      wp."last_name"                                  AS last_name,
      wp."county"::text                               AS county,
      u."preferred_lang"::text                        AS preferred_lang,
      (SELECT MIN(a2."applied_at")
         FROM "applications" a2
         WHERE a2."worker_id" = a."worker_id"
           AND a2."deleted_at" IS NULL)               AS service_start,
      (SELECT MAX(a3."updated_at")
         FROM "applications" a3
         WHERE a3."worker_id" = a."worker_id"
           AND a3."deleted_at" IS NULL)               AS service_end,
      a."hired_at"                                    AS hired_at,
      ep."legal_name"                                 AS employer_name,
      ep."ein"                                        AS ein,
      jp."title_en"                                   AS title_en,
      a."wage_offered"                                AS wage_offered,
      (SELECT tp."title_en"
         FROM "enrollments" e
         JOIN "training_programs" tp ON tp."id" = e."program_id"
         WHERE e."worker_id" = a."worker_id"
           AND e."status" = 'completed'
           AND e."deleted_at" IS NULL
         ORDER BY e."completed_at" DESC NULLS LAST
         LIMIT 1)                                     AS training_title,
      (SELECT tp."funder"::text
         FROM "enrollments" e
         JOIN "training_programs" tp ON tp."id" = e."program_id"
         WHERE e."worker_id" = a."worker_id"
           AND e."status" = 'completed'
           AND e."deleted_at" IS NULL
         ORDER BY e."completed_at" DESC NULLS LAST
         LIMIT 1)                                     AS training_funder,
      (SELECT e."completed_at"
         FROM "enrollments" e
         WHERE e."worker_id" = a."worker_id"
           AND e."status" = 'completed'
           AND e."deleted_at" IS NULL
         ORDER BY e."completed_at" DESC NULLS LAST
         LIMIT 1)                                     AS training_completed_at,
      (SELECT tp."cert_name"
         FROM "enrollments" e
         JOIN "training_programs" tp ON tp."id" = e."program_id"
         WHERE e."worker_id" = a."worker_id"
           AND e."status" = 'completed'
           AND e."cert_url" IS NOT NULL
           AND e."deleted_at" IS NULL
         ORDER BY e."completed_at" DESC NULLS LAST
         LIMIT 1)                                     AS cert_name,
      (SELECT e."certificate_id"
         FROM "enrollments" e
         WHERE e."worker_id" = a."worker_id"
           AND e."status" = 'completed'
           AND e."certificate_id" IS NOT NULL
           AND e."deleted_at" IS NULL
         ORDER BY e."completed_at" DESC NULLS LAST
         LIMIT 1)                                     AS certificate_id
    FROM "applications" a
    JOIN "users" u             ON u."id" = a."worker_id"
    LEFT JOIN "worker_profiles" wp  ON wp."id" = a."worker_id"
    JOIN "job_postings" jp     ON jp."id" = a."job_id"
    JOIN "employer_profiles" ep ON ep."user_id" = jp."employer_id"
    WHERE a."status" = 'hired'
      AND a."deleted_at" IS NULL
      AND a."hired_at" >= ${filters.start}::date
      AND a."hired_at" <  (${filters.end}::date + INTERVAL '1 day')
      ${
        tenantIds.length
          ? PrismaNamespace.sql`AND a."tenant_id" = ANY(${tenantIds}::uuid[])`
          : PrismaNamespace.empty
      }
      ${
        counties.length
          ? PrismaNamespace.sql`AND jp."county"::text = ANY(${counties}::text[])`
          : PrismaNamespace.empty
      }
      ${
        funders.length
          ? PrismaNamespace.sql`AND EXISTS (
              SELECT 1 FROM "enrollments" e
              JOIN "training_programs" tp ON tp."id" = e."program_id"
              WHERE e."worker_id" = a."worker_id"
                AND e."status" = 'completed'
                AND tp."funder"::text = ANY(${funders}::text[])
            )`
          : PrismaNamespace.empty
      }
    ORDER BY a."hired_at" DESC
  `);

  return rows.map((r: Row) => shapeRow(r, filters.includeNames));
}

function shapeRow(
  r: Row,
  includeNames: boolean,
): Record<PlacementColumn, CsvCell> {
  const wage = r.wage_offered === null ? null : Number(r.wage_offered);
  return {
    'Participant ID': participantId(r.tenant_id, r.worker_id),
    'First Name': includeNames ? r.first_name : null,
    'Last Name': includeNames ? r.last_name : null,
    'County of Residence': r.county,
    'Language Preference': r.preferred_lang,
    'Service Start Date': r.service_start ? toIsoDate(r.service_start) : null,
    'Service End Date': r.service_end ? toIsoDate(r.service_end) : null,
    'Hire Date': r.hired_at ? toIsoDate(r.hired_at) : null,
    'Employer Name': r.employer_name,
    'Employer EIN': r.ein,
    'Occupation Title (English)': r.title_en,
    'SOC Code': null,
    'Wage at Placement ($/hr)': wage,
    'Wage Annual Equivalent ($)':
      wage === null ? null : Math.round(wage * 40 * 52 * 100) / 100,
    'Training Program Name (most recent)': r.training_title,
    'Training Funder': r.training_funder,
    'Training Completion Date': r.training_completed_at
      ? toIsoDate(r.training_completed_at)
      : null,
    'Certification Earned': r.cert_name,
    'Certification ID': r.certificate_id,
    'Q2 Retention Flag (manual)': '',
    'Q4 Retention Flag (manual)': '',
  };
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function placementColumns(includeNames: boolean): ReadonlyArray<string> {
  return includeNames ? PLACEMENT_COLUMNS : PLACEMENT_COLUMNS_NO_NAMES;
}
