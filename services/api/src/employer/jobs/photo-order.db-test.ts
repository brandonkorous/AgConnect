import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { adminDb, dbClients, pools, runWithRlsContext } from '@agconn/db';
import { reorderJobPhotos } from './photo-order.js';

// An employer member reorders their job's photos through the RLS client, as agconn_app (pnpm test:db).
const TENANT = '0f1e0000-0000-4000-8000-000000000c01';
const PROFILE = '0f1e0000-0000-4000-8000-000000000c02';
const JOB = '0f1e0000-0000-4000-8000-000000000c03';
const PHOTOS = ['0f1e0000-0000-4000-8000-000000000c04', '0f1e0000-0000-4000-8000-000000000c05'];

async function clear(): Promise<void> {
  await adminDb.$executeRaw`DELETE FROM job_photos WHERE job_id = ${JOB}::uuid`;
  await adminDb.$executeRaw`DELETE FROM job_postings WHERE id = ${JOB}::uuid`;
  await adminDb.$executeRaw`DELETE FROM employer_profiles WHERE id = ${PROFILE}::uuid`;
  await adminDb.$executeRaw`DELETE FROM tenants WHERE id = ${TENANT}::uuid`;
}

before(async () => {
  await clear();
  await adminDb.tenant.create({ data: { id: TENANT, slug: 'photo-fixture', name: 'Photo fixture' } });
  await adminDb.employerProfile.create({ data: { id: PROFILE, tenantId: TENANT, legalName: 'Photo Fixture Farms' } });
  await adminDb.jobPosting.create({
    data: {
      id: JOB, tenantId: TENANT, employerId: PROFILE, status: 'draft', titleEn: 'Photo job', titleEs: 'Trabajo foto',
      descriptionEn: 'Photo fixture description', descriptionEs: 'Descripcion de fotos de prueba',
      county: 'Madera', wageMin: 18, wageMax: 22, startDate: new Date('2026-01-05'),
    },
  });
  await adminDb.jobPhoto.createMany({
    data: PHOTOS.map((id, i) => ({ id, tenantId: TENANT, jobId: JOB, url: `k${i}`, storageKey: `k${i}`, sortOrder: i })),
  });
});

after(async () => {
  await clear();
  await adminDb.$disconnect();
  await pools.employer.$disconnect();
});

test('reordering job photos runs in one RLS-scoped transaction', async () => {
  const ctx = { role: 'authenticated' as const, userId: 'photo_fixture_member', tenantId: TENANT, employerId: PROFILE };
  await runWithRlsContext(ctx, () => reorderJobPhotos(dbClients.employer, [PHOTOS[1]!, PHOTOS[0]!]));
  const rows = await adminDb.jobPhoto.findMany({ where: { jobId: JOB }, orderBy: { sortOrder: 'asc' } });
  assert.deepEqual(rows.map((r) => r.id), [PHOTOS[1], PHOTOS[0]]);
});
