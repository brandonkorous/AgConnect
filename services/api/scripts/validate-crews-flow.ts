// End-to-end validation of /employer/crews backend functionality.
//
// Approach: mount the real route files in an in-process Hono app, replace the
// Clerk + RLS auth chain with a lightweight middleware that pins a known test
// employer, and drive the routes via `app.request()` against the live dev
// database. Each step asserts both the response envelope and the underlying
// database state.
//
// Run: pnpm --filter @agconn/api tsx scripts/validate-crews-flow.ts
//
// Idempotent. Tags every artifact it creates so cleanup at the end can find
// and remove them without disturbing other dev data.

// Env is supplied by tsx --env-file; see the run command in the file header.

const { prisma, AppStatus } = await import('@agconn/db');
const { hasPermission } = await import('@agconn/schemas');
const { Hono } = await import('hono');
const { createMiddleware } = await import('hono/factory');
const { employerCrewsRoutes } = await import('../src/employer/crews/routes.js');
const { employerShiftsRoutes } = await import('../src/employer/shifts/routes.js');
const { employerHiresRoutes } = await import('../src/employer/hires/routes.js');
const { employerWeatherRoutes } = await import('../src/employer/weather/routes.js');

const TAG = `crews-validate-${Date.now()}`;
const passes: string[] = [];
const failures: string[] = [];

function assert(label: string, cond: unknown, detail?: string): void {
  if (cond) {
    passes.push(label);
    console.log(`  ok  ${label}`);
  } else {
    failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
    console.log(`  FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

// Post-RBAC, an employer is an `employer_profiles` row and access is granted
// through an accepted `employer_contacts` membership that links a platform User
// to that profile via a permissioned Role. The validation needs all three:
// the user id (for the mocked Clerk session), the employer profile id (the
// `employer_id` FK on crews/shifts/jobs), and the tenant id.
async function findOrCreateEmployer(): Promise<{
  userId: string;
  employerId: string;
  tenantId: string;
}> {
  const contacts = await prisma.employerContact.findMany({
    where: {
      acceptedAt: { not: null },
      deletedAt: null,
      userId: { not: null },
      employer: { deletedAt: null },
    },
    select: {
      userId: true,
      employerId: true,
      employer: { select: { tenantId: true } },
      role: { select: { permissions: true } },
    },
    orderBy: { createdAt: 'asc' },
  });
  const eligible = contacts.filter(
    (c): c is typeof c & { userId: string } =>
      Boolean(c.userId) &&
      Boolean(c.role) &&
      hasPermission(c.role!.permissions, 'crews.read') &&
      hasPermission(c.role!.permissions, 'crews.manage') &&
      hasPermission(c.role!.permissions, 'crews.record'),
  );
  if (eligible.length === 0) {
    throw new Error(
      'no accepted employer contact with crews permissions in the dev DB — ' +
        'onboard an employer and accept an owner contact, then retry',
    );
  }
  // Prefer an employer that already has applications — the flow needs a
  // hireable worker for the crew foreman and shift assignments.
  for (const contact of eligible) {
    const appCount = await prisma.application.count({
      where: { deletedAt: null, job: { employerId: contact.employerId, deletedAt: null } },
    });
    if (appCount > 0) {
      return {
        userId: contact.userId,
        employerId: contact.employerId,
        tenantId: contact.employer.tenantId,
      };
    }
  }
  // None have applications: fall back to the first eligible employer and let
  // findOrCreateActiveHire surface the seed instruction.
  const first = eligible[0]!;
  return {
    userId: first.userId,
    employerId: first.employerId,
    tenantId: first.employer.tenantId,
  };
}

type HireFixture = {
  workerUserId: string;
  jobId: string;
  applicationId: string | null;
  originalStatus: AppStatus | null;
};

async function findOrCreateActiveHire(
  employerId: string,
  _tenantId: string,
): Promise<HireFixture> {
  // Prefer an existing hired application.
  const existing = await prisma.application.findFirst({
    where: {
      status: AppStatus.hired,
      deletedAt: null,
      job: { employerId, deletedAt: null },
    },
    select: { id: true, workerId: true, jobId: true, status: true },
  });
  if (existing) {
    return {
      workerUserId: existing.workerId,
      jobId: existing.jobId,
      applicationId: existing.id,
      originalStatus: existing.status,
    };
  }

  // Otherwise: borrow any existing application for this employer and flip
  // its status to `hired` for the duration of the test. Restored on cleanup.
  const candidate = await prisma.application.findFirst({
    where: {
      deletedAt: null,
      job: { employerId, deletedAt: null },
    },
    select: { id: true, workerId: true, jobId: true, status: true },
  });
  if (!candidate) {
    throw new Error(
      'no applications exist for this employer — run packages/db/scripts/seed-test-applicant.ts and retry',
    );
  }
  // DB constraint: status=hired requires a wage_offered. Borrow the job's
  // wageMin so the constraint passes; restored at end.
  const job = await prisma.jobPosting.findUnique({
    where: { id: candidate.jobId },
    select: { wageMin: true },
  });
  await prisma.application.update({
    where: { id: candidate.id },
    data: {
      status: AppStatus.hired,
      wageOffered: job?.wageMin ?? 15,
      hiredAt: new Date(),
    },
  });
  return {
    workerUserId: candidate.workerId,
    jobId: candidate.jobId,
    applicationId: candidate.id,
    originalStatus: candidate.status,
  };
}

async function restoreHire(fix: HireFixture): Promise<void> {
  if (!fix.applicationId || !fix.originalStatus) return;
  if (fix.originalStatus === AppStatus.hired) return;
  await prisma.application.update({
    where: { id: fix.applicationId },
    data: { status: fix.originalStatus, wageOffered: null, hiredAt: null },
  });
}

async function main(): Promise<void> {
  console.log(`\n[${TAG}] starting crews/shifts flow validation\n`);

  const { userId, employerId, tenantId } = await findOrCreateEmployer();
  console.log(`  user: ${userId}  employer: ${employerId}  tenant: ${tenantId}`);

  const hire = await findOrCreateActiveHire(employerId, tenantId);
  const { workerUserId, jobId } = hire;
  console.log(`  active hire: ${workerUserId}  job: ${jobId}`);

  // Bypass Clerk by injecting `clerkAuth` directly (a function that
  // @clerk/hono's getAuth() will call). The real `requireAuth` middleware
  // runs after, hitting Prisma + RLS exactly like in production. Audit
  // sink is stubbed; everything else is the real chain.
  const mockAuth = createMiddleware(async (c, next) => {
    c.set('clerkAuth', () => ({ userId }));
    c.set('audit', { log: async () => {} });
    await next();
  });

  const app = new Hono();
  app.use('*', mockAuth);
  app.route('/v1/employer/crews', employerCrewsRoutes as never);
  app.route('/v1/employer/shifts', employerShiftsRoutes as never);
  app.route('/v1/employer/hires', employerHiresRoutes as never);
  app.route('/v1/employer/weather', employerWeatherRoutes as never);

  async function call(
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    path: string,
    body?: unknown,
  ): Promise<{ status: number; body: { ok: boolean; data?: unknown; error?: { code: string } } }> {
    const headers: Record<string, string> = { 'X-Employer-Id': employerId };
    if (body) headers['content-type'] = 'application/json';
    const init: RequestInit = { method, headers };
    if (body) init.body = JSON.stringify(body);
    const res = await app.request(`http://x${path}`, init);
    return { status: res.status, body: await res.json() };
  }

  const tracked = {
    crewIds: [] as string[],
    shiftIds: [] as string[],
    seriesIds: [] as string[],
  };

  // 1. GET /v1/employer/hires
  {
    const { status, body } = await call('GET', '/v1/employer/hires');
    assert('GET /hires returns 200', status === 200);
    const data = body.data as { workers: { workerUserId: string }[] };
    assert(
      'GET /hires includes our active hire',
      data?.workers?.some((w) => w.workerUserId === workerUserId),
    );
  }

  // 2. POST /v1/employer/crews
  let crewId = '';
  {
    const { status, body } = await call('POST', '/v1/employer/crews', {
      name: `${TAG} crew`,
      color: 'grape',
      foremanUserId: workerUserId,
      jobId,
      notes: 'seeded by validate-crews-flow',
    });
    assert('POST /crews returns 200', status === 200, `got ${status} ${JSON.stringify(body)}`);
    const crew = (body.data as { crew: { id: string; foremanUserId: string; memberCount: number } })
      .crew;
    assert('POST /crews returns id', Boolean(crew?.id));
    assert('POST /crews persists foremanUserId', crew.foremanUserId === workerUserId);
    assert('POST /crews seeds foreman as member (count=1)', crew.memberCount === 1);
    crewId = crew.id;
    tracked.crewIds.push(crewId);
  }

  // 3. GET /v1/employer/crews — should include the new crew with foremanName
  {
    const { status, body } = await call('GET', '/v1/employer/crews');
    assert('GET /crews returns 200', status === 200);
    const list = (body.data as { crews: Array<{ id: string; foremanName: string | null; jobTitle: string | null }> })
      .crews;
    const found = list.find((c) => c.id === crewId);
    assert('GET /crews includes new crew', Boolean(found));
    assert('GET /crews returns foremanName (not null)', !!found?.foremanName);
    assert('GET /crews returns jobTitle (not null)', !!found?.jobTitle);
  }

  // 4. GET /v1/employer/crews/:id — detail returns members
  {
    const { status, body } = await call('GET', `/v1/employer/crews/${crewId}`);
    assert('GET /crews/:id returns 200', status === 200);
    const data = body.data as {
      crew: { foremanName: string | null };
      members: Array<{ workerUserId: string; role: 'lead' | 'member' }>;
    };
    assert('GET /crews/:id returns foremanName', !!data.crew.foremanName);
    assert(
      'GET /crews/:id returns 1 member (the foreman)',
      data.members.length === 1 && data.members[0]?.role === 'lead',
    );
  }

  // 5. PATCH /v1/employer/crews/:id — change name + color, verify counts
  {
    const newName = `${TAG} crew · renamed`;
    const { status, body } = await call('PATCH', `/v1/employer/crews/${crewId}`, {
      name: newName,
      color: 'almond',
    });
    assert('PATCH /crews/:id returns 200', status === 200);
    const crew = (body.data as { crew: { name: string; color: string; memberCount: number; foremanName: string | null } })
      .crew;
    assert('PATCH /crews/:id name persisted', crew.name === newName);
    assert('PATCH /crews/:id color persisted', crew.color === 'almond');
    assert('PATCH /crews/:id memberCount stays correct (no longer 0)', crew.memberCount === 1);
    assert('PATCH /crews/:id still threads foremanName', !!crew.foremanName);
  }

  // 6. DELETE /v1/employer/crews/:id/members/:userId — leave the foreman seat
  {
    const { status } = await call(
      'DELETE',
      `/v1/employer/crews/${crewId}/members/${workerUserId}`,
    );
    assert('DELETE /crews/:id/members/:userId returns 200', status === 200);
    // Crew foremanUserId should null because we removed the foreman
    const crew = await prisma.crew.findUnique({ where: { id: crewId } });
    assert('removing the foreman nulls foremanUserId', crew?.foremanUserId === null);
  }

  // 7. POST /v1/employer/crews/:id/members — re-add as member
  {
    const { status, body } = await call('POST', `/v1/employer/crews/${crewId}/members`, {
      workerUserId,
      role: 'member',
    });
    assert('POST /crews/:id/members returns 200', status === 200);
    const member = (body.data as { member: { role: 'lead' | 'member' } }).member;
    assert('POST /crews/:id/members defaults to member role', member.role === 'member');
  }

  // 8. POST /v1/employer/crews/:id/foreman — promote member back to lead
  {
    const { status, body } = await call('POST', `/v1/employer/crews/${crewId}/foreman`, {
      workerUserId,
    });
    assert('POST /crews/:id/foreman returns 200', status === 200);
    const crew = (body.data as {
      crew: {
        foremanUserId: string;
        foremanName: string | null;
        memberCount: number;
        activeMemberCount: number;
      };
    }).crew;
    assert('POST /crews/:id/foreman sets foremanUserId', crew.foremanUserId === workerUserId);
    assert('POST /crews/:id/foreman threads foremanName', !!crew.foremanName);
    // Pre-fix this returned 0 unconditionally (the bug). Post-fix it returns
    // the real total which includes any leftAt-set rows from prior removals.
    assert(
      'POST /crews/:id/foreman returns non-zero memberCount (count-shape bug fix)',
      crew.memberCount > 0,
    );
    assert(
      'POST /crews/:id/foreman returns activeMemberCount === 1',
      crew.activeMemberCount === 1,
    );
  }

  // 9. POST /v1/employer/shifts — create a shift on this crew
  let shiftId = '';
  {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const dateStr = today.toISOString().slice(0, 10);
    const { status, body } = await call('POST', '/v1/employer/shifts', {
      crewId,
      shiftDate: dateStr,
      startTime: '06:00',
      endTime: '14:00',
      locationLabel: 'Block 7-North',
      shiftType: 'work',
      metadata: {
        pickup: { enabled: true, label: 'Hwy 99 turnout · 5:30 AM' },
        equipmentProvided: true,
        lunchProvided: true,
      },
      notes: TAG,
      assignWorkerUserIds: [workerUserId],
    });
    assert('POST /shifts returns 200', status === 200, `got ${status} ${JSON.stringify(body)}`);
    const shift = (body.data as {
      shift: {
        id: string;
        assignedCount: number;
        status: string;
        shiftType: string;
        metadata: { pickup?: { enabled: boolean } };
      };
    }).shift;
    shiftId = shift.id;
    tracked.shiftIds.push(shiftId);
    assert('POST /shifts assigns worker via assignWorkerUserIds', shift.assignedCount === 1);
    assert('POST /shifts defaults status=scheduled', shift.status === 'scheduled');
    assert('POST /shifts persists shiftType', shift.shiftType === 'work');
    assert('POST /shifts persists metadata.pickup', shift.metadata.pickup?.enabled === true);
  }

  // 10. GET /v1/employer/shifts — week filter includes today
  {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const { status, body } = await call(
      'GET',
      `/v1/employer/shifts?from=${today}&to=${tomorrow}`,
    );
    assert('GET /shifts returns 200', status === 200);
    const list = (body.data as { shifts: Array<{ id: string }> }).shifts;
    assert('GET /shifts includes new shift', list.some((s) => s.id === shiftId));
  }

  // 11. GET /v1/employer/shifts/:id — detail returns assignments
  let assignmentId = '';
  {
    const { status, body } = await call('GET', `/v1/employer/shifts/${shiftId}`);
    assert('GET /shifts/:id returns 200', status === 200);
    const data = body.data as {
      shift: { crewId: string };
      assignments: Array<{ id: string; workerUserId: string; status: string }>;
    };
    assert('GET /shifts/:id returns 1 assignment', data.assignments.length === 1);
    assert(
      'GET /shifts/:id assignment matches our worker',
      data.assignments[0]?.workerUserId === workerUserId,
    );
    assignmentId = data.assignments[0]?.id ?? '';
  }

  // 12. PATCH /v1/employer/shifts/:id/assignments/:aId — confirm worker
  {
    const { status, body } = await call(
      'PATCH',
      `/v1/employer/shifts/${shiftId}/assignments/${assignmentId}`,
      { status: 'confirmed' },
    );
    assert('PATCH assignment status returns 200', status === 200);
    const a = (body.data as { assignment: { status: string } }).assignment;
    assert('PATCH assignment status persists', a.status === 'confirmed');
  }

  // 13. PATCH /v1/employer/shifts/:id — change time + status + shiftType + metadata + notify flag
  {
    const { status, body } = await call('PATCH', `/v1/employer/shifts/${shiftId}`, {
      startTime: '07:00',
      endTime: '15:00',
      status: 'in_progress',
      shiftType: 'training',
      metadata: {
        safety: { wpsCleared: true, ppeBriefingDone: true },
        notifications: { smsEveningBefore: true, foremanRollCall: true },
        heatAdvisoryAutoApply: true,
        heatAdvisoryForecastF: 102,
      },
      notifyCrew: false,
    });
    assert('PATCH /shifts/:id returns 200', status === 200);
    const shift = (body.data as {
      shift: {
        startTime: string;
        status: string;
        shiftType: string;
        metadata: {
          safety?: { wpsCleared?: boolean };
          heatAdvisoryForecastF?: number;
        };
      };
    }).shift;
    assert('PATCH /shifts/:id startTime persists', shift.startTime === '07:00');
    assert('PATCH /shifts/:id status persists', shift.status === 'in_progress');
    assert('PATCH /shifts/:id shiftType persists', shift.shiftType === 'training');
    assert(
      'PATCH /shifts/:id metadata.safety persists',
      shift.metadata.safety?.wpsCleared === true,
    );
    assert(
      'PATCH /shifts/:id metadata.heatAdvisoryForecastF persists',
      shift.metadata.heatAdvisoryForecastF === 102,
    );
  }

  // 13b. POST /v1/employer/shifts/series — materialize a shift per matching
  // weekday across a date range, all linked to one shift_series row.
  {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const rangeStart = new Date(today.getTime() + 86400000).toISOString().slice(0, 10);
    const rangeEnd = new Date(today.getTime() + 14 * 86400000).toISOString().slice(0, 10);
    // Monday-indexed mask: Mon, Wed, Fri.
    const weekdayMask = [true, false, true, false, true, false, false];
    const before = await prisma.shift.count({
      where: { employerId, crewId, startTime: '05:30' },
    });
    const { status, body } = await call('POST', '/v1/employer/shifts/series', {
      crewId,
      rangeStart,
      rangeEnd,
      weekdayMask,
      startTime: '05:30',
      endTime: '13:30',
      locationLabel: `${TAG} Series Block`,
    });
    assert('POST /shifts/series returns 200', status === 200);
    const result = body.data as { series: { id: string }; shiftCount: number };
    assert('POST /shifts/series reports a shiftCount', result.shiftCount > 0);
    const after = await prisma.shift.count({
      where: { employerId, crewId, startTime: '05:30' },
    });
    assert(
      'POST /shifts/series materializes one shift per matching date',
      after === before + result.shiftCount,
      `before=${before} after=${after} count=${result.shiftCount}`,
    );
    const seriesShifts = await prisma.shift.findMany({
      where: { seriesId: result.series.id },
      select: { id: true },
    });
    assert(
      'Series shifts all link back to the series',
      seriesShifts.length === result.shiftCount,
    );
    tracked.seriesIds.push(result.series.id);
    for (const s of seriesShifts) tracked.shiftIds.push(s.id);
  }

  // 13c. POST /v1/employer/shifts/:id/duplicate — copy to a new date
  {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    const dupDate = new Date(today.getTime() + 5 * 86400000).toISOString().slice(0, 10);
    const { status, body } = await call(
      'POST',
      `/v1/employer/shifts/${shiftId}/duplicate`,
      { shiftDate: dupDate },
    );
    assert('POST /shifts/:id/duplicate returns 200', status === 200);
    const dup = (body.data as {
      shift: { id: string; shiftDate: string; shiftType: string; startTime: string };
    }).shift;
    assert('Duplicate has new id', dup.id !== shiftId);
    assert('Duplicate keeps shiftType', dup.shiftType === 'training');
    assert('Duplicate keeps startTime', dup.startTime === '07:00');
    assert('Duplicate uses new date', dup.shiftDate === dupDate);
    tracked.shiftIds.push(dup.id);
  }

  // 14. DELETE /v1/employer/shifts/:id — cancel
  {
    const { status } = await call('DELETE', `/v1/employer/shifts/${shiftId}`);
    assert('DELETE /shifts/:id returns 200', status === 200);
    const shift = await prisma.shift.findUnique({ where: { id: shiftId } });
    assert('DELETE /shifts/:id soft-cancels (status=cancelled)', shift?.status === 'cancelled');
  }

  // 15. DELETE /v1/employer/crews/:id — archive
  {
    const { status } = await call('DELETE', `/v1/employer/crews/${crewId}`);
    assert('DELETE /crews/:id returns 200', status === 200);
    const crew = await prisma.crew.findUnique({ where: { id: crewId } });
    assert('DELETE /crews/:id soft-deletes (deletedAt set)', !!crew?.deletedAt);
  }

  // 15b. GET /v1/employer/weather/forecast — real NWS lookup against Fresno
  {
    const today = new Date();
    today.setUTCDate(today.getUTCDate() + 1);
    const date = today.toISOString().slice(0, 10);
    const lat = 36.74;
    const lng = -119.78;
    const { status, body } = await call(
      'GET',
      `/v1/employer/weather/forecast?lat=${lat}&lng=${lng}&date=${date}`,
    );
    assert('GET /weather/forecast returns 200', status === 200);
    const data = body.data as {
      highTempF: number | null;
      condition: string | null;
      source: string;
    };
    assert('GET /weather/forecast returns source=nws', data?.source === 'nws');
    if (data?.highTempF != null) {
      assert(
        'GET /weather/forecast returns plausible Central Valley temperature',
        data.highTempF > 30 && data.highTempF < 130,
        `got ${data.highTempF}`,
      );
    } else {
      console.log(
        '  warn  GET /weather/forecast NWS returned no daytime period — network or upstream issue, not a regression',
      );
    }
  }

  // 16. GET /v1/employer/crews — archived crew is filtered out
  {
    const { status, body } = await call('GET', '/v1/employer/crews');
    assert('GET /crews returns 200 after archive', status === 200);
    const list = (body.data as { crews: Array<{ id: string }> }).crews;
    assert('GET /crews omits archived crew', !list.some((c) => c.id === crewId));
  }

  // ── cleanup ────────────────────────────────────────────────────────────
  // The shifts and crews are soft-deleted; for a tidy run we hard-delete the
  // crew_members and shift_assignments rows we created so the dev DB isn't
  // littered with TAG-marked rows.
  for (const sid of tracked.shiftIds) {
    await prisma.shiftAssignment.deleteMany({ where: { shiftId: sid } });
    await prisma.shift.delete({ where: { id: sid } }).catch(() => undefined);
  }
  for (const seriesId of tracked.seriesIds) {
    await prisma.shiftSeries.delete({ where: { id: seriesId } }).catch(() => undefined);
  }
  for (const cid of tracked.crewIds) {
    await prisma.crewMember.deleteMany({ where: { crewId: cid } });
    await prisma.crew.delete({ where: { id: cid } }).catch(() => undefined);
  }
  await restoreHire(hire);

  console.log(
    `\n[${TAG}] complete: ${passes.length} passed, ${failures.length} failed\n`,
  );
  if (failures.length) {
    console.log('Failures:');
    for (const f of failures) console.log(`  - ${f}`);
    process.exitCode = 1;
  }
}

await main();
await prisma.$disconnect();
