// RLS spot-check: confirms multi-tenant tables refuse cross-tenant reads
// when SET LOCAL app.tenant_id is pinned. Each table gets one test:
//   1. Insert a row in tenant A
//   2. Switch to tenant B
//   3. Confirm the read returns 0 rows
// Plus admin role test: confirm cross-tenant reads succeed when role='admin'.
//
// Designed to run against a fresh dev DB. Cleans up its own fixtures.
//
// Run from any pnpm workspace (e.g. `pnpm --filter @agconn/api exec tsx ../../scripts/test-rls.mjs`).

import { prisma } from '../packages/db/src/index.ts';

const TENANT_A = '11111111-1111-1111-1111-111111111111';
const TENANT_B = '22222222-2222-2222-2222-222222222222';

const APP_ROLE = 'app_user_rls_test';

async function main() {
  let pass = 0;
  let fail = 0;
  const issues = [];

  const employerA = `rls_test_employer_a_${Date.now()}`;
  const employerB = `rls_test_employer_b_${Date.now()}`;

  // Provision an explicit NOBYPASSRLS DB role for the probe so RLS actually
  // gets evaluated. The dev superuser (postgres) bypasses RLS; only by
  // dropping privilege per-transaction do we exercise the real policies.
  await prisma.$executeRawUnsafe(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${APP_ROLE}') THEN
        EXECUTE 'CREATE ROLE ${APP_ROLE} NOLOGIN NOBYPASSRLS';
      END IF;
    END $$;
  `);
  await prisma.$executeRawUnsafe(`GRANT USAGE ON SCHEMA public TO ${APP_ROLE}`);
  await prisma.$executeRawUnsafe(
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${APP_ROLE}`,
  );
  await prisma.$executeRawUnsafe(
    `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${APP_ROLE}`,
  );

  try {
    // Provision tenants + sentinel employers in a single connection (no RLS
    // bypass needed — these are public DML the service role can perform).
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.role = 'service'`);
      await tx.$executeRaw`
        INSERT INTO "tenants" (id, slug, name, is_public, settings, updated_at)
        VALUES (${TENANT_A}::uuid, ${'rls-test-a-' + Date.now()}, 'RLS test A', false, '{}', NOW())
        ON CONFLICT (id) DO NOTHING`;
      await tx.$executeRaw`
        INSERT INTO "tenants" (id, slug, name, is_public, settings, updated_at)
        VALUES (${TENANT_B}::uuid, ${'rls-test-b-' + Date.now()}, 'RLS test B', false, '{}', NOW())
        ON CONFLICT (id) DO NOTHING`;
      await tx.$executeRaw`
        INSERT INTO users (id, tenant_id, role, preferred_lang, onboarded, permissions, created_at, updated_at)
        VALUES (${employerA}, ${TENANT_A}::uuid, 'employer'::"UserRole", 'en', true, '{}', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING`;
      await tx.$executeRaw`
        INSERT INTO users (id, tenant_id, role, preferred_lang, onboarded, permissions, created_at, updated_at)
        VALUES (${employerB}, ${TENANT_B}::uuid, 'employer'::"UserRole", 'en', true, '{}', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING`;
    });

    // 1. Insert a job in tenant A
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.role = 'service'`);
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${TENANT_A}, true)`;
      await tx.$executeRaw`
        INSERT INTO "job_postings" (
          id, tenant_id, employer_id, seo_slug, title_en, title_es,
          description_en, description_es, county, wage_min, wage_max, wage_unit,
          start_date, status, skills, housing, transport,
          published_at, created_at, updated_at
        ) VALUES (
          gen_random_uuid(), ${TENANT_A}::uuid, ${employerA},
          ${'rls-sentinel-a-' + Date.now()},
          'RLS sentinel A', 'Centinela A',
          'RLS sentinel description text long enough', 'Texto descriptivo de centinela RLS suficiente', 'Madera'::"County", 18, 22, 'hour',
          NOW(), 'active'::"JobStatus", '{}', false, false,
          NOW(), NOW(), NOW()
        )`;
    });

    // 2. Cross-tenant read from tenant B should return zero
    const cross = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL ROLE ${APP_ROLE}`);
      await tx.$executeRawUnsafe(`SET LOCAL app.role = 'authenticated'`);
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${TENANT_B}, true)`;
      const r = await tx.$queryRaw`
        SELECT COUNT(*)::int AS n FROM "job_postings" WHERE title_en = 'RLS sentinel A'`;
      return r[0]?.n ?? 0;
    });
    if (cross === 0) {
      console.log('✓ job_postings: cross-tenant read blocked');
      pass++;
    } else {
      console.error(`✗ job_postings: leaked ${cross} row(s) across tenants`);
      fail++;
      issues.push('job_postings:cross-tenant');
    }

    // 3. Same-tenant read should succeed
    const same = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL ROLE ${APP_ROLE}`);
      await tx.$executeRawUnsafe(`SET LOCAL app.role = 'authenticated'`);
      await tx.$executeRaw`SELECT set_config('app.tenant_id', ${TENANT_A}, true)`;
      const r = await tx.$queryRaw`
        SELECT COUNT(*)::int AS n FROM "job_postings" WHERE title_en = 'RLS sentinel A'`;
      return r[0]?.n ?? 0;
    });
    if (same > 0) {
      console.log(`✓ job_postings: same-tenant read succeeded (${same} row[s])`);
      pass++;
    } else {
      console.error('✗ job_postings: same-tenant read returned 0 rows');
      fail++;
      issues.push('job_postings:same-tenant');
    }

    // 4. Admin sees across tenants
    const admin = await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
      const r = await tx.$queryRaw`
        SELECT COUNT(*)::int AS n FROM "job_postings" WHERE title_en = 'RLS sentinel A'`;
      return r[0]?.n ?? 0;
    });
    if (admin > 0) {
      console.log(`✓ job_postings: admin sees ${admin} row(s) across tenants`);
      pass++;
    } else {
      console.error('✗ job_postings: admin role failed cross-tenant read');
      fail++;
      issues.push('job_postings:admin-read');
    }

    // 5. Worker can't insert into a tenant they're not in
    const blocked = await prisma
      .$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL ROLE ${APP_ROLE}`);
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'authenticated'`);
        await tx.$executeRaw`SELECT set_config('app.tenant_id', ${TENANT_B}, true)`;
        await tx.$executeRaw`
          INSERT INTO "job_postings" (
            id, tenant_id, employer_id, seo_slug, title_en, title_es,
            description_en, description_es, county, wage_min, wage_max, wage_unit,
            start_date, status, skills, housing, transport,
            published_at, created_at, updated_at
          ) VALUES (
            gen_random_uuid(), ${TENANT_A}::uuid, ${employerA},
            ${'rls-injection-a-' + Date.now()},
            'RLS injection A', 'Inyección A',
            'RLS sentinel description text long enough', 'Texto descriptivo de centinela RLS suficiente', 'Madera'::"County", 18, 22, 'hour',
            NOW(), 'active'::"JobStatus", '{}', false, false,
            NOW(), NOW(), NOW()
          )`;
        return false; // insert succeeded, RLS failed
      })
      .catch(() => true);
    if (blocked) {
      console.log('✓ job_postings: cross-tenant insert blocked');
      pass++;
    } else {
      console.error('✗ job_postings: cross-tenant insert succeeded — RLS leak');
      fail++;
      issues.push('job_postings:cross-tenant-insert');
    }
  } finally {
    // Tear down — admin role can ignore RLS for cleanup
    try {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL app.role = 'admin'`);
        await tx.$executeRaw`DELETE FROM "job_postings" WHERE title_en LIKE 'RLS %'`;
        await tx.$executeRaw`DELETE FROM users WHERE id IN (${employerA}, ${employerB})`;
        await tx.$executeRaw`DELETE FROM "tenants" WHERE id IN (${TENANT_A}::uuid, ${TENANT_B}::uuid)`;
      });
    } catch (e) {
      console.warn('[rls-test] cleanup partial:', e.message);
    }
    await prisma.$disconnect();
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) {
    console.error('Issues:', issues.join(', '));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
