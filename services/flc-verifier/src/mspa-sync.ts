import { parse as parseCsv } from 'csv-parse/sync';
import { prisma } from '@agconn/db';

// Federal DOL/WHD MSPA Farm Labor Contractor registry sync.
//
// The DOL publishes the full active-FLC list to data.gov as a downloadable
// dataset, refreshed monthly. We ingest it into the mspa_flc_registry table
// so per-employer verification is a local SQL lookup — no outbound HTTP call
// per signup, no rate-limit risk, works offline.
//
// Architecture:
//   1. Hit the data.gov package API to discover the current resource URL
//      (the underlying file path rotates between revisions).
//   2. HEAD the file; skip if Last-Modified hasn't advanced since our last
//      successful sync.
//   3. GET the file, parse as CSV, upsert rows keyed by certificate number.
//   4. Soft-delete rows that disappeared from the new file — DOL only
//      publishes *active* certs, so absence === lapsed/revoked.

const DATA_GOV_PACKAGE_URL =
  'https://catalog.data.gov/api/3/action/package_show?id=registered-farm-labor-contractor-listing-5cd50';

const USER_AGENT = 'AgConn-FlcVerifier/1.0 (+https://agconn.com/about; ops@agconn.com)';
const FETCH_TIMEOUT_MS = 60_000;

type DataGovResource = {
  url: string;
  format: string;
  last_modified?: string | null;
};

type DataGovPackageResponse = {
  success: boolean;
  result?: {
    resources?: DataGovResource[];
  };
};

export type MspaSyncOutcome = {
  status: 'completed' | 'skipped_unchanged' | 'failed';
  rowsAdded: number;
  rowsUpdated: number;
  rowsRemoved: number;
  sourceUrl: string | null;
  sourceUpdatedAt: Date | null;
  errorMessage: string | null;
};

export async function runMspaSync(): Promise<MspaSyncOutcome> {
  const run = await prisma.mspaSyncRun.create({ data: { status: 'running' } });

  try {
    const resource = await resolveResourceUrl();
    if (!resource) {
      throw new Error('mspa_resource_url_not_found');
    }

    const lastSuccess = await prisma.mspaSyncRun.findFirst({
      where: { status: 'completed', sourceUpdatedAt: { not: null } },
      orderBy: { startedAt: 'desc' },
    });

    if (lastSuccess?.sourceUpdatedAt && resource.lastModified) {
      if (resource.lastModified <= lastSuccess.sourceUpdatedAt) {
        const outcome: MspaSyncOutcome = {
          status: 'skipped_unchanged',
          rowsAdded: 0,
          rowsUpdated: 0,
          rowsRemoved: 0,
          sourceUrl: resource.url,
          sourceUpdatedAt: resource.lastModified,
          errorMessage: null,
        };
        await prisma.mspaSyncRun.update({
          where: { id: run.id },
          data: {
            finishedAt: new Date(),
            status: 'skipped_unchanged',
            sourceUrl: resource.url,
            sourceUpdatedAt: resource.lastModified,
          },
        });
        return outcome;
      }
    }

    const csv = await downloadResource(resource.url);
    const parsed = parseRegistry(csv);
    const counts = await ingest(parsed);

    const outcome: MspaSyncOutcome = {
      status: 'completed',
      rowsAdded: counts.added,
      rowsUpdated: counts.updated,
      rowsRemoved: counts.removed,
      sourceUrl: resource.url,
      sourceUpdatedAt: resource.lastModified,
      errorMessage: null,
    };

    await prisma.mspaSyncRun.update({
      where: { id: run.id },
      data: {
        finishedAt: new Date(),
        status: 'completed',
        rowsAdded: counts.added,
        rowsUpdated: counts.updated,
        rowsRemoved: counts.removed,
        sourceUrl: resource.url,
        sourceUpdatedAt: resource.lastModified,
      },
    });

    return outcome;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await prisma.mspaSyncRun.update({
      where: { id: run.id },
      data: { finishedAt: new Date(), status: 'failed', errorMessage: message.slice(0, 500) },
    });
    return {
      status: 'failed',
      rowsAdded: 0,
      rowsUpdated: 0,
      rowsRemoved: 0,
      sourceUrl: null,
      sourceUpdatedAt: null,
      errorMessage: message,
    };
  }
}

async function resolveResourceUrl(): Promise<{ url: string; lastModified: Date | null } | null> {
  const res = await fetchWithTimeout(DATA_GOV_PACKAGE_URL, {
    method: 'GET',
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`data_gov_package_status_${res.status}`);
  const body = (await res.json()) as DataGovPackageResponse;
  if (!body.success) throw new Error('data_gov_package_unsuccessful');

  const resources = body.result?.resources ?? [];
  // Prefer CSV; fall back to whatever's first if the format field is empty.
  const preferred =
    resources.find((r) => /csv/i.test(r.format ?? '')) ?? resources[0] ?? null;
  if (!preferred) return null;
  const last = preferred.last_modified ? new Date(preferred.last_modified) : null;
  return { url: preferred.url, lastModified: last && Number.isFinite(last.getTime()) ? last : null };
}

async function downloadResource(url: string): Promise<string> {
  const res = await fetchWithTimeout(url, {
    method: 'GET',
    headers: { 'User-Agent': USER_AGENT, Accept: 'text/csv,*/*' },
  });
  if (!res.ok) throw new Error(`mspa_download_status_${res.status}`);
  return await res.text();
}

type ParsedRow = {
  certificateNumber: string;
  legalName: string;
  streetAddress: string | null;
  city: string | null;
  stateCode: string | null;
  postalCode: string | null;
  expirationDate: Date;
  authHousing: boolean;
  authTransport: boolean;
  authDriving: boolean;
};

function parseRegistry(csv: string): ParsedRow[] {
  const rows = parseCsv(csv, {
    columns: (header: string[]) => header.map(normalizeHeader),
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    bom: true,
  }) as Record<string, string>[];

  const out: ParsedRow[] = [];
  for (const row of rows) {
    const cert = pick(row, ['certificate_number', 'cert_number', 'flc_number']);
    const name = pick(row, ['legal_name', 'name', 'flc_name', 'farm_labor_contractor_name']);
    const expRaw = pick(row, ['expiration_date', 'exp_date', 'expires']);
    if (!cert || !name || !expRaw) continue;
    const exp = parseFlexibleDate(expRaw);
    if (!exp) continue;

    out.push({
      certificateNumber: cert.toUpperCase(),
      legalName: name,
      streetAddress: pick(row, ['address', 'street', 'street_address']) || null,
      city: pick(row, ['city']) || null,
      stateCode: pick(row, ['state', 'state_code']) || null,
      postalCode: pick(row, ['zip', 'zip_code', 'postal_code']) || null,
      expirationDate: exp,
      authHousing: parseBoolean(pick(row, ['housing', 'authorized_to_house', 'auth_housing'])),
      authTransport: parseBoolean(pick(row, ['transport', 'authorized_to_transport', 'auth_transport'])),
      authDriving: parseBoolean(pick(row, ['driving', 'authorized_to_drive', 'auth_driving'])),
    });
  }
  return out;
}

function normalizeHeader(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function pick(row: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v !== undefined && v !== null && String(v).trim().length > 0) return String(v).trim();
  }
  return '';
}

function parseBoolean(v: string): boolean {
  if (!v) return false;
  const s = v.toLowerCase();
  return s === 'y' || s === 'yes' || s === 'true' || s === '1' || s === 'x';
}

function parseFlexibleDate(raw: string): Date | null {
  // Accept mm/dd/yyyy or yyyy-mm-dd. The DOL has historically published in
  // mm/dd/yyyy; data.gov sometimes normalizes to ISO.
  const us = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (us) {
    const [, mm, dd, yyyy] = us;
    const d = new Date(`${yyyy}-${mm!.padStart(2, '0')}-${dd!.padStart(2, '0')}`);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const d = new Date(raw);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  return null;
}

async function ingest(rows: ParsedRow[]): Promise<{ added: number; updated: number; removed: number }> {
  if (rows.length === 0) {
    // Refuse to nuke the table from an empty download — almost certainly a
    // parser regression. Treat as failure so the alert fires.
    throw new Error('mspa_parsed_zero_rows');
  }

  const seenCerts = new Set(rows.map((r) => r.certificateNumber));

  // Snapshot which certs exist now so we can split adds vs updates accurately.
  const existing = new Set(
    (
      await prisma.mspaFlcRegistry.findMany({
        where: { certificateNumber: { in: Array.from(seenCerts) } },
        select: { certificateNumber: true },
      })
    ).map((r) => r.certificateNumber),
  );

  let added = 0;
  let updated = 0;

  // Chunk the upsert to keep transaction size sane on the first sync (the
  // DOL list runs ~12k rows). 500-row chunks keep each tx well under a minute.
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    await prisma.$transaction(
      async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'service'`);
        for (const r of chunk) {
          await tx.mspaFlcRegistry.upsert({
            where: { certificateNumber: r.certificateNumber },
            create: {
              certificateNumber: r.certificateNumber,
              legalName: r.legalName,
              streetAddress: r.streetAddress,
              city: r.city,
              stateCode: r.stateCode,
              postalCode: r.postalCode,
              expirationDate: r.expirationDate,
              authHousing: r.authHousing,
              authTransport: r.authTransport,
              authDriving: r.authDriving,
              syncedAt: new Date(),
              removedAt: null,
            },
            update: {
              legalName: r.legalName,
              streetAddress: r.streetAddress,
              city: r.city,
              stateCode: r.stateCode,
              postalCode: r.postalCode,
              expirationDate: r.expirationDate,
              authHousing: r.authHousing,
              authTransport: r.authTransport,
              authDriving: r.authDriving,
              syncedAt: new Date(),
              removedAt: null,
            },
          });
          if (existing.has(r.certificateNumber)) updated += 1;
          else added += 1;
        }
      },
      { timeout: 60_000, maxWait: 10_000 },
    );
  }

  // Mark anything not in the new file as removed (only the rows that were
  // previously active — don't churn already-removed rows).
  const removedResult = await prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.role = 'service'`);
      return tx.mspaFlcRegistry.updateMany({
        where: { certificateNumber: { notIn: Array.from(seenCerts) }, removedAt: null },
        data: { removedAt: new Date() },
      });
    },
    { timeout: 60_000, maxWait: 10_000 },
  );

  return { added, updated, removed: removedResult.count };
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
