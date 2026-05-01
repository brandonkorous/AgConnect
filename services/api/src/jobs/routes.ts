import { Hono } from 'hono';
import { ok, err, validate } from '@agconn/api-client/server';
import { County, JobStatus, type Tx } from '@agconn/db';
import {
  CreateSavedSearchBody,
  JobsQuery,
  PatchSavedSearchBody,
  SavedSearchFiltersSchema,
} from '@agconn/schemas';
import { requireAuth, type AuthVars } from '../middleware/authContext';
import type { AuditCtxVars } from '../middleware/audit';

export const jobsRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();

// All worker-facing job routes require auth. Public/anonymous browsing
// is served via Next.js RSC reading directly through the service-role tenant
// middleware (separate router); not built here.
jobsRoutes.use('*', requireAuth);

jobsRoutes.get('/', validate('query', JobsQuery), async (c) => {
  const q = c.var.body;
  const tenantId = c.var.tenantId;
  if (!tenantId) return err(c, 403, 'no_tenant');

  const limit = q.limit;
  const cursor = q.cursor ? decodeCursor(q.cursor) : null;

  const counties = q.county?.length ? (q.county as County[]) : null;

  const where = {
    tenantId,
    status: JobStatus.active,
    deletedAt: null,
    ...(counties ? { county: { in: counties } } : {}),
    ...(q.skills?.length ? { skills: { hasSome: q.skills } } : {}),
    ...(q.wageMin !== undefined ? { wageMax: { gte: q.wageMin } } : {}),
    ...(q.wageMax !== undefined ? { wageMin: { lte: q.wageMax } } : {}),
    ...(q.startBefore ? { startDate: { lte: new Date(q.startBefore) } } : {}),
    ...(q.startAfter ? { startDate: { gte: new Date(q.startAfter) } } : {}),
    ...(q.q
      ? {
          OR: [
            { titleEn: { contains: q.q, mode: 'insensitive' as const } },
            { titleEs: { contains: q.q, mode: 'insensitive' as const } },
            { descriptionEn: { contains: q.q, mode: 'insensitive' as const } },
            { descriptionEs: { contains: q.q, mode: 'insensitive' as const } },
          ],
        }
      : {}),
    ...(cursor
      ? {
          OR: [
            { createdAt: { lt: cursor.createdAt } },
            { createdAt: cursor.createdAt, id: { lt: cursor.id } },
          ],
        }
      : {}),
  };

  const rows = await c.var.db.jobPosting.findMany({
    where,
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit + 1,
    include: {
      employer: { include: { employerProfile: true } },
    },
  });

  const slice = rows.slice(0, limit);
  const hasMore = rows.length > limit;
  const last = slice[slice.length - 1];
  const nextCursor =
    hasMore && last ? encodeCursor({ createdAt: last.createdAt, id: last.id }) : null;

  // Lightweight analytics for content-gap detection.
  await c.var.db.searchView.create({
    data: {
      tenantId,
      workerId: c.var.userId,
      filters: q as object,
      resultCount: slice.length,
    },
  });

  return ok(c, {
    jobs: slice.map((j) => shapeJobCard(j)),
    nextCursor,
  });
});

jobsRoutes.get('/recommended', async (c) => {
  const tenantId = c.var.tenantId;
  if (!tenantId) return err(c, 403, 'no_tenant');
  const profile = await c.var.db.workerProfile.findUnique({ where: { id: c.var.userId } });
  if (!profile?.county) return ok(c, { jobs: [] });

  const rows = await c.var.db.jobPosting.findMany({
    where: {
      tenantId,
      status: JobStatus.active,
      deletedAt: null,
      county: profile.county,
    },
    orderBy: [{ createdAt: 'desc' }],
    take: 30,
    include: { employer: { include: { employerProfile: true } } },
  });

  const ranked = rows
    .map((j) => ({
      ...j,
      matchScore: j.skills.filter((s) => profile.skills.includes(s)).length,
    }))
    .sort(
      (a, b) =>
        b.matchScore - a.matchScore || b.createdAt.getTime() - a.createdAt.getTime(),
    )
    .slice(0, 5);

  return ok(c, {
    jobs: ranked.map((j) => ({ ...shapeJobCard(j), matchScore: j.matchScore })),
  });
});

jobsRoutes.get('/:slug', async (c) => {
  const tenantId = c.var.tenantId;
  if (!tenantId) return err(c, 403, 'no_tenant');
  const slug = c.req.param('slug');
  const job = await c.var.db.jobPosting.findFirst({
    where: { tenantId, seoSlug: slug, deletedAt: null },
    include: { employer: { include: { employerProfile: true } } },
  });
  if (!job) return err(c, 404, 'not_found');

  const application = await c.var.db.application.findFirst({
    where: { jobId: job.id, workerId: c.var.userId, deletedAt: null },
  });

  return ok(c, {
    ...shapeJobCard(job),
    descriptionEn: job.descriptionEn,
    descriptionEs: job.descriptionEs,
    applyBy: job.applyBy?.toISOString().slice(0, 10) ?? null,
    status: job.status,
    publishedAt: job.publishedAt?.toISOString() ?? null,
    applicationStatus: application?.status ?? null,
    applicationId: application?.id ?? null,
  });
});

// Saved searches -----------------------------------------------------------

export const savedSearchRoutes = new Hono<{ Variables: AuthVars & AuditCtxVars }>();
savedSearchRoutes.use('*', requireAuth);

savedSearchRoutes.get('/', async (c) => {
  const rows = await c.var.db.savedSearch.findMany({
    where: { workerId: c.var.userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });
  return ok(c, {
    savedSearches: rows.map(shapeSavedSearch),
  });
});

savedSearchRoutes.post('/', validate('json', CreateSavedSearchBody), async (c) => {
  const tenantId = c.var.tenantId;
  if (!tenantId) return err(c, 403, 'no_tenant');
  const body = c.var.body;

  if (body.alertChannel === 'sms' || body.alertChannel === 'both') {
    const user = await c.var.db.user.findUnique({ where: { id: c.var.userId } });
    if (!user?.phone) return err(c, 422, 'validation_failed', 'phone_required');
  }

  const created = await c.var.db.savedSearch.create({
    data: {
      tenantId,
      workerId: c.var.userId,
      name: body.name ?? null,
      filters: body.filters as object,
      alertChannel: body.alertChannel,
      alertActive: body.alertActive,
    },
  });

  await c.var.audit.log({
    action: 'worker.profile.updated',
    resourceId: c.var.userId,
    metadata: { fields: 'saved_search.create' },
  });

  return ok(c, shapeSavedSearch(created));
});

savedSearchRoutes.patch('/:id', validate('json', PatchSavedSearchBody), async (c) => {
  const id = c.req.param('id');
  const body = c.var.body;
  const existing = await c.var.db.savedSearch.findFirst({
    where: { id, workerId: c.var.userId, deletedAt: null },
  });
  if (!existing) return err(c, 404, 'not_found');

  const updated = await c.var.db.savedSearch.update({
    where: { id },
    data: {
      name: body.name === null ? null : body.name ?? undefined,
      filters: body.filters as object | undefined,
      alertChannel: body.alertChannel ?? undefined,
      alertActive: body.alertActive ?? undefined,
    },
  });
  return ok(c, shapeSavedSearch(updated));
});

savedSearchRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const existing = await c.var.db.savedSearch.findFirst({
    where: { id, workerId: c.var.userId, deletedAt: null },
  });
  if (!existing) return err(c, 404, 'not_found');
  await c.var.db.savedSearch.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  await c.var.audit.log({
    action: 'worker.profile.updated',
    resourceId: c.var.userId,
    metadata: { fields: 'saved_search.delete' },
  });
  return ok(c, { ok: true });
});

// Helpers ------------------------------------------------------------------

function shapeJobCard(j: {
  id: string;
  seoSlug: string;
  titleEn: string;
  titleEs: string;
  county: County;
  city: string | null;
  wageMin: { toString: () => string } | number;
  wageMax: { toString: () => string } | number;
  wageUnit: string;
  startDate: Date;
  endDate: Date | null;
  skills: string[];
  housing: boolean;
  transport: boolean;
  createdAt: Date;
  employer: {
    employerProfile: { legalName: string } | null;
    email: string | null;
  } | null;
}) {
  return {
    id: j.id,
    seoSlug: j.seoSlug,
    titleEn: j.titleEn,
    titleEs: j.titleEs,
    county: j.county,
    city: j.city,
    wageMin: Number(j.wageMin.toString()),
    wageMax: Number(j.wageMax.toString()),
    wageUnit: j.wageUnit,
    startDate: j.startDate.toISOString().slice(0, 10),
    endDate: j.endDate ? j.endDate.toISOString().slice(0, 10) : null,
    employerName: j.employer?.employerProfile?.legalName ?? 'AgConn employer',
    employerVerified: Boolean(j.employer?.employerProfile),
    skills: j.skills,
    housing: j.housing,
    transport: j.transport,
    createdAt: j.createdAt.toISOString(),
  };
}

function shapeSavedSearch(s: {
  id: string;
  name: string | null;
  filters: unknown;
  alertChannel: string;
  alertActive: boolean;
  lastNotifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: s.id,
    name: s.name,
    filters: s.filters,
    alertChannel: s.alertChannel,
    alertActive: s.alertActive,
    lastNotifiedAt: s.lastNotifiedAt?.toISOString() ?? null,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

function encodeCursor(cur: { createdAt: Date; id: string }): string {
  return Buffer.from(`${cur.createdAt.toISOString()}|${cur.id}`).toString('base64url');
}

function decodeCursor(s: string): { createdAt: Date; id: string } | null {
  try {
    const decoded = Buffer.from(s, 'base64url').toString('utf8');
    const [iso, id] = decoded.split('|');
    if (!iso || !id) return null;
    return { createdAt: new Date(iso), id };
  } catch {
    return null;
  }
}

// Tx export for callers (unused; kept for parity with other route files).
export type _Tx = Tx;
