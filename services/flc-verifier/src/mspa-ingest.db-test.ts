import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { adminDb, pools, runWithRlsContext } from '@agconn/db';
import { ingest } from './mspa-ingest.js';

// The MSPA ingest writes the registry as app.role = 'service' through agconn_app (pnpm test:db).
const CERT = 'RLS-FIXTURE-0001';

after(async () => {
  await adminDb.$executeRaw`DELETE FROM mspa_flc_registry WHERE certificate_number = ${CERT}`;
  await adminDb.$disconnect();
  await pools.shared.$disconnect();
});

test('ingest upserts a registry row as the service role', async () => {
  const row = {
    certificateNumber: CERT, legalName: 'Fixture Labor LLC', streetAddress: null, city: 'Fresno',
    stateCode: 'CA', postalCode: null, expirationDate: new Date('2030-01-01'),
    authHousing: false, authTransport: true, authDriving: false,
  };
  const counts = await runWithRlsContext({ role: 'service' }, () => ingest([row]));
  assert.equal(counts.added + counts.updated, 1);
  const saved = await adminDb.mspaFlcRegistry.findUnique({ where: { certificateNumber: CERT } });
  assert.equal(saved?.legalName, 'Fixture Labor LLC');
});
