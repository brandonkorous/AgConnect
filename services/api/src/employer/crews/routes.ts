import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { CrewMemberRole, AppStatus, type Tx } from '@agconn/db';
import {
  CreateCrewBody,
  PatchCrewBody,
  AddCrewMemberBody,
  SetForemanBody,
} from '@agconn/schemas';
import {
  requireAuth,
  requireRole,
  requireTenant,
  type AuthVars,
} from '../../middleware/authContext.js';
import type { AuditCtxVars } from '../../middleware/audit.js';
import { shapeCrew, shapeMember } from './shape.js';

export const employerCrewsRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
employerCrewsRoutes.use('*', requireAuth('crews'));
employerCrewsRoutes.use('*', requireRole('employer'));
employerCrewsRoutes.use('*', requireTenant);

employerCrewsRoutes.get('/', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const locale = (c.req.header('accept-language') ?? '').toLowerCase().startsWith('es')
    ? 'es'
    : 'en';

  const crews = await c.var.db.crew.findMany({
    where: { employerId: userId, tenantId, deletedAt: null },
    orderBy: [{ createdAt: 'asc' }],
    include: {
      _count: { select: { members: true } },
      members: { where: { leftAt: null }, select: { id: true } },
      foreman: { include: { workerProfile: true } },
    },
  });

  const jobIds = crews
    .map((c) => c.jobId)
    .filter((x): x is string => Boolean(x));
  const jobsById = await fetchJobTitles(c.var.db as unknown as Tx, jobIds);

  return ok(c, {
    crews: crews.map((cr) =>
      shapeCrew(cr, {
        memberCount: cr._count.members,
        activeMemberCount: cr.members.length,
        foremanName: foremanDisplayName(cr.foreman?.workerProfile),
        jobTitle: cr.jobId ? pickJobTitle(jobsById.get(cr.jobId), locale) : null,
      }),
    ),
  });
});

employerCrewsRoutes.post('/', validate('json', CreateCrewBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const body = c.var.body;

  if (body.foremanUserId) {
    const ok2 = await isActiveHire(c.var.db as unknown as Tx, userId, body.foremanUserId);
    if (!ok2) return err(c, 422, 'worker_not_active_hire');
  }

  const created = await c.var.db.crew.create({
    data: {
      tenantId,
      employerId: userId,
      foremanUserId: body.foremanUserId ?? null,
      jobId: body.jobId ?? null,
      name: body.name,
      shortCode: body.shortCode ?? null,
      crewType: body.crewType ?? null,
      primaryCrop: body.primaryCrop ?? null,
      color: body.color,
      requiredSkills: body.requiredSkills ?? [],
      baseWageCents: body.baseWageCents ?? null,
      pieceRateCents: body.pieceRateCents ?? null,
      pieceRateUnit: body.pieceRateUnit ?? null,
      foremanPremiumCents: body.foremanPremiumCents ?? null,
      commsChannels: body.commsChannels ?? {},
      notes: body.notes ?? null,
    },
  });

  if (body.foremanUserId) {
    await c.var.db.crewMember.create({
      data: {
        tenantId,
        crewId: created.id,
        workerUserId: body.foremanUserId,
        role: CrewMemberRole.lead,
      },
    });
  }

  await c.var.audit.log({
    action: 'employer.crew.created',
    resourceId: created.id,
    metadata: { crewId: created.id, name: created.name },
  });

  return ok(c, { crew: shapeCrew(created, { memberCount: body.foremanUserId ? 1 : 0, activeMemberCount: body.foremanUserId ? 1 : 0 }) });
});

employerCrewsRoutes.get('/:id', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const locale = (c.req.header('accept-language') ?? '').toLowerCase().startsWith('es')
    ? 'es'
    : 'en';

  const crew = await c.var.db.crew.findFirst({
    where: { id, employerId: userId, tenantId, deletedAt: null },
    include: {
      members: {
        where: { leftAt: null },
        include: { worker: { include: { workerProfile: true } } },
        orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
      },
      foreman: { include: { workerProfile: true } },
    },
  });
  if (!crew) return err(c, 404, 'not_found');

  const jobsById = await fetchJobTitles(
    c.var.db as unknown as Tx,
    crew.jobId ? [crew.jobId] : [],
  );

  return ok(c, {
    crew: shapeCrew(crew, {
      memberCount: crew.members.length,
      activeMemberCount: crew.members.length,
      foremanName: foremanDisplayName(crew.foreman?.workerProfile),
      jobTitle: crew.jobId ? pickJobTitle(jobsById.get(crew.jobId), locale) : null,
    }),
    members: crew.members.map((m) =>
      shapeMember(m, m.worker.workerProfile?.firstName ?? '', m.worker.workerProfile?.lastName ?? ''),
    ),
  });
});

employerCrewsRoutes.patch('/:id', validate('json', PatchCrewBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');
  const body = c.var.body;

  const existing = await c.var.db.crew.findFirst({
    where: { id, employerId: userId, tenantId, deletedAt: null },
  });
  if (!existing) return err(c, 404, 'not_found');

  const locale = (c.req.header('accept-language') ?? '').toLowerCase().startsWith('es')
    ? 'es'
    : 'en';

  const updated = await c.var.db.crew.update({
    where: { id },
    data: {
      name: body.name ?? undefined,
      color: body.color ?? undefined,
      shortCode: body.shortCode === null ? null : (body.shortCode ?? undefined),
      crewType: body.crewType === null ? null : (body.crewType ?? undefined),
      primaryCrop: body.primaryCrop === null ? null : (body.primaryCrop ?? undefined),
      foremanUserId: body.foremanUserId === null ? null : (body.foremanUserId ?? undefined),
      jobId: body.jobId === null ? null : (body.jobId ?? undefined),
      requiredSkills: body.requiredSkills ?? undefined,
      baseWageCents: body.baseWageCents === null ? null : (body.baseWageCents ?? undefined),
      pieceRateCents: body.pieceRateCents === null ? null : (body.pieceRateCents ?? undefined),
      pieceRateUnit: body.pieceRateUnit === null ? null : (body.pieceRateUnit ?? undefined),
      foremanPremiumCents:
        body.foremanPremiumCents === null ? null : (body.foremanPremiumCents ?? undefined),
      commsChannels: body.commsChannels ?? undefined,
      notes: body.notes === null ? null : (body.notes ?? undefined),
    },
    include: {
      _count: { select: { members: true } },
      members: { where: { leftAt: null }, select: { id: true } },
      foreman: { include: { workerProfile: true } },
    },
  });

  await c.var.audit.log({
    action: 'employer.crew.updated',
    resourceId: id,
    metadata: { crewId: id, fields: Object.keys(body) },
  });

  const jobsById = await fetchJobTitles(
    c.var.db as unknown as Tx,
    updated.jobId ? [updated.jobId] : [],
  );

  return ok(c, {
    crew: shapeCrew(updated, {
      memberCount: updated._count.members,
      activeMemberCount: updated.members.length,
      foremanName: foremanDisplayName(updated.foreman?.workerProfile),
      jobTitle: updated.jobId ? pickJobTitle(jobsById.get(updated.jobId), locale) : null,
    }),
  });
});

employerCrewsRoutes.delete('/:id', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const existing = await c.var.db.crew.findFirst({
    where: { id, employerId: userId, tenantId, deletedAt: null },
  });
  if (!existing) return err(c, 404, 'not_found');

  await c.var.db.crew.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  await c.var.audit.log({
    action: 'employer.crew.archived',
    resourceId: id,
    metadata: { crewId: id },
  });

  return ok(c, { ok: true });
});

employerCrewsRoutes.post('/:id/members', validate('json', AddCrewMemberBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');
  const body = c.var.body;

  const crew = await c.var.db.crew.findFirst({
    where: { id, employerId: userId, tenantId, deletedAt: null },
  });
  if (!crew) return err(c, 404, 'not_found');

  const okHire = await isActiveHire(c.var.db as unknown as Tx, userId, body.workerUserId);
  if (!okHire) return err(c, 422, 'worker_not_active_hire');

  const existing = await c.var.db.crewMember.findFirst({
    where: { crewId: id, workerUserId: body.workerUserId, leftAt: null },
  });
  if (existing) return err(c, 409, 'already_member');

  const member = await c.var.db.crewMember.create({
    data: {
      tenantId,
      crewId: id,
      workerUserId: body.workerUserId,
      role: body.role === 'lead' ? CrewMemberRole.lead : CrewMemberRole.member,
    },
    include: { worker: { include: { workerProfile: true } } },
  });

  if (body.role === 'lead') {
    await c.var.db.crew.update({ where: { id }, data: { foremanUserId: body.workerUserId } });
  }

  await c.var.audit.log({
    action: 'employer.crew.member.added',
    resourceId: member.id,
    metadata: { crewId: id, workerUserId: body.workerUserId, role: body.role },
  });

  return ok(c, {
    member: shapeMember(
      member,
      member.worker.workerProfile?.firstName ?? '',
      member.worker.workerProfile?.lastName ?? '',
    ),
  });
});

employerCrewsRoutes.delete('/:id/members/:userId', async (c) => {
  const employerUserId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');
  const memberUserId = c.req.param('userId');

  const crew = await c.var.db.crew.findFirst({
    where: { id, employerId: employerUserId, tenantId, deletedAt: null },
  });
  if (!crew) return err(c, 404, 'not_found');

  const member = await c.var.db.crewMember.findFirst({
    where: { crewId: id, workerUserId: memberUserId, leftAt: null },
  });
  if (!member) return err(c, 404, 'not_found');

  await c.var.db.crewMember.update({
    where: { id: member.id },
    data: { leftAt: new Date() },
  });

  if (crew.foremanUserId === memberUserId) {
    await c.var.db.crew.update({ where: { id }, data: { foremanUserId: null } });
  }

  await c.var.audit.log({
    action: 'employer.crew.member.removed',
    resourceId: member.id,
    metadata: { crewId: id, workerUserId: memberUserId },
  });

  return ok(c, { ok: true });
});

employerCrewsRoutes.post('/:id/foreman', validate('json', SetForemanBody), async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');
  const body = c.var.body;

  const crew = await c.var.db.crew.findFirst({
    where: { id, employerId: userId, tenantId, deletedAt: null },
  });
  if (!crew) return err(c, 404, 'not_found');

  const okHire = await isActiveHire(c.var.db as unknown as Tx, userId, body.workerUserId);
  if (!okHire) return err(c, 422, 'worker_not_active_hire');

  await c.var.db.$transaction(async (tx) => {
    // Demote any current lead.
    await tx.crewMember.updateMany({
      where: { crewId: id, role: CrewMemberRole.lead, leftAt: null },
      data: { role: CrewMemberRole.member },
    });
    // Ensure target is an active member.
    const existing = await tx.crewMember.findFirst({
      where: { crewId: id, workerUserId: body.workerUserId, leftAt: null },
    });
    if (existing) {
      await tx.crewMember.update({ where: { id: existing.id }, data: { role: CrewMemberRole.lead } });
    } else {
      await tx.crewMember.create({
        data: {
          tenantId,
          crewId: id,
          workerUserId: body.workerUserId,
          role: CrewMemberRole.lead,
        },
      });
    }
    await tx.crew.update({ where: { id }, data: { foremanUserId: body.workerUserId } });
  });

  await c.var.audit.log({
    action: 'employer.crew.updated',
    resourceId: id,
    metadata: { crewId: id, fields: ['foremanUserId'] },
  });

  const locale = (c.req.header('accept-language') ?? '').toLowerCase().startsWith('es')
    ? 'es'
    : 'en';

  const updated = await c.var.db.crew.findUnique({
    where: { id },
    include: {
      _count: { select: { members: true } },
      members: { where: { leftAt: null }, select: { id: true } },
      foreman: { include: { workerProfile: true } },
    },
  });
  const jobsById = await fetchJobTitles(
    c.var.db as unknown as Tx,
    updated?.jobId ? [updated.jobId] : [],
  );
  return ok(c, {
    crew: shapeCrew(updated!, {
      memberCount: updated!._count.members,
      activeMemberCount: updated!.members.length,
      foremanName: foremanDisplayName(updated!.foreman?.workerProfile),
      jobTitle: updated!.jobId ? pickJobTitle(jobsById.get(updated!.jobId), locale) : null,
    }),
  });
});

// Right-rail insights: 14-day yield series + recent activity + skill coverage.
// All three are real reads (no fabricated data); empty results are returned as
// empty arrays for new crews with no shifts or audit history.
employerCrewsRoutes.get('/:id/insights', async (c) => {
  const userId = c.var.userId;
  const tenantId = c.var.tenantId!;
  const id = c.req.param('id');

  const crew = await c.var.db.crew.findFirst({
    where: { id, employerId: userId, tenantId, deletedAt: null },
    include: {
      members: {
        where: { leftAt: null },
        include: { worker: { include: { workerProfile: true } } },
      },
    },
  });
  if (!crew) return err(c, 404, 'not_found');

  // Yield over the trailing 14 days. Sum piecework counts per shift_date for
  // shifts owned by this crew. Returns one row per date with a non-zero sum.
  const today = new Date();
  const start = new Date(today);
  start.setUTCDate(today.getUTCDate() - 13);
  start.setUTCHours(0, 0, 0, 0);
  const startIso = start.toISOString().slice(0, 10);
  const endIso = today.toISOString().slice(0, 10);

  type YieldRow = { date: Date; pieces: bigint };
  const yieldRows = await c.var.db.$queryRaw<YieldRow[]>`
    SELECT s."shift_date" AS date, COALESCE(SUM(a."pieces_count"), 0)::bigint AS pieces
    FROM "shifts" s
    LEFT JOIN "shift_assignments" a ON a."shift_id" = s."id"
    WHERE s."crew_id" = ${id}::uuid
      AND s."tenant_id" = ${tenantId}::uuid
      AND s."shift_date" >= ${startIso}::date
      AND s."shift_date" <= ${endIso}::date
    GROUP BY s."shift_date"
    ORDER BY s."shift_date" ASC
  `;
  const yieldByDate = new Map<string, number>();
  for (const r of yieldRows) {
    const iso = new Date(r.date).toISOString().slice(0, 10);
    yieldByDate.set(iso, Number(r.pieces));
  }
  const yieldSeries: { date: string; pieces: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const iso = d.toISOString().slice(0, 10);
    yieldSeries.push({ date: iso, pieces: yieldByDate.get(iso) ?? 0 });
  }

  // Recent activity: audit events for this crew. The audit log writes
  // metadata.crewId on every crew action so we can filter cleanly. Limit 12.
  const activity = await c.var.db.auditEvent.findMany({
    where: {
      tenantId,
      action: { startsWith: 'employer.crew.' },
      metadata: { path: ['crewId'], equals: id },
    },
    orderBy: { occurredAt: 'desc' },
    take: 12,
    select: {
      id: true,
      action: true,
      occurredAt: true,
      actorId: true,
    },
  });

  // Skill coverage: how many active members claim each required skill in
  // their workerProfile.skills[] array. Always returns one entry per skill
  // the crew has set as required (empty if no required skills configured).
  const total = crew.members.length;
  const skillCoverage = (crew.requiredSkills ?? []).map((skill) => {
    const have = crew.members.filter((m) => {
      const profileSkills = m.worker.workerProfile?.skills ?? [];
      return profileSkills.includes(skill);
    }).length;
    return { skill, haveCount: have, totalCount: total };
  });

  return ok(c, {
    yield: yieldSeries,
    activity: activity.map((a) => ({
      id: String(a.id),
      action: a.action,
      occurredAt: a.occurredAt.toISOString(),
      actorId: a.actorId,
    })),
    skillCoverage,
  });
});

async function isActiveHire(db: Tx, employerUserId: string, workerUserId: string): Promise<boolean> {
  const hired = await db.application.findFirst({
    where: {
      workerId: workerUserId,
      status: AppStatus.hired,
      job: { employerId: employerUserId, deletedAt: null },
    },
    select: { id: true },
  });
  return Boolean(hired);
}

function foremanDisplayName(
  profile: { firstName?: string | null; lastName?: string | null } | null | undefined,
): string | null {
  if (!profile) return null;
  const first = profile.firstName ?? '';
  const last = profile.lastName ?? '';
  const display = `${first} ${last}`.trim();
  return display || null;
}

async function fetchJobTitles(
  db: Tx,
  jobIds: string[],
): Promise<Map<string, { titleEn: string; titleEs: string }>> {
  if (jobIds.length === 0) return new Map();
  const rows = await db.jobPosting.findMany({
    where: { id: { in: jobIds } },
    select: { id: true, titleEn: true, titleEs: true },
  });
  return new Map(rows.map((r) => [r.id, { titleEn: r.titleEn, titleEs: r.titleEs }]));
}

function pickJobTitle(
  row: { titleEn: string; titleEs: string } | undefined,
  locale: 'en' | 'es',
): string | null {
  if (!row) return null;
  return locale === 'es' ? row.titleEs : row.titleEn;
}
