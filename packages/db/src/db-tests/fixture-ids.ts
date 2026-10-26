// Fixed ids for the RLS fixture: two tenants, each with a worker, an employer member and their rows.
const id = (n: number) => `0f1e0000-0000-4000-8000-${n.toString().padStart(12, '0')}`;

export const TENANT = { A: id(1), B: id(2) } as const;

export const USER = {
  workerA: 'rls_fixture_worker_a',
  employerA: 'rls_fixture_employer_a',
  workerB: 'rls_fixture_worker_b',
  employerB: 'rls_fixture_employer_b',
  noTenant: 'rls_fixture_no_tenant',
} as const;

export const ROW = {
  profileA: id(11),
  profileB: id(12),
  contactA: id(21),
  contactB: id(22),
  jobA: id(31),
  jobB: id(32),
  draftA: id(33),
  appA: id(41),
  appB: id(42),
  convA: id(51),
  convB: id(52),
  cpWorkerA: id(61),
  cpEmployerA: id(62),
  cpWorkerB: id(63),
  msgA: id(71),
  msgB: id(72),
  shiftA: id(81),
  shiftB: id(82),
  assignA: id(91),
  assignB: id(92),
  emailA: id(101),
  emailB: id(102),
  smsA: id(111),
  smsB: id(112),
} as const;

// audit_events has a bigserial id, so its fixture rows are found by actor_id.
export const AUDIT_ACTOR = { A: 'rls_fixture_audit_a', B: 'rls_fixture_audit_b' } as const;
