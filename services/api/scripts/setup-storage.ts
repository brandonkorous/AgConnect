// Idempotent Supabase Storage bucket setup. Run once after pointing at a fresh
// Supabase project. Safe to re-run — every operation is upsert-style.
//
// Usage: pnpm --filter @agconn/api storage:setup

// Env is loaded via tsx --env-file=../../.env from package.json.
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env');
  process.exit(1);
}

const client = createClient(url, key, { auth: { persistSession: false } });

type BucketSpec = {
  name: string;
  public: boolean;
  fileSizeLimit: number;
  allowedMimeTypes: string[];
  notes: string;
};

const BUCKETS: BucketSpec[] = [
  {
    name: 'job-photos',
    public: true,
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    notes: 'Marketing-facing job photos. No PII. Public CDN.',
  },
  {
    name: 'compliance-evidence',
    public: false,
    fileSizeLimit: 25 * 1024 * 1024,
    allowedMimeTypes: [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif',
    ],
    notes: 'I-9 forms, signed audit binders, etc. Contains PII (SSN, signatures). PRIVATE — signed URLs only.',
  },
  {
    name: 'grant-reports',
    public: false,
    fileSizeLimit: 25 * 1024 * 1024,
    allowedMimeTypes: [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ],
    notes: 'Archived WIOA / CalJOBS placement-report exports. PRIVATE — signed URLs only.',
  },
];

async function ensureBucket(spec: BucketSpec) {
  const { data: existing, error: getErr } = await client.storage.getBucket(spec.name);
  if (getErr && !/not found|does not exist/i.test(getErr.message)) {
    throw new Error(`getBucket(${spec.name}) failed: ${getErr.message}`);
  }

  if (!existing) {
    const { error } = await client.storage.createBucket(spec.name, {
      public: spec.public,
      fileSizeLimit: spec.fileSizeLimit,
      allowedMimeTypes: spec.allowedMimeTypes,
    });
    if (error) throw new Error(`createBucket(${spec.name}) failed: ${error.message}`);
    console.log(`  created bucket ${spec.name} (public=${spec.public})`);
    return;
  }

  const { error } = await client.storage.updateBucket(spec.name, {
    public: spec.public,
    fileSizeLimit: spec.fileSizeLimit,
    allowedMimeTypes: spec.allowedMimeTypes,
  });
  if (error) throw new Error(`updateBucket(${spec.name}) failed: ${error.message}`);
  console.log(`  updated bucket ${spec.name} (public=${spec.public})`);
}

// Belt-and-suspenders: explicit deny on anon access for the private bucket.
// Service-role bypasses RLS, so our API still works; this just guarantees a
// leaked anon key can't read PII evidence.
//
// The CREATE POLICY statements are idempotent via DROP POLICY IF EXISTS first.
// We connect through the Postgres URL since storage.objects RLS lives in pg.
const PRIVATE_BUCKET_DENY_SQL = `
DROP POLICY IF EXISTS "deny_anon_read_compliance_evidence" ON storage.objects;
DROP POLICY IF EXISTS "deny_anon_write_compliance_evidence" ON storage.objects;
DROP POLICY IF EXISTS "deny_anon_read_grant_reports" ON storage.objects;
DROP POLICY IF EXISTS "deny_anon_write_grant_reports" ON storage.objects;
CREATE POLICY "deny_anon_read_compliance_evidence" ON storage.objects
  FOR SELECT TO anon USING (bucket_id != 'compliance-evidence');
CREATE POLICY "deny_anon_write_compliance_evidence" ON storage.objects
  FOR ALL TO anon USING (bucket_id != 'compliance-evidence');
CREATE POLICY "deny_anon_read_grant_reports" ON storage.objects
  FOR SELECT TO anon USING (bucket_id != 'grant-reports');
CREATE POLICY "deny_anon_write_grant_reports" ON storage.objects
  FOR ALL TO anon USING (bucket_id != 'grant-reports');
`.trim();

async function applyPrivateBucketRls() {
  // Use the Prisma client (already a workspace dep) to run raw SQL against
  // storage.objects. Supabase JS doesn't expose raw SQL, and pulling pg in
  // directly would add a redundant dep.
  const { prisma } = await import('@agconn/db');
  try {
    // $executeRawUnsafe is needed because the SQL contains multiple statements
    // and PG-quoted identifiers — Prisma's tagged-template variant won't accept
    // multi-statement SQL.
    for (const stmt of PRIVATE_BUCKET_DENY_SQL.split(/;\s*\n/).filter(Boolean)) {
      await prisma.$executeRawUnsafe(stmt);
    }
    console.log('  applied anon-deny RLS on compliance-evidence');
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log(`Configuring buckets at ${url}…`);
  for (const spec of BUCKETS) {
    console.log(`\n${spec.name}: ${spec.notes}`);
    await ensureBucket(spec);
  }
  console.log('\nApplying defense-in-depth RLS policies…');
  await applyPrivateBucketRls();
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
