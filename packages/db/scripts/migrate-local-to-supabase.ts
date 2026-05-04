/**
 * One-shot migration script: copy data from local Postgres → Supabase.
 *
 * Usage:
 *   tsx scripts/migrate-local-to-supabase.ts inventory   # row counts only
 *   tsx scripts/migrate-local-to-supabase.ts snapshot    # local → JSON files
 *   tsx scripts/migrate-local-to-supabase.ts import      # JSON → Supabase (current DATABASE_URL)
 *   tsx scripts/migrate-local-to-supabase.ts verify      # row counts vs snapshots
 *
 * Reads/writes JSON snapshots under scripts/_migration-snapshot/.
 * Reseedable lookups (crops, role_types, skill_tags, translation_keys) are
 * intentionally skipped — rerun lookups:seed + i18n:seed after import.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..', '..');
const snapshotDir = join(here, '_migration-snapshot');

loadEnv({ path: join(repoRoot, '.env') });

// Local DB URL — hardcoded for the duration of this migration so it works
// regardless of what DATABASE_URL the .env currently points at.
const LOCAL_URL = 'postgresql://postgres:postgres@localhost:5432/agconn?schema=public';

// Tables ordered for FK-safe insertion. Excluded: translation_keys (reseeded
// after import — not FK-referenced from the data tables we copy). Excluded:
// email_suppression / sms_opt_out (global, recreate fresh).
//
// Lookups (crops/role_types/skill_tags) ARE included because job_postings.crop_id
// + role_type_id reference local UUIDs that won't match a fresh seed; we
// truncate-and-replace those tables on the target before insert.
const TRUNCATE_BEFORE_IMPORT = new Set(['crops', 'role_types', 'skill_tags', 'translation_keys']);
const TABLE_ORDER: ReadonlyArray<{ name: string; client: keyof PrismaClient }> = [
  { name: 'crops', client: 'crop' },
  { name: 'role_types', client: 'roleType' },
  { name: 'skill_tags', client: 'skillTag' },
  { name: 'tenants', client: 'tenant' },
  { name: 'translation_keys', client: 'translationKey' },
  { name: 'users', client: 'user' },
  { name: 'employer_profiles', client: 'employerProfile' },
  { name: 'worker_profiles', client: 'workerProfile' },
  { name: 'employer_contacts', client: 'employerContact' },
  { name: 'job_postings', client: 'jobPosting' },
  { name: 'job_photos', client: 'jobPhoto' },
  { name: 'job_screening_questions', client: 'jobScreeningQuestion' },
  { name: 'applications', client: 'application' },
  { name: 'application_screening_answers', client: 'applicationScreeningAnswer' },
  { name: 'application_events', client: 'applicationEvent' },
  { name: 'job_edit_events', client: 'jobEditEvent' },
  { name: 'job_renotifications', client: 'jobRenotification' },
  { name: 'sms_keywords', client: 'smsKeyword' },
  { name: 'crews', client: 'crew' },
  { name: 'crew_members', client: 'crewMember' },
  { name: 'shifts', client: 'shift' },
  { name: 'shift_assignments', client: 'shiftAssignment' },
  { name: 'compliance_items', client: 'complianceItem' },
  { name: 'compliance_score_snapshots', client: 'complianceScoreSnapshot' },
  { name: 'payroll_periods', client: 'payrollPeriod' },
  { name: 'payroll_lines', client: 'payrollLine' },
  { name: 'conversations', client: 'conversation' },
  { name: 'conversation_participants', client: 'conversationParticipant' },
  { name: 'messages', client: 'message' },
  { name: 'verification_log', client: 'verificationLog' },
  { name: 'worker_search_log', client: 'workerSearchLog' },
  { name: 'worker_invitations', client: 'workerInvitation' },
  { name: 'billing_events', client: 'billingEvent' },
  { name: 'training_programs', client: 'trainingProgram' },
  { name: 'enrollments', client: 'enrollment' },
  { name: 'saved_searches', client: 'savedSearch' },
  { name: 'search_views', client: 'searchView' },
  { name: 'waitlist', client: 'waitlist' },
  { name: 'email_log', client: 'emailLog' },
  { name: 'sms_log', client: 'smsLog' },
  { name: 'auth_events', client: 'authEvent' },
  { name: 'audit_events', client: 'auditEvent' },
];

function makeClient(url: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter, log: ['error'] });
}

async function counts(prisma: PrismaClient): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const t of TABLE_ORDER) {
    const model = (prisma as unknown as Record<string, { count: () => Promise<number> }>)[t.client as string];
    out[t.name] = await model.count();
  }
  return out;
}

function ensureSnapshotDir(): void {
  if (!existsSync(snapshotDir)) mkdirSync(snapshotDir, { recursive: true });
}

function jsonStringify(value: unknown): string {
  return JSON.stringify(
    value,
    (_k, v) => {
      if (typeof v === 'bigint') return { __bigint: v.toString() };
      if (v instanceof Uint8Array) return { __bytes: Buffer.from(v).toString('base64') };
      if (Buffer.isBuffer?.(v)) return { __bytes: v.toString('base64') };
      return v;
    },
    2,
  );
}

function jsonReviveDates(rows: unknown[]): unknown[] {
  // Walk every value; convert ISO date strings back to Date, bigint markers, bytes markers.
  return rows.map((row) => reviveValue(row));
}

function reviveValue(v: unknown): unknown {
  if (v == null) return v;
  if (Array.isArray(v)) return v.map(reviveValue);
  if (typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    if (typeof obj.__bigint === 'string') return BigInt(obj.__bigint);
    if (typeof obj.__bytes === 'string') return Buffer.from(obj.__bytes, 'base64');
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(obj)) out[k] = reviveValue(val);
    return out;
  }
  if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(v)) {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return v;
}

async function snapshot(): Promise<void> {
  ensureSnapshotDir();
  const local = makeClient(LOCAL_URL);
  console.log('Snapshotting from', LOCAL_URL);
  for (const t of TABLE_ORDER) {
    const model = (local as unknown as Record<string, { findMany: (args?: unknown) => Promise<unknown[]> }>)[
      t.client as string
    ];
    const rows = await model.findMany();
    const path = join(snapshotDir, `${t.name}.json`);
    writeFileSync(path, jsonStringify(rows));
    console.log(`  ${t.name.padEnd(36)} ${rows.length.toString().padStart(6)} rows`);
  }
  await local.$disconnect();
}

async function importToTarget(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  if (!url.includes('supabase')) {
    throw new Error(`Refusing to import: DATABASE_URL does not look like Supabase (${url.slice(0, 60)}...)`);
  }
  const target = makeClient(url);
  console.log('Importing into', url.replace(/:[^:@/]+@/, ':***@'));
  for (const t of TABLE_ORDER) {
    const path = join(snapshotDir, `${t.name}.json`);
    if (!existsSync(path)) {
      console.log(`  ${t.name.padEnd(36)} (no snapshot, skip)`);
      continue;
    }
    const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown[];
    const rows = jsonReviveDates(raw) as Array<Record<string, unknown>>;
    if (rows.length === 0) {
      console.log(`  ${t.name.padEnd(36)} (empty, skip)`);
      continue;
    }
    const model = (target as unknown as Record<
      string,
      {
        createMany: (args: { data: unknown[]; skipDuplicates: boolean }) => Promise<{ count: number }>;
        deleteMany: (args?: unknown) => Promise<{ count: number }>;
      }
    >)[t.client as string];
    if (TRUNCATE_BEFORE_IMPORT.has(t.name)) {
      const del = await model.deleteMany();
      console.log(`  ${t.name.padEnd(36)} (truncated ${del.count})`);
    }
    // Insert in chunks; createMany has a parameter limit per query (~32k).
    const CHUNK = 500;
    let inserted = 0;
    for (let i = 0; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK);
      const res = await model.createMany({ data: slice, skipDuplicates: true });
      inserted += res.count;
    }
    console.log(`  ${t.name.padEnd(36)} ${inserted.toString().padStart(6)} inserted (of ${rows.length})`);
  }
  await target.$disconnect();
}

async function inventory(): Promise<void> {
  const local = makeClient(LOCAL_URL);
  const c = await counts(local);
  console.log('LOCAL row counts:');
  for (const [name, n] of Object.entries(c)) {
    if (n > 0) console.log(`  ${name.padEnd(36)} ${n.toString().padStart(6)}`);
  }
  const total = Object.values(c).reduce((a, b) => a + b, 0);
  console.log(`  total: ${total}`);
  await local.$disconnect();
}

async function verify(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL not set');
  const target = makeClient(url);
  const local = makeClient(LOCAL_URL);
  const remote = await counts(target);
  const localCounts = await counts(local);
  console.log(`${'table'.padEnd(36)} ${'local'.padStart(7)} ${'remote'.padStart(7)} diff`);
  let mismatch = 0;
  for (const t of TABLE_ORDER) {
    const l = localCounts[t.name] ?? 0;
    const r = remote[t.name] ?? 0;
    const flag = l !== r ? '  <-- MISMATCH' : '';
    if (l !== r) mismatch++;
    if (l > 0 || r > 0) {
      console.log(`${t.name.padEnd(36)} ${l.toString().padStart(7)} ${r.toString().padStart(7)}${flag}`);
    }
  }
  console.log(mismatch === 0 ? 'OK — all counts match' : `${mismatch} table(s) mismatched`);
  await target.$disconnect();
  await local.$disconnect();
}

const cmd = process.argv[2];
const fn = ({ inventory, snapshot, import: importToTarget, verify } as Record<string, () => Promise<void>>)[cmd ?? ''];
if (!fn) {
  console.error('Usage: tsx scripts/migrate-local-to-supabase.ts <inventory|snapshot|import|verify>');
  process.exit(1);
}
fn().catch((err) => {
  console.error(err);
  process.exit(1);
});
