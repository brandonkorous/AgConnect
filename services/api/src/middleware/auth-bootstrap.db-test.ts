import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { adminDb, pools } from '@agconn/db';
import { findAuthUser, loadMemberships, upsertClerkUser } from './auth-bootstrap.js';

// The auth bootstrap reads and provisions the Clerk user as agconn_app, before any tenant is known (pnpm test:db).
const TENANT = '0f1e0000-0000-4000-8000-000000000a01';
const PROFILE = '0f1e0000-0000-4000-8000-000000000a02';
const MEMBER = 'auth_fixture_member';
const NEWCOMER = 'auth_fixture_newcomer';

async function clear(): Promise<void> {
  await adminDb.$executeRaw`UPDATE employer_profiles SET owner_contact_id = NULL WHERE id = ${PROFILE}::uuid`;
  await adminDb.$executeRaw`DELETE FROM employer_contacts WHERE employer_id = ${PROFILE}::uuid`;
  await adminDb.$executeRaw`DELETE FROM employer_profiles WHERE id = ${PROFILE}::uuid`;
  await adminDb.$executeRaw`DELETE FROM users WHERE id IN (${MEMBER}, ${NEWCOMER})`;
  await adminDb.$executeRaw`DELETE FROM tenants WHERE id = ${TENANT}::uuid`;
}

before(async () => {
  await clear();
  await adminDb.tenant.create({ data: { id: TENANT, slug: 'auth-fixture', name: 'Auth fixture' } });
  await adminDb.user.create({ data: { id: MEMBER, role: 'employer', tenantId: TENANT } });
  await adminDb.employerProfile.create({ data: { id: PROFILE, tenantId: TENANT, legalName: 'Auth Fixture Farms' } });
  const owner = await adminDb.role.findFirstOrThrow({ where: { key: 'owner', tenantId: null } });
  await adminDb.employerContact.create({
    data: { tenantId: TENANT, employerId: PROFILE, userId: MEMBER, name: 'Member', phone: '+15595550101', roleId: owner.id, acceptedAt: new Date() },
  });
});

after(async () => {
  await clear();
  await adminDb.$disconnect();
  await pools.shared.$disconnect();
});

test('findAuthUser reads the Clerk user', async () => {
  const user = await findAuthUser(MEMBER);
  assert.equal(user?.tenantId, TENANT);
});

test('loadMemberships returns the accepted membership with its role bundle', async () => {
  const [m] = await loadMemberships(MEMBER);
  assert.equal(m?.employerId, PROFILE);
  assert.equal(m?.tenantId, TENANT);
  assert.equal(m?.roleKey, 'owner');
});

test('upsertClerkUser provisions a first-time user as a tenantless worker', async () => {
  const user = await upsertClerkUser(NEWCOMER, { email: 'New@Example.com', phone: null });
  assert.equal(user.role, 'worker');
  assert.equal(user.email, 'new@example.com');
  assert.equal(user.tenantId, null);
});
